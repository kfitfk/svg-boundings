'use strict';

var BoundingMode = {
  'STANDARD': 'BoundingModeStandard',
  'STRAIGHTEN': 'BoundingModeStraighten'
};

var MIN_X = 'minX';
var MAX_X = 'maxX';
var MIN_Y = 'minY';
var MAX_Y = 'maxY';

/**
 * expand the x-bounds, if the value lies outside the bounding box
 */
function expandXBounds(bounds, value) {
  if (bounds[MIN_X] > value) bounds[MIN_X] = value;
  else if (bounds[MAX_X] < value) bounds[MAX_X] = value;
}

/**
 * expand the y-bounds, if the value lies outside the bounding box
 */
function expandYBounds(bounds, value) {
  if (bounds[MIN_Y] > value) bounds[MIN_Y] = value;
  else if (bounds[MAX_Y] < value) bounds[MAX_Y] = value;
}

/**
 * Calculate the bezier value for one dimension at distance 't'
 */
function calculateBezier(t, p0, p1, p2, p3) {
  var mt = 1-t;
  return (mt*mt*mt*p0) + (3*mt*mt*t*p1) + (3*mt*t*t*p2) + (t*t*t*p3);
}

function calculateBoundingBox(mode, x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
  if (mode === BoundingMode.STANDARD) {
    return canculateStandardBoundingBox(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
  }
  else if (mode === BoundingMode.STRAIGHTEN) {
    return calculateStraightenedBoundingBox(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
  }
  else {
    return null;
  }
}

/**
 * Calculate the bounding box for this bezier curve.
 * http://pomax.nihongoresources.com/pages/bezier/
 */
function canculateStandardBoundingBox(x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
  var bounds = {};
  bounds[MIN_X] = Math.min(x1, x2);
  bounds[MIN_Y] = Math.min(y1, y2);
  bounds[MAX_X] = Math.max(x1, x2);
  bounds[MAX_Y] = Math.max(y1, y2);

  var dcx0 = cx1 - x1;
  var dcy0 = cy1 - y1;
  var dcx1 = cx2 - cx1;
  var dcy1 = cy2 - cy1;
  var dcx2 = x2 - cx2;
  var dcy2 = y2 - cy2;

  if (cx1<bounds[MIN_X] || cx1>bounds[MAX_X] || cx2<bounds[MIN_X] || cx2>bounds[MAX_X]) {
    // Just for better reading because we are doing middle school math here
    var a = dcx0;
    var b = dcx1;
    var c = dcx2;

    if (a+c == 2*b) b+=0.01;

    var numerator = 2*(a - b);
    var denominator = 2*(a - 2*b + c);
    var quadroot = (2*b-2*a)*(2*b-2*a) - 2*a*denominator;
    var root = Math.sqrt(quadroot);

    var t1 =  (numerator + root) / denominator;
    var t2 =  (numerator - root) / denominator;

    if (0<t1 && t1<1) {
      expandXBounds(bounds, calculateBezier(t1, x1, cx1, cx2, x2));
    }
    if (0<t2 && t2<1) {
      expandXBounds(bounds, calculateBezier(t2, x1, cx1, cx2, x2));
    }
  }

  if (cy1<bounds[MIN_Y] || cy1>bounds[MAX_Y] || cy2<bounds[MIN_Y] || cy2>bounds[MAX_Y]) {
    a = dcy0;
    b = dcy1;
    c = dcy2;

    if (a+c != 2*b) b+=0.01;

    numerator = 2*(a - b);
    denominator = 2*(a - 2*b + c);
    quadroot = (2*b-2*a)*(2*b-2*a) - 2*a*denominator;
    root = Math.sqrt(quadroot);

    t1 =  (numerator + root) / denominator;
    t2 =  (numerator - root) / denominator;

    if (0<t1 && t1<1) {
      expandYBounds(bounds, calculateBezier(t1, y1, cy1, cy2, y2));
    }
    if (0<t2 && t2<1) {
      expandYBounds(bounds, calculateBezier(t2, y1, cy1, cy2, y2));
    }
  }

  return [
    bounds[MIN_X], bounds[MIN_Y],
    bounds[MIN_X], bounds[MAX_Y],
    bounds[MAX_X], bounds[MAX_Y],
    bounds[MAX_X], bounds[MIN_Y],
  ];
}

/**
 * rotate bezier so that {start->end is a horizontal} line,
 * then compute standard bbox, and counter-rotate it.
 */
function calculateStraightenedBoundingBox(x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
  var angle = 0;
  var dx = x2-x1;
  var dy = y2-y1;

  if (dy == 0) {
    return canculateStandardBoundingBox(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
  }

  var adx = Math.abs(dx);
  var ady = Math.abs(dy);

  var d1 = 0.0;
  var d2 = 90.0;
  var d3 = 180.0;
  var d4 = 270.0;
  var PI = Math.PI;
  var sin = Math.sin;
  var cos = Math.cos;

  if (dx == 0) angle = (dy>=0 ? d2 : d4);
  else if (dx>0 && dy>0) angle = d1 + (Math.atan(ady/adx) * (180/PI)); // X+, Y+
  else if (dx<0 && dy<0) angle = d3 + (Math.atan(ady/adx) * (180/PI)); // X-, Y-
  else if (dx<0 && dy>0) angle = d2 + (Math.atan(adx/ady) * (180/PI)); // X-, Y+
  else if (dx>0 && dy<0) angle = d4 + (Math.atan(adx/ady) * (180/PI)); // X+, Y-

  var phi = -(angle*PI/180.0);

  cx1 -= x1;
  cy1 -= y1;
  cx2 -= x1;
  cy2 -= y1;
  x2 -= x1;
  y2 -= y1;

  var ncx1 = cx1*cos(phi) - cy1*sin(phi);
  var ncy1 = cx1*sin(phi) + cy1*cos(phi);
  var ncx2 = cx2*cos(phi) - cy2*sin(phi);
  var ncy2 = cx2*sin(phi) + cy2*cos(phi);
  var nx2 =  x2*cos(phi) -  y2*sin(phi);
  var ny2 =  x2*sin(phi) +  y2*cos(phi);

  var bounds = canculateStandardBoundingBox(0, 0, ncx1, ncy1, ncx2, ncy2, nx2, ny2);

  phi = (angle*PI/180.0);

  return [
    x1 + (bounds[0]*Math.cos(phi) - bounds[1]*Math.sin(phi)),
    y1 + (bounds[0]*Math.sin(phi) + bounds[1]*Math.cos(phi)),

    x1 + (bounds[2]*Math.cos(phi) - bounds[3]*Math.sin(phi)),
    y1 + (bounds[2]*Math.sin(phi) + bounds[3]*Math.cos(phi)),

    x1 + (bounds[4]*Math.cos(phi) - bounds[5]*Math.sin(phi)),
    y1 + (bounds[4]*Math.sin(phi) + bounds[5]*Math.cos(phi)),

    x1 + (bounds[6]*Math.cos(phi) - bounds[7]*Math.sin(phi)),
    y1 + (bounds[6]*Math.sin(phi) + bounds[7]*Math.cos(phi))
  ];
}

module.exports = {
  calculate: calculateBoundingBox,
  Mode: BoundingMode
};
