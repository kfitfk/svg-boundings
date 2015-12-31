function _parseMatrixStr(str) {
  var m = []
  var rdigit = /[\d\.\-Ee]+/g
  var n

  while(n = rdigit.exec(str)) {
    m.push(+n)
  }

  return {
    a: m[0],
    b: m[1],
    c: m[2],
    d: m[3],
    e: m[4],
    f: m[5]
  };
}

function _handleTransform(matrix, t, r, b, l) {
  var ma = matrix.a;
  var mb = matrix.b;
  var mc = matrix.c;
  var md = matrix.d;
  var me = matrix.e;
  var mf = matrix.f;

  var tl_l = ma*l + mc*t + me;
  var tl_t = mb*l + md*t + mf;

  var tr_r = ma*r + mc*t + me;
  var tr_t = mb*r + md*t + mf;

  var bl_l = ma*l + mc*b + me;
  var bl_b = mb*l + md*b + mf;

  var br_r = ma*r + mc*b + me;
  var br_b = mb*r + md*b + mf;

  return {
    t: Math.min(tl_t, tr_t, bl_b, br_b),
    b: Math.max(tl_t, tr_t, bl_b, br_b),
    l: Math.min(tl_l, tr_r, bl_l, br_r),
    r: Math.max(tl_l, tr_r, bl_l, br_r)
  };
}

function boundingRectOfLine(line) {
  var x1 = parseFloat(line.getAttribute('x1'));
  var y1 = parseFloat(line.getAttribute('y1'));
  var x2 = parseFloat(line.getAttribute('x2'));
  var y2 = parseFloat(line.getAttribute('y2'));

  return {
    left: Math.min(x1, x2),
    top: Math.min(y1, y2),
    width: Math.abs(x1 - x2),
    height: Math.abs(y1 - y2)
  };
}

function boundingRectOfRect(rect) {
  var w = parseFloat(rect.getAttribute('width'));
  var h = parseFloat(rect.getAttribute('height'))
  var l = parseFloat(rect.getAttribute('x')) || 0;
  var t = parseFloat(rect.getAttribute('y')) || 0;
  var r = l + w;
  var b = t + h;

  var transform = rect.getAttribute('transform');
  var matrix;
  if (transform) {
    matrix = _parseMatrixStr(transform);
    newTrbl = _handleTransform(matrix, t, r, b, l);
    return {
      left: newTrbl.l,
      top: newTrbl.t,
      width: newTrbl.r - newTrbl.l,
      height: newTrbl.b - newTrbl.t
    };
  }

  return {
    left: l,
    top: t,
    width: w,
    height: h
  };
}

function boundingRectOfCircle(circle) {
  var cx = parseFloat(circle.getAttribute('cx')) || 0;
  var cy = parseFloat(circle.getAttribute('cy')) || 0;
  var r = parseFloat(circle.getAttribute('r'));

  return {
    left: cx - r,
    top: cy - r,
    width: 2 * r,
    height: 2 * r
  };
}

function boundingRectOfEllipse(ellipse) {
  var cx = parseFloat(ellipse.getAttribute('cx')) || 0;
  var cy = parseFloat(ellipse.getAttribute('cy')) || 0;
  var rx = parseFloat(ellipse.getAttribute('rx'));
  var ry = parseFloat(ellipse.getAttribute('ry'));
  var l = cx - rx;
  var t = cy - ry;
  var r = l + 2 * rx;
  var b = t + 2 * ry;

  var transform = ellipse.getAttribute('transform');
  var matrix;
  if (transform) {
    matrix = _parseMatrixStr(transform);
    newTrbl = _handleTransform(matrix, t, r, b, l);
    return {
      left: newTrbl.l,
      top: newTrbl.t,
      width: newTrbl.r - newTrbl.l,
      height: newTrbl.b - newTrbl.t
    };
  }

  return {
    left: l,
    top: t,
    width: 2 * rx,
    height: 2 * ry
  };
}

function boundingRectOfPolygon(polygon) {
  var points = polygon.getAttribute('points').replace(/\r\n|\n|\r/gm, '').replace(/\s+/g, ',').split(',').map(parseFloat);

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
    width: r - l,
    height: b - t
  };
}

function boundingRectOfPolyline(polyline) {
  return boundingRectOfPolygon(polyline);
}

// This method returns a rough bounding box of the path,
// by only checking each points, not the actual drawn path,
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
function boundingRectOfPath(path) {
  var d = path.getAttribute('d').replace(/\r\n|\n|\r/gm, '');
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

    while (!isNaN(num = nextNumber()))
      output.push(num);

    return output;
  };

  var checkX = function(val) {
    if (val < l) l = val;
    if (val > r) r = val;
  }

  var checkY = function(val) {
    if (val < t) t = val;
    if (val > b) b = val;
  }

  // Get all commands first
  var i = 0, c = '';
  while (c = d.charAt(i++)) {
    if (/[mlhvaqtcsz]/i.test(c))
      commands.push(c);
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
    var i;
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
        checkX(args[i]);
        checkY(args[i+1]);
        checkX(args[i+2]);
        checkY(args[i+3]);

        x = args[i+4];
        y = args[i+5];
        checkX(x);
        checkY(y);

        potentialCp = [
          args[i+4] * 2 - args[i+2],
          args[i+5] * 2 - args[i+3]
        ];
      }
    }
    else if (command === 'c') {
      for (i = 0; i < args.length; i += 6) {
        checkX(x+args[i+0]);
        checkY(y+args[i+1]);
        checkX(x+args[i+2]);
        checkY(y+args[i+3]);

        potentialCp = [
          2*(x+args[i+4]) - (x+args[i+2]),
          2*(y+args[i+5]) - (y+args[i+3])
        ];

        x += args[i+4];
        y += args[i+5];
        checkX(x);
        checkY(y);
      }
    }
    else if (command === 'S') {
      if (/[cs]/i.test(commands[idx - 1])) {
        checkX(potentialCp[0]);
        checkY(potentialCp[1]);
      }

      potentialCp = [
        2*args[2] - args[0],
        2*args[3] - args[1]
      ];

      checkX(args[0]);
      checkY(args[1]);
      x = args[2];
      y = args[3];
      checkX(x);
      checkY(y);

      for (i = 4; i < args.length; i += 4) {
        checkX(potentialCp[0]);
        checkY(potentialCp[1]);

        potentialCp = [
          2*args[i+2] - args[i],
          2*args[i+3] - args[i+1]
        ];

        checkX(args[i]);
        checkY(args[i+1]);
        x = args[i+2];
        y = args[i+3];
        checkX(x);
        checkY(y);
      }
    }
    else if (command === 's') {
      if (/[cs]/i.test(commands[idx - 1])) {
        checkX(potentialCp[0]);
        checkY(potentialCp[1]);
      }

      potentialCp = [
        2*(x+args[2]) - (x+args[0]),
        2*(y+args[3]) - (y+args[1])
      ];

      checkX(x+args[0]);
      checkY(y+args[1]);
      x += args[2];
      y += args[3];
      checkX(x);
      checkY(y);

      for (i = 4; i < args.length; i += 4) {
        checkX(potentialCp[0]);
        checkY(potentialCp[1]);

        potentialCp = [
          2*(x+args[i+2]) - (x+args[i]),
          2*(y+args[i+3]) - (y+args[i+1])
        ];

        checkX(x+args[i]);
        checkY(y+args[i+1]);
        x += args[i+2];
        y += args[i+3];
        checkX(x);
        checkY(y);
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
        checkX(x + 2/3 * (args[i] - x));
        checkY(y + 2/3 * (args[i+1] - y));
        checkX(args[i+2] + 2/3 * (args[i] - args[i+2]));
        checkY(args[i+3] + 2/3 * (args[i+1] - args[i+3]));

        x = args[i+2];
        y = args[i+3];
        checkX(x);
        checkY(y);

        potentialCp = [
          2*args[i+2] - args[i],
          2*args[i+3] - args[i+1]
        ];
      }
    }
    else if (command === 'q') {
      for (i = 0; i < args.length; i += 4) {
        checkX(x + 2/3 * args[i]);
        checkY(y + 2/3 * args[i+1]);
        checkX(x+args[i+2] + 2/3 * (args[i] - args[i+2]));
        checkY(y+args[i+3] + 2/3 * (args[i+1] - args[i+3]));

        potentialCp = [
          2*(x+args[i+2]) - (x+args[i]),
          2*(y+args[i+3]) - (y+args[i+1])
        ];

        x += args[i+2];
        y += args[i+3];
        checkX(x);
        checkY(y);
      }
    }
    else if (command === 'T') {
      if (/[qt]/i.test(commands[idx - 1])) {
        checkX(x + 2/3 * (potentialCp[0] - x));
        checkY(y + 2/3 * (potentialCp[1] - y));
        checkX(args[0] + 2/3 * (potentialCp[0] - args[0]));
        checkY(args[1] + 2/3 * (potentialCp[1] - args[1]));

        potentialCp = [
          2*args[0] - potentialCp[0],
          2*args[1] - potentialCp[1]
        ];
      }
      else {
        potentialCp = [
          2*args[0] - x,
          2*args[1] - y
        ];
      }

      x = args[0];
      y = args[1];
      checkX(x);
      checkY(y);

      for (i = 2; i < args.length; i += 2) {
        checkX(x + 2/3 * (potentialCp[0] - x));
        checkY(y + 2/3 * (potentialCp[1] - y));
        checkX(args[i] + 2/3 * (potentialCp[0] - args[i]));
        checkY(args[i+1] + 2/3 * (potentialCp[1] - args[i+1]));

        potentialCp = [
          2*args[i] - potentialCp[0],
          2*args[i+1] - potentialCp[1]
        ];

        x = args[i];
        y = args[i+1];
        checkX(x);
        checkY(y);
      }
    }
    else if (command === 't') {
      if (/[qt]/i.test(commands[idx - 1])) {
        checkX(x + 2/3 * (potentialCp[0] - x));
        checkY(y + 2/3 * (potentialCp[1] - y));
        checkX(x+args[0] + 2/3 * (potentialCp[0] -x-args[0]));
        checkY(y+args[1] + 2/3 * (potentialCp[1] -y-args[1]));

        potentialCp = [
          2*(x+args[0]) - potentialCp[0],
          2*(y+args[1]) - potentialCp[1]
        ];
      }
      else {
        potentialCp = [
          2*(x+args[0]) - x,
          2*(y+args[1]) - y
        ];
      }

      x += args[0];
      y += args[1];
      checkX(x);
      checkY(y);

      for (i = 2; i < args.length; i += 2) {
        checkX(x + 2/3 * (potentialCp[0] - x));
        checkY(y + 2/3 * (potentialCp[1] - y));
        checkX(x+args[i] + 2/3 * (potentialCp[0] -x-args[i]));
        checkY(y+args[i+1] + 2/3 * (potentialCp[1] -y-args[i+1]));

        potentialCp = [
          2*(x+args[i]) - potentialCp[0],
          2*(y+args[i+1]) - potentialCp[1]
        ];

        x += args[i];
        y += args[i+1];
        checkX(x);
        checkY(y);
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
    width: r - l,
    height: b - t
  };
}

function boundingRectOfShape(shape) {
  var tag = shape.tagName.toLowerCase();
  var bounding;

  switch(tag) {
    case 'path':
      bounding = boundingRectOfPath(shape);
      break;
    case 'polygon':
      bounding = boundingRectOfPolygon(shape);
      break;
    case 'rect':
      bounding = boundingRectOfRect(shape);
      break;
    case 'ellipse':
      bounding = boundingRectOfEllipse(shape);
      break;
    case 'circle':
      bounding = boundingRectOfCircle(shape);
      break;
    case 'polyline':
      bounding = boundingRectOfPolyline(shape);
      break;
    case 'line':
      bounding = boundingRectOfLine(shape);
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
