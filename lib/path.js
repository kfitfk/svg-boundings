'use strict';

var Num = require('../util/number');
var Helper = require('../util/helper');
var Matrix = require('../util/matrix');
var TAU = Math.PI * 2;

function mapToEllipse(x, y, rx, ry, cosphi, sinphi, centerx, centery) {
  x *= rx;
  y *= ry;

  var xp = cosphi * x - sinphi * y;
  var yp = sinphi * x + cosphi * y;

  return {
    x: xp + centerx,
    y: yp + centery
  };
}

function approxUnitArc(ang1, ang2) {
  var a = 4 / 3 * Math.tan(ang2 / 4);

  var x1 = Math.cos(ang1);
  var y1 = Math.sin(ang1);
  var x2 = Math.cos(ang1 + ang2);
  var y2 = Math.sin(ang1 + ang2);

  return [
    {
      x: x1 - y1 * a,
      y: y1 + x1 * a
    },
    {
      x: x2 + y2 * a,
      y: y2 - x2 * a
    },
    {
      x: x2,
      y: y2
    }
  ];
}

function vectorAngle(ux, uy, vx, vy) {
  var sign = (ux * vy - uy * vx < 0) ? -1 : 1;
  var umag = Math.sqrt(ux * ux + uy * uy);
  var vmag = Math.sqrt(ux * ux + uy * uy);
  var dot = ux * vx + uy * vy;

  var div = dot / (umag * vmag);

  if (div > 1) div = 1;
  if (div < -1) div = -1;

  return sign * Math.acos(div);
}

function getArcCenter(px, py, cx, cy, rx, ry, largeArcFlag, sweepFlag, sinphi, cosphi, pxp, pyp) {
  var rxsq = Math.pow(rx, 2);
  var rysq = Math.pow(ry, 2);
  var pxpsq = Math.pow(pxp, 2);
  var pypsq = Math.pow(pyp, 2);

  var radicant = (rxsq * rysq) - (rxsq * pypsq) - (rysq * pxpsq);

  if (radicant < 0) radicant = 0;

  radicant /= (rxsq * pypsq) + (rysq * pxpsq);
  radicant = Math.sqrt(radicant) * (largeArcFlag === sweepFlag ? -1 : 1);

  var centerxp = radicant * rx / ry * pyp;
  var centeryp = radicant * -ry / rx * pxp;

  var centerx = cosphi * centerxp - sinphi * centeryp + (px + cx) / 2;
  var centery = sinphi * centerxp + cosphi * centeryp + (py + cy) / 2;

  var vx1 = (pxp - centerxp) / rx;
  var vy1 = (pyp - centeryp) / ry;
  var vx2 = (-pxp - centerxp) / rx;
  var vy2 = (-pyp - centeryp) / ry;

  var ang1 = vectorAngle(1, 0, vx1, vy1);
  var ang2 = vectorAngle(vx1, vy1, vx2, vy2);

  if (sweepFlag === 0 && ang2 > 0) {
    ang2 -= TAU;
  }

  if (sweepFlag === 1 && ang2 < 0) {
    ang2 += TAU;
  }

  return [centerx, centery, ang1, ang2];
}

// credit to https://github.com/colinmeinke/svg-arc-to-cubic-bezier
function arcToBezier(lastPoint, arcParams) {
  var px = lastPoint.x; // prevX
  var py = lastPoint.y; // prevY
  var cx = parseFloat(arcParams[5]); // currX
  var cy = parseFloat(arcParams[6]); // currY
  var rx = Math.abs(parseFloat(arcParams[0]));
  var ry = Math.abs(parseFloat(arcParams[1]));
  var xAxisRotation = parseFloat(arcParams[2]);
  var largeArcFlag = parseInt(arcParams[3], 10);
  var sweepFlag = parseInt(arcParams[4], 10);

  var curves = [];

  if (rx === 0 || ry === 0) {
    return null;
  }

  var sinphi = Math.sin(xAxisRotation * Math.PI / 180);
  var cosphi = Math.cos(xAxisRotation * Math.PI / 180);

  var pxp = cosphi * (px - cx) / 2 + sinphi * (py - cy) / 2;
  var pyp = -sinphi * (px - cx) / 2 + cosphi * (py - cy) / 2;

  if (pxp === 0 && pyp === 0) return null;

  var lambda = Math.pow(pxp, 2) / Math.pow(rx, 2) + Math.pow(pyp, 2) / Math.pow(ry, 2);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }

  var arcCenter = getArcCenter(px, py, cx, cy, rx, ry, largeArcFlag, sweepFlag, sinphi, cosphi, pxp, pyp);
  var centerx = arcCenter[0];
  var centery = arcCenter[1];
  var ang1 = arcCenter[2];
  var ang2 = arcCenter[3];

  var segments = Math.max(Math.ceil(Math.abs(ang2) / (TAU / 4)), 1);

  ang2 /= segments;

  for (var i = 0; i < segments; i++) {
    curves.push(approxUnitArc(ang1, ang2));
    ang1 += ang2;
  }

  return curves.map(function(curve) {
    var m1 = mapToEllipse(curve[0].x, curve[0].y, rx, ry, cosphi, sinphi, centerx, centery);
    var m2 = mapToEllipse(curve[1].x, curve[1].y, rx, ry, cosphi, sinphi, centerx, centery);
    var m = mapToEllipse(curve[2].x, curve[2].y, rx, ry, cosphi, sinphi, centerx, centery);

    return [m1.x, m1.y, m2.x, m2.y, m.x, m.y];
  });
}

/**
 * Parse a section of SVG path's d attribute
 * Say，d="M70,100L230,100A20,10,0,0,1,250,110L250,190"
 * You can pass "L230,100" as the argument, and get [230, 100] as output
 * @param {string} str - a section of the SVG path's d attribute
 * @returns {array} - an array of numbers
 */
function argsFromPathD(str) {
  var output = [];
  var idx = 0;
  var c, num;

  var nextNumber = function() {
    var chars = [];
    var periodTested = false;
    var scientificNotation = false;

    while (/[^-\d\.]/.test(str.charAt(idx))) {
      // skip the non-digit characters
      idx++;
    }

    if ('-' === str.charAt(idx)) {
      chars.push('-');
      idx++;
    }

    while ((c = str.charAt(idx)) && /[-\d\.Ee]/.test(c)) {
      /**
       * Some fractional numbers omit the leading 0, like this
       * l.495.495-3.181 3.182
       */
      if (c === '.') {
        if (periodTested) { break; }
        else { periodTested = true; }
      }
      /**
       * like this
       * L-1.14251219e-14 or L1.14251219e-14
       */
      if (c === '-') {
        if (scientificNotation) { scientificNotation = false; }
        else { break; }
      }
      if (/[Ee]/.test(c)) { scientificNotation = true; }
      chars.push(c);
      idx++;
    }

    return parseFloat(chars.join(''));
  };

  while (!isNaN(num = nextNumber())) output.push(num);

  return output;
}

function applyMatrixToPoint(matrix, x, y) {
  var point = new Matrix([x, y, 1]);
  point = matrix.x(point);
  return {x: Num.round(point.e(1, 1), 2), y: Num.round(point.e(2, 1), 2)};
}

function expandPathTransform(d, transform) {
  var m;
  if (transform) m = Helper.transformToMatrix(transform);
  else m = Helper.transformToMatrix('matrix(1 0 0 1 0 0)');

  var d = d.replace(/\r\n|\n|\r/gm, '');
  var x = 0;
  var y = 0;
  var commands = [];
  var newParams = [];
  var params;

  // Get all commands first
  var i = 0, c = '';
  while (c = d.charAt(i++)) {
    if (/[mlhvaqtcsz]/i.test(c)) commands.push(c);
  }

  // The shift() is used to throw away strings come before the first command
  params = d.replace(/[mlhvaqtcsz]/ig, '#').split('#');
  params.shift();
  params.forEach(function(str, idx) {
    var command = commands[idx];
    if (/z/i.test(command)) return newParams.push('');

    // Get arguments of each command
    var args = argsFromPathD(str);
    var newArgs = [];
    var point, i;

    // Different commands have different arguments
    // Here's a quick review
    // M m - x y
    // L l - x y
    // H h - x
    // V v - y
    // A a - rx ry xAxisRotation largeArc sweep x y
    // Q q - x1 y1 x y
    // T t - x y
    // C c - x1 y1 x2 y2 x y
    // S s - x2 y2 x y
    // S/s needs access to the points of previous C/c command
    // T/t needs access to the points of previous Q/q command
    if (/[MLT]/.test(command)) {
      for (i = 0; i < args.length; i += 2) {
        x = args[i];
        y = args[i+1];
        point = applyMatrixToPoint(m, x, y);
        newArgs.push(point.x, point.y);
      }
    }
    else if (/[mlt]/.test(command)) {
      for (i = 0; i < args.length; i += 2) {
        x += args[i];
        y += args[i+1];
        point = applyMatrixToPoint(m, x, y);
        newArgs.push(point.x, point.y);
      }
      commands[idx] = commands[idx].toUpperCase();
    }
    else if (command === 'C') {
      for (i = 0; i < args.length; i += 6) {
        point = applyMatrixToPoint(m, args[i], args[i+1]);
        newArgs.push(point.x, point.y);

        point = applyMatrixToPoint(m, args[i+2], args[i+3]);
        newArgs.push(point.x, point.y);

        point = applyMatrixToPoint(m, args[i+4], args[i+5]);
        newArgs.push(point.x, point.y);

        x = args[i+4];
        y = args[i+5];
      }
    }
    else if (command === 'c') {
      for (i = 0; i < args.length; i += 6) {
        point = applyMatrixToPoint(m, x+args[i], y+args[i+1]);
        newArgs.push(point.x, point.y);

        point = applyMatrixToPoint(m, x+args[i+2], y+args[i+3]);
        newArgs.push(point.x, point.y);

        point = applyMatrixToPoint(m, x+args[i+4], y+args[i+5]);
        newArgs.push(point.x, point.y);

        x += args[i+4];
        y += args[i+5];
      }
      commands[idx] = 'C';
    }
    else if (/[SQ]/.test(command)) {
      for (i = 0; i < args.length; i += 4) {
        point = applyMatrixToPoint(m, args[i], args[i+1]);
        newArgs.push(point.x, point.y);

        point = applyMatrixToPoint(m, args[i+2], args[i+3]);
        newArgs.push(point.x, point.y);

        x = args[i+2];
        y = args[i+3];
      }
    }
    else if (/[sq]/.test(command)) {
      for (i = 0; i < args.length; i += 4) {
        point = applyMatrixToPoint(m, x+args[i], y+args[i+1]);
        newArgs.push(point.x, point.y);

        point = applyMatrixToPoint(m, x+args[i+2], y+args[i+3]);
        newArgs.push(point.x, point.y);

        x += args[i+2];
        y += args[i+3];
      }
      commands[idx] = commands[idx].toUpperCase();
    }
    else if (command === 'H') {
      for (i = 0; i < args.length; i++) {
        point = applyMatrixToPoint(m, args[i], y);
        newArgs.push(point.x, point.y);
        x = args[i];
      }
      commands[idx] = 'L';
    }
    else if (command === 'h') {
      for (i = 0; i < args.length; i++) {
        point = applyMatrixToPoint(m, x+args[i], y);
        newArgs.push(point.x, point.y);
        x += args[i];
      }
      commands[idx] = 'L';
    }
    else if (command === 'V') {
      for (i = 0; i < args.length; i++) {
        point = applyMatrixToPoint(m, x, args[i]);
        newArgs.push(point.x, point.y);
        y = args[i];
      }
      commands[idx] = 'L';
    }
    else if (command === 'v') {
      for (i = 0; i < args.length; i++) {
        point = applyMatrixToPoint(m, x, y+args[i]);
        newArgs.push(point.x, point.y);
        y += args[i];
      }
      commands[idx] = 'L';
    }
    else if (/[Aa]/.test(command)) {
      for (i = 0; i < args.length; i += 7) {
        arcToBezier(
          {x: x, y: y},
          [
            args[i], args[i+1],
            args[i+2], args[i+3], args[i+4],
            command === 'A' ? args[i+5] : x+args[i+5], command === 'A' ? args[i+6] : y+args[i+6]]
        ).forEach(function(curveParams, j) {
          point = applyMatrixToPoint(m, curveParams[0], curveParams[1]);
          newArgs.push(point.x, point.y);

          point = applyMatrixToPoint(m, curveParams[2], curveParams[3]);
          newArgs.push(point.x, point.y);

          point = applyMatrixToPoint(m, curveParams[4], curveParams[5]);
          newArgs.push(point.x, point.y);
        });

        if (command === 'A') {
          x = args[i+5];
          y = args[i+6];
        }
        else {
          x += args[i+5];
          y += args[i+6];
        }
      }

      commands[idx] = 'C';
    }

    /**
     * arcToBezier seldomly returns empty result. If that does happen, we
     * should fallback to the commented method below. However, this turns
     * a single A/a command to several A/a and C commands. Unless this
     * really happens in the future, I'll just go with the easy way for now.
     */
    // else if (/[Aa]/.test(command)) {
    //   if (!unmatrixed) {
    //     unmatrixed = Matrix.unmatrix('matrix(' + m.e(1, 1) + ',' + m.e(2, 1) + ',' + m.e(1, 2) + ',' + m.e(2, 2) + ',' + m.e(3, 1) + ',' + m.e(3, 2) + ')');
    //   }
    //   for (i = 0; i < args.length; i+=7) {
    //     newArgs.push(
    //       args[0] * unmatrixed.scaleX, args[1] * unmatrixed.scaleY,
    //       args[i+2], args[i+3], args[i+4],
    //       point.e(1, 1), point.e(2, 1)
    //     );
    //   }
    // }

    newParams.push(newArgs.join(' '));
  });

  // Reconstruct the d property of path element
  d = '';
  newParams.forEach(function(str, idx) {
    d += commands[idx] + str;
  });
  if (/z/i.test(commands[newParams.length])) {
    d += commands[newParams.length];
  }

  return d;
}

module.exports = {
  arcToBezier: arcToBezier,
  argsFromPathD: argsFromPathD,
  applyMatrixToPoint: applyMatrixToPoint,
  expandPathTransform: expandPathTransform,
};
