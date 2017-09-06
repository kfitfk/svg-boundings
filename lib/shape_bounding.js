'use strict';

var CurveBounding = require('./curve_bounding');
var ElementObject = require('./element_object');
var Helper = require('../util/helper');

function boundingRectOfLine(line) {
  line = ElementObject(line);

  var x1 = line.x1;
  var y1 = line.y1;
  var x2 = line.x2;
  var y2 = line.y2;

  return {
    left: Math.min(x1, x2),
    top: Math.min(y1, y2),
    right: Math.max(x1, x2),
    bottom: Math.max(y1, y2),
    width: Math.abs(x1 - x2),
    height: Math.abs(y1 - y2)
  };
}

function boundingRectOfRect(rect) {
  rect = ElementObject(rect);

  var w = rect.width;
  var h = rect.height;
  var l = rect.x || 0;
  var t = rect.y || 0;
  var r = l + w;
  var b = t + h;

  var transform = rect.transform;
  var matrix;
  if (transform) {
    matrix = Helper.matrixStrToObj(transform);
    return Helper.boundingUnderTransform(matrix, t, r, b, l);
  }

  return {
    left: l,
    top: t,
    right: r,
    bottom: b,
    width: w,
    height: h
  };
}

function boundingRectOfCircle(circle) {
  circle = ElementObject(circle);

  var cx = circle.cx || 0;
  var cy = circle.cy || 0;
  var r = circle.r;

  return {
    left: cx - r,
    top: cy - r,
    right: cx + r,
    bottom: cy + r,
    width: 2 * r,
    height: 2 * r
  };
}

function boundingRectOfEllipse(ellipse, shouldReturnTrueBounding) {
  ellipse = ElementObject(ellipse);

  var cx = ellipse.cx || 0;
  var cy = ellipse.cy || 0;
  var rx = ellipse.rx;
  var ry = ellipse.ry;
  var l = cx - rx;
  var t = cy - ry;
  var r = l + 2 * rx;
  var b = t + 2 * ry;

  var transform = ellipse.transform;
  var matrix;
  if (transform) {
    matrix = Helper.matrixStrToObj(transform);

    if (shouldReturnTrueBounding) {
      // https://img.alicdn.com/tfscom/TB1iZqOPFXXXXceXpXXXXXXXXXX.jpg
      var ma = matrix.a;
      var mb = matrix.b;
      var mc = matrix.c;
      var md = matrix.d;
      var me = matrix.e;
      var mf = matrix.f;
      var denominator = ma*md-mb*mc;
      var A = ry*ry*md*md+rx*rx*mb*mb;
      var B = -2*(mc*md*ry*ry+ma*mb*rx*rx);
      var C = ry*ry*mc*mc+rx*rx*ma*ma;
      var D = 2*ry*ry*(mc*md*mf-md*md*me)+2*rx*rx*(ma*mb*mf-mb*mb*me) - 2*(cx*ry*ry*md-cy*rx*rx*mb)*denominator;
      var E = 2*ry*ry*(mc*md*me-mc*mc*mf)+2*rx*rx*(ma*mb*me-ma*ma*mf) + 2*(cx*ry*ry*mc-cy*rx*rx*ma)*denominator;
      var F = ry*ry*(mc*mc*mf*mf-2*mc*md*me*mf+md*md*me*me)+rx*rx*(ma*ma*mf*mf-2*ma*mb*me*mf+mb*mb*me*me) + (2*cx*ry*ry*(md*me-mc*mf)+2*cy*rx*rx*(ma*mf-mb*me))*denominator + (ry*ry*cx*cx+rx*rx*cy*cy-rx*rx*ry*ry)*Math.pow(denominator, 2);
      var a = 4*A*C-B*B;
      var b1 = 4*A*E-2*B*D;
      var c1 = 4*A*F-D*D;
      var d1 = b1*b1-4*a*c1;
      var b2 = 4*C*D-2*B*E;
      var c2 = 4*C*F-E*E;
      var d2 = b2*b2-4*a*c2;
      var tb1 = (0-b1+Math.sqrt(d1))/(2*a);
      var tb2 = (0-b1-Math.sqrt(d1))/(2*a);
      var lr1 = (0-b2+Math.sqrt(d2))/(2*a);
      var lr2 = (0-b2-Math.sqrt(d2))/(2*a);
      return {
        left: Math.min(lr1, lr2),
        top: Math.min(tb1, tb2),
        right: Math.max(lr1, lr2),
        bottom: Math.max(tb1, tb2),
        _wh: function() {
          delete this._wh;
          this.width = this.right - this.left;
          this.height = this.bottom - this.top;
          return this;
        }
      }._wh();
    }
    else return Helper.boundingUnderTransform(matrix, t, r, b, l);
  }

  return {
    left: l,
    top: t,
    right: r,
    bottom: b,
    width: 2 * rx,
    height: 2 * ry
  };
}

function boundingRectOfPolygon(polygon) {
  polygon = ElementObject(polygon);

  var points = polygon.points.trim().replace(/\r\n|\n|\r/gm, ',').replace(/\s+/g, ',').split(',').map(parseFloat);

  var l = Number.POSITIVE_INFINITY;
  var r = Number.NEGATIVE_INFINITY;
  var t = Number.POSITIVE_INFINITY;
  var b = Number.NEGATIVE_INFINITY;

  for (var i = 0; i < points.length; i+=2) {
    if (l > points[i]) l = points[i];
    if (r < points[i]) r = points[i];
    if (t > points[i+1]) t = points[i+1];
    if (b < points[i+1]) b = points[i+1];
  }

  return {
    left: l,
    top: t,
    right: r,
    bottom: b,
    width: r - l,
    height: b - t
  };
}

function boundingRectOfPolyline(polyline) {
  polyline = ElementObject(polyline);
  return boundingRectOfPolygon(polyline);
}

// This method returns the bounding box of the path.
// Unless shouldReturnTrueBounding is set to a truthy value,
// it only checks each point, not the actual drawn path,
// meaning the bounding box may be larger than the actual
// bounding box. The reason is:
// 1. we don't need the exact bounding box;
// 2. all the browsers calculate this way;
// 3. it is easier to calculate.
// This method assumes the d property of the path is valid.
// Since SVG is exported from Illustrator, I assume this condition
// is always met.
// Things ignored:
// 1. the xAxisRotation property of A/a command;
// 2. M/m command checking.
// Because Illustrator doesn't export A/a command as well as useless
// M/m commands, we are good here.
function boundingRectOfPath(path, shouldReturnTrueBounding) {
  path = ElementObject(path);
  var d = path.d.replace(/\r\n|\n|\r/gm, '');
  var x = 0, y = 0;
  var commands = [];
  var params, potentialCp; // cp for control point

  var l = Number.POSITIVE_INFINITY;
  var r = Number.NEGATIVE_INFINITY;
  var t = Number.POSITIVE_INFINITY;
  var b = Number.NEGATIVE_INFINITY;

  // Helper - get arguments of a path drawing command
  var getArgs = function(str) {
    var output = [];
    var idx = 0;
    var c, num;

    var nextNumber = function() {
      var chars = [];

      while (/[^-\d\.]/.test(str.charAt(idx))) {
        // skip the non-digit characters
        idx++;
      }

      if ('-' === str.charAt(idx)) {
        chars.push('-');
        idx++;
      }

      while ((c = str.charAt(idx)) && /[\d\.Ee]/.test(c)) {
        chars.push(c);
        idx++;
      }

      return parseFloat(chars.join(''));
    };

    while (!isNaN(num = nextNumber())) output.push(num);

    return output;
  };

  var checkX = function(val) {
    if (val < l) l = val;
    if (val > r) r = val;
  };

  var checkY = function(val) {
    if (val < t) t = val;
    if (val > b) b = val;
  };

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
    if (/z/i.test(command)) return;

    // Get arguments of each command
    var args = getArgs(str);

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
    // Here "previous" means right before the target command
    var i, trueBounds, cpx1, cpy1, cpx2, cpy2;

    if (/[ML]/.test(command)) {
      for (i = 0; i < args.length; i += 2) {
        x = args[i];
        y = args[i+1];
        checkX(x);
        checkY(y);
      }
    }
    else if (/[ml]/.test(command)) {
      for (i = 0; i < args.length; i += 2) {
        x += args[i];
        y += args[i+1];
        checkX(x);
        checkY(y);
      }
    }
    else if (command === 'C') {
      for (i = 0; i < args.length; i += 6) {
        if (shouldReturnTrueBounding) {
          trueBounds = CurveBounding.calculate(
            CurveBounding.Mode.STANDARD,
            x, y,
            args[i], args[i+1],
            args[i+2], args[i+3],
            args[i+4], args[i+5]
          );
          checkX(trueBounds[0]); // MIN_X
          checkX(trueBounds[4]); // MAX_X
          checkY(trueBounds[1]); // MIN_Y
          checkY(trueBounds[5]); // MAX_Y
        }
        else {
          checkX(args[i]);
          checkY(args[i+1]);
          checkX(args[i+2]);
          checkY(args[i+3]);
          checkX(args[i+4]);
          checkY(args[i+5]);
        }

        potentialCp = [
          args[i+4] * 2 - args[i+2],
          args[i+5] * 2 - args[i+3]
        ];
        x = args[i+4];
        y = args[i+5];
      }
    }
    else if (command === 'c') {
      for (i = 0; i < args.length; i += 6) {
        if (shouldReturnTrueBounding) {
          trueBounds = CurveBounding.calculate(
            CurveBounding.Mode.STANDARD,
            x, y,
            x+args[i], y+args[i+1],
            x+args[i+2], y+args[i+3],
            x+args[i+4], y+args[i+5]
          );
          checkX(trueBounds[0]); // MIN_X
          checkX(trueBounds[4]); // MAX_X
          checkY(trueBounds[1]); // MIN_Y
          checkY(trueBounds[5]); // MAX_Y
        }
        else {
          checkX(x+args[i+0]);
          checkY(y+args[i+1]);
          checkX(x+args[i+2]);
          checkY(y+args[i+3]);
          checkX(x+args[i+4]);
          checkY(y+args[i+5]);
        }

        potentialCp = [
          2*(x+args[i+4]) - (x+args[i+2]),
          2*(y+args[i+5]) - (y+args[i+3])
        ];
        x += args[i+4];
        y += args[i+5];
      }
    }
    else if (command === 'S') {
      if (shouldReturnTrueBounding) {
        if (/[cs]/i.test(commands[idx - 1])) {
          trueBounds = CurveBounding.calculate(
            CurveBounding.Mode.STANDARD,
            x, y,
            potentialCp[0], potentialCp[1],
            args[0], args[1],
            args[2], args[3]
          );
        }
        else {
          trueBounds = CurveBounding.calculate(
            CurveBounding.Mode.STANDARD,
            x, y,
            x, y,
            args[0], args[1],
            args[2], args[3]
          );
        }
        checkX(trueBounds[0]); // MIN_X
        checkX(trueBounds[4]); // MAX_X
        checkY(trueBounds[1]); // MIN_Y
        checkY(trueBounds[5]); // MAX_Y
      }
      else {
        if (/[cs]/i.test(commands[idx - 1])) {
          checkX(potentialCp[0]);
          checkY(potentialCp[1]);
        }
        checkX(args[0]);
        checkY(args[1]);
        checkX(args[2]);
        checkY(args[3]);
      }

      potentialCp = [
        2*args[2] - args[0],
        2*args[3] - args[1]
      ];

      x = args[2];
      y = args[3];

      for (i = 4; i < args.length; i += 4) {
        if (shouldReturnTrueBounding) {
          trueBounds = CurveBounding.calculate(
            CurveBounding.Mode.STANDARD,
            x, y,
            potentialCp[0], potentialCp[1],
            args[i], args[i+1],
            args[i+2], args[i+3]
          );
          checkX(trueBounds[0]); // MIN_X
          checkX(trueBounds[4]); // MAX_X
          checkY(trueBounds[1]); // MIN_Y
          checkY(trueBounds[5]); // MAX_Y
        }
        else {
          checkX(potentialCp[0]);
          checkY(potentialCp[1]);
          checkX(args[i]);
          checkY(args[i+1]);
          checkX(args[i+2]);
          checkY(args[i+3]);
        }

        potentialCp = [
          2*args[i+2] - args[i],
          2*args[i+3] - args[i+1]
        ];
        x = args[i+2];
        y = args[i+3];
      }
    }
    else if (command === 's') {
      if (shouldReturnTrueBounding) {
        if (/[cs]/i.test(commands[idx - 1])) {
          trueBounds = CurveBounding.calculate(
            CurveBounding.Mode.STANDARD,
            x, y,
            potentialCp[0], potentialCp[1],
            x+args[0], y+args[1],
            x+args[2], y+args[3]
          );
        }
        else {
          trueBounds = CurveBounding.calculate(
            CurveBounding.Mode.STANDARD,
            x, y,
            x, y,
            x+args[0], y+args[1],
            x+args[2], y+args[3]
          );
        }
        checkX(trueBounds[0]); // MIN_X
        checkX(trueBounds[4]); // MAX_X
        checkY(trueBounds[1]); // MIN_Y
        checkY(trueBounds[5]); // MAX_Y
      }
      else {
        if (/[cs]/i.test(commands[idx - 1])) {
          checkX(potentialCp[0]);
          checkY(potentialCp[1]);
        }
        checkX(x+args[0]);
        checkY(y+args[1]);
        checkX(x+args[2]);
        checkY(y+args[3]);
      }

      potentialCp = [
        2*(x+args[2]) - (x+args[0]),
        2*(y+args[3]) - (y+args[1])
      ];
      x += args[2];
      y += args[3];

      for (i = 4; i < args.length; i += 4) {
        if (shouldReturnTrueBounding) {
          trueBounds = CurveBounding.calculate(
            CurveBounding.Mode.STANDARD,
            x, y,
            potentialCp[0], potentialCp[1],
            x+args[i], y+args[i+1],
            x+args[i+2], y+args[i+3]
          );
          checkX(trueBounds[0]); // MIN_X
          checkX(trueBounds[4]); // MAX_X
          checkY(trueBounds[1]); // MIN_Y
          checkY(trueBounds[5]); // MAX_Y
        }
        else {
          checkX(potentialCp[0]);
          checkY(potentialCp[1]);
          checkX(x+args[i]);
          checkY(y+args[i+1]);
          checkX(x+args[i+2]);
          checkY(y+args[i+3]);
        }

        potentialCp = [
          2*(x+args[i+2]) - (x+args[i]),
          2*(y+args[i+3]) - (y+args[i+1])
        ];
        x += args[i+2];
        y += args[i+3];
      }
    }
    else if (command === 'H') {
      for (i = 0; i < args.length; i++) {
        x = args[i];
        checkX(x);
      }
    }
    else if (command === 'h') {
      for (i = 0; i < args.length; i++) {
        x += args[i];
        checkX(x);
      }
    }
    else if (command === 'V') {
      for (i = 0; i < args.length; i++) {
        y = args[i];
        checkY(y);
      }
    }
    else if (command === 'v') {
      for (i = 0; i < args.length; i++) {
        y += args[i];
        checkY(y);
      }
    }
    else if (command === 'Q') {
      for (i = 0; i < args.length; i += 4) {
        // convert the one quadratic curve control point to
        // two bezier curve control points using the formula
        // cubicControlX1 = quadraticStartX + 2/3 * (quadraticControlX - quadraticStartX)
        // cubicControlY1 = quadraticStartY + 2/3 * (quadraticControlY - quadraticStartY)
        // cubicControlX2 = quadraticEndX + 2/3 * (quadraticControlX - quadraticEndX)
        // cubicControlY2 = quadraticEndY + 2/3 * (quadraticControlY - quadraticEndY)

        cpx1 = x + 2/3 * (args[i] - x);
        cpy1 = y + 2/3 * (args[i+1] - y);
        cpx2 = args[i+2] + 2/3 * (args[i] - args[i+2]);
        cpy2 = args[i+3] + 2/3 * (args[i+1] - args[i+3]);

        if (shouldReturnTrueBounding) {
          trueBounds = CurveBounding.calculate(
            CurveBounding.Mode.STANDARD,
            x, y,
            cpx1, cpy1,
            cpx2, cpy2,
            args[i+2], args[i+3]
          );
          checkX(trueBounds[0]); // MIN_X
          checkX(trueBounds[4]); // MAX_X
          checkY(trueBounds[1]); // MIN_Y
          checkY(trueBounds[5]); // MAX_Y
        }
        else {
          checkX(cpx1);
          checkY(cpy1);
          checkX(cpx2);
          checkY(cpy2);
          checkX(args[i+2]);
          checkY(args[i+3]);
        }

        potentialCp = [
          2*args[i+2] - args[i],
          2*args[i+3] - args[i+1]
        ];
        x = args[i+2];
        y = args[i+3];
      }
    }
    else if (command === 'q') {
      for (i = 0; i < args.length; i += 4) {
        cpx1 = x + 2/3 * args[i];
        cpy1 = y + 2/3 * args[i+1];
        cpx2 = x+args[i+2] + 2/3 * (args[i] - args[i+2]);
        cpy2 = y+args[i+3] + 2/3 * (args[i+1] - args[i+3]);

        if (shouldReturnTrueBounding) {
          trueBounds = CurveBounding.calculate(
            CurveBounding.Mode.STANDARD,
            x, y,
            cpx1, cpy1,
            cpx2, cpy2,
            x+args[i+2], y+args[i+3]
          );
          checkX(trueBounds[0]); // MIN_X
          checkX(trueBounds[4]); // MAX_X
          checkY(trueBounds[1]); // MIN_Y
          checkY(trueBounds[5]); // MAX_Y
        }
        else {
          checkX(cpx1);
          checkY(cpy1);
          checkX(cpx2);
          checkY(cpy2);
          checkX(x+args[i+2]);
          checkY(y+args[i+3]);
        }

        potentialCp = [
          2*(x+args[i+2]) - (x+args[i]),
          2*(y+args[i+3]) - (y+args[i+1])
        ];
        x += args[i+2];
        y += args[i+3];
      }
    }
    else if (command === 'T') {
      if (/[qt]/i.test(commands[idx - 1])) {
        cpx1 = x + 2/3 * (potentialCp[0] - x);
        cpy1 = y + 2/3 * (potentialCp[1] - y);
        cpx2 = args[0] + 2/3 * (potentialCp[0] - args[0]);
        cpy2 = args[1] + 2/3 * (potentialCp[1] - args[1]);

        potentialCp = [
          2*args[0] - potentialCp[0],
          2*args[1] - potentialCp[1]
        ];
      }
      else {
        cpx1 = x;
        cpy1 = y;
        cpx2 = args[0] + 2/3 * (x - args[0]);
        cpy2 = args[1] + 2/3 * (y - args[1]);

        potentialCp = [
          2*args[0] - x,
          2*args[1] - y
        ];
      }

      if (shouldReturnTrueBounding) {
        trueBounds = CurveBounding.calculate(
          CurveBounding.Mode.STANDARD,
          x, y,
          cpx1, cpy1,
          cpx2, cpy2,
          args[0], args[1]
        );
        checkX(trueBounds[0]); // MIN_X
        checkX(trueBounds[4]); // MAX_X
        checkY(trueBounds[1]); // MIN_Y
        checkY(trueBounds[5]); // MAX_Y
      }
      else {
        checkX(cpx1);
        checkY(cpy1);
        checkX(cpx2);
        checkY(cpy2);
        checkX(args[0]);
        checkY(args[1]);
      }

      x = args[0];
      y = args[1];

      for (i = 2; i < args.length; i += 2) {
        cpx1 = x + 2/3 * (potentialCp[0] - x);
        cpy1 = y + 2/3 * (potentialCp[1] - y);
        cpx2 = args[i] + 2/3 * (potentialCp[0] - args[i]);
        cpy2 = args[i+1] + 2/3 * (potentialCp[1] - args[i+1]);

        if (shouldReturnTrueBounding) {
          trueBounds = CurveBounding.calculate(
            CurveBounding.Mode.STANDARD,
            x, y,
            cpx1, cpy1,
            cpx2, cpy2,
            args[i], args[i+1]
          );
          checkX(trueBounds[0]); // MIN_X
          checkX(trueBounds[4]); // MAX_X
          checkY(trueBounds[1]); // MIN_Y
          checkY(trueBounds[5]); // MAX_Y
        }
        else {
          checkX(cpx1);
          checkY(cpy1);
          checkX(cpx2);
          checkY(cpy2);
          checkX(args[i]);
          checkY(args[i+1]);
        }

        potentialCp = [
          2*args[i] - potentialCp[0],
          2*args[i+1] - potentialCp[1]
        ];
        x = args[i];
        y = args[i+1];
      }
    }
    else if (command === 't') {
      if (/[qt]/i.test(commands[idx - 1])) {
        cpx1 = x + 2/3 * (potentialCp[0] - x);
        cpy1 = y + 2/3 * (potentialCp[1] - y);
        cpx2 = x+args[0] + 2/3 * (potentialCp[0] -x-args[0]);
        cpy2 = y+args[1] + 2/3 * (potentialCp[1] -y-args[1]);

        potentialCp = [
          2*(x+args[0]) - potentialCp[0],
          2*(y+args[1]) - potentialCp[1]
        ];
      }
      else {
        cpx1 = x;
        cpy1 = y;
        cpx2 = x+args[0] - 2/3 * args[0];
        cpy2 = y+args[1] - 2/3 * args[1];

        potentialCp = [
          2*(x+args[0]) - x,
          2*(y+args[1]) - y
        ];
      }

      if (shouldReturnTrueBounding) {
        trueBounds = CurveBounding.calculate(
          CurveBounding.Mode.STANDARD,
          x, y,
          cpx1, cpy1,
          cpx2, cpy2,
          x+args[0], y+args[1]
        );
        checkX(trueBounds[0]); // MIN_X
        checkX(trueBounds[4]); // MAX_X
        checkY(trueBounds[1]); // MIN_Y
        checkY(trueBounds[5]); // MAX_Y
      }
      else {
        checkX(cpx1);
        checkY(cpy1);
        checkX(cpx2);
        checkY(cpy2);
        checkX(x+args[0]);
        checkY(y+args[1]);
      }

      x += args[0];
      y += args[1];

      for (i = 2; i < args.length; i += 2) {
        cpx1 = x + 2/3 * (potentialCp[0] - x);
        cpy1 = y + 2/3 * (potentialCp[1] - y);
        cpx2 = x+args[i] + 2/3 * (potentialCp[0] -x-args[i]);
        cpy2 = y+args[i+1] + 2/3 * (potentialCp[1] -y-args[i+1]);

        if (shouldReturnTrueBounding) {
          trueBounds = CurveBounding.calculate(
            CurveBounding.Mode.STANDARD,
            x, y,
            cpx1, cpy1,
            cpx2, cpy2,
            x+args[i], y+args[i+1]
          );
          checkX(trueBounds[0]); // MIN_X
          checkX(trueBounds[4]); // MAX_X
          checkY(trueBounds[1]); // MIN_Y
          checkY(trueBounds[5]); // MAX_Y
        }
        else {
          checkX(cpx1);
          checkY(cpy1);
          checkX(cpx2);
          checkY(cpy2);
          checkX(x+args[i]);
          checkY(y+args[i+1]);
        }

        potentialCp = [
          2*(x+args[i]) - potentialCp[0],
          2*(y+args[i+1]) - potentialCp[1]
        ];
        x += args[i];
        y += args[i+1];
      }
    }
    else if (command === 'A') {
      for (var i = 0; i < args.length; i += 7) {
        x = args[i+5];
        y = args[i+6];
        checkX(x);
        checkY(y);
      }
    }
    else if (command === 'a') {
      for (var i = 0; i < args.length; i += 7) {
        x += args[i+5];
        y += args[i+6];
        checkX(x);
        checkY(y);
      }
    }
  });

  return {
    left: l,
    top: t,
    right: r,
    bottom: b,
    width: r - l,
    height: b - t
  };
}

function boundingRectOfShape(shape, needTrueBounding) {
  var elementObj = ElementObject(shape);
  if (!elementObj) return null;

  var bounding;
  switch(elementObj.type) {
    case 'path':
      bounding = boundingRectOfPath(elementObj, needTrueBounding);
      break;
    case 'polygon':
      bounding = boundingRectOfPolygon(elementObj);
      break;
    case 'rect':
      bounding = boundingRectOfRect(elementObj);
      break;
    case 'ellipse':
      bounding = boundingRectOfEllipse(elementObj, needTrueBounding);
      break;
    case 'circle':
      bounding = boundingRectOfCircle(elementObj);
      break;
    case 'polyline':
      bounding = boundingRectOfPolyline(elementObj);
      break;
    case 'line':
      bounding = boundingRectOfLine(elementObj);
      break;
  }

  return bounding;
}

module.exports = {
  line: boundingRectOfLine,
  rect: boundingRectOfRect,
  circle: boundingRectOfCircle,
  ellipse: boundingRectOfEllipse,
  polygon: boundingRectOfPolygon,
  polyline: boundingRectOfPolyline,
  path: boundingRectOfPath,
  shape: boundingRectOfShape
};
