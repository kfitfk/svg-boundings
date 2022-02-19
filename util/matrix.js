'use strict';

var Num = require('./number');

// transform degree to radians
function _degToRad(deg) {
  return (deg -360) * Math.PI / 180;
}

// the parameter angle is something like 30deg
// this function will return the radian value, which is a number
function _getRadianScalar(angle) {
  var num = parseFloat(angle);
  var unit = angle.match(/[a-z]+$/);
  var rad;

  if (angle.trim() === '0') {
    num = 0;
    unit = 'rad';
  }

  if (unit.length !== 1 || num === 0) {
    return 0;
  }

  unit = unit[0];

  switch (unit) {
    case 'deg':
      rad = _degToRad(num);
      break;
    case 'rad':
      rad = num;
      break;
    default:
      throw 'Not an angle: ' + angle;
  }

  return rad;
}

function _normalize(value) {
  var i,j;
  var nestedLen, longest = 0;

  // make sure all items are type of number
  for (i = 0; i < value.length; i++) {
    if (!Array.isArray(value[i])) {
      value[i] = [value[i]];
    }

    nestedLen = value[i].length;
    longest = longest < nestedLen ? nestedLen : longest;
    for (j = 0; j < value[i].length; j++) {
      value[i][j] = parseFloat(value[i][j]) || 0;
    }
  }

  // in case some positions miss item
  // set 0 for the missing ones
  for (i = 0; i < value.length; i++) {
    nestedLen = value[i].length;
    if (nestedLen === longest) {
      continue;
    }
    for (j = nestedLen; j < longest; j++) {
      value[i][j] = 0;
    }
  }

  return value;
}

// Matrix Constructor
function Matrix(value) {
  if (!Array.isArray(value)) {
    throw 'Expect an array or nested arrays to initialize a matrix';
  }
  if (value.length === 0) {
    throw 'Expect at least one item to initialize a matrix';
  }

  this.value = _normalize(value);
  this.row = this.value.length;
  this.col = this.value[0].length;
}

Matrix.identity = function(dimensions) {
  dimensions = parseInt(dimensions, 10);
  dimensions = dimensions > 0 ? dimensions : 2;
  var value = [];
  for (var i = 0; i < dimensions; i++) {
    value[i] = [];
    for (var j = 0; j < dimensions; j++) {
      value[i][j] = i === j ? 1 : 0;
    }
  }
  return new Matrix(value);
};

Matrix.rotate = function(angle) {
  var num = _getRadianScalar(angle);
  var c = Math.cos(num), s = Math.sin(num);
  return new Matrix([
    [c, -s,  0],
    [s,  c,  0],
    [0,  0,  1]
  ]);
};

Matrix.scale = function(sx, sy) {
  sx = parseFloat(sx) || 1;

  if (!sy) sy = sx;
  else sy = parseFloat(sy) || 1;

  return new Matrix([
    [sx, 0, 0],
    [0, sy, 0],
    [0, 0, 1]
  ]);
};

Matrix.scaleX = function(sx) {
  return Matrix.scale(sx, 1);
};

Matrix.scaleY = function(sy) {
  return Matrix.scale(1, sy);
};

Matrix.skew = function(ax, ay) {
  var xRad = _getRadianScalar(ax);
  var yRad;

  if (ay != null) yRad = _getRadianScalar(ay);
  else yRad = 0;

  if (xRad != null && yRad != null) {
    return new Matrix([
      [1, Math.tan(xRad), 0],
      [Math.tan(yRad), 1, 0],
      [0, 0, 1]
    ]);
  }
  else {
    return null;
  }
};

Matrix.skewX = function(ax) {
  return Matrix.skew(ax, '0');
};

Matrix.skewY = function(ay) {
  return Matrix.skew('0', ay);
};

Matrix.translate = function(tx, ty) {
  return new Matrix([
    [1, 0, tx],
    [0, 1, ty],
    [0, 0, 1]
  ]);
};;

Matrix.translateX = function(tx) {
  return Matrix.translate(tx, 0);
};

Matrix.translateY = function(ty) {
  return Matrix.translate(0, ty);
};

Matrix.matrix = function(a, b, c, d, e, f) {
  // for now, e and f are ignored
  return new Matrix([
    [a, c, e],
    [b, d, f],
    [0, 0, 1]
  ]);
};

Matrix.prototype.toString = function() {
  var rows = [];
  for (var i = 0; i < this.row; i++) {
    rows.push('[' + this.value[i].join(', ') + ']');
  }
  return '[' + rows.join(', ') + ']';
};

Matrix.prototype.to2dTransformString = function() {
  return 'matrix(' +
  Num.round(this.e(1, 1), 4) + ',' + Num.round(this.e(2, 1), 4) + ',' +
  Num.round(this.e(1, 2), 4) + ',' + Num.round(this.e(2, 2), 4) + ',' +
  Num.round(this.e(1, 3), 4) + ',' + Num.round(this.e(2, 3), 4) + ')';
};

Matrix.prototype.e = function(row, col) {
  row = parseInt(row, 10) - 1 || 0;
  col = parseInt(col, 10) - 1 || 0;

  return this.value[row][col];
};

Matrix.prototype.x = function(matrix) {
  if (this.col !== matrix.row) {
    throw 'The colomn of the left matrix doesn\'t match the row of the right matrix';
  }

  // refer to http://tech.pro/tutorial/1527/matrix-multiplication-in-functional-javascript
  var secondColumns = _transpose(matrix.value);
  var newValue = this.value.map(function(row) {
      return secondColumns.map(function(column) {
          return column.reduce(function(sum, value, index) {
              return sum + value * row[index];
          }, 0);
      });
  });
  return new Matrix(newValue);
};

function _transpose(matrixValue) {
    return matrixValue[0].map(function(uselessValue, colIndex) {
        return matrixValue.map(function(uselessRow, rowIndex) {
            return matrixValue[rowIndex][colIndex];
        });
    });
}

module.exports = Matrix;
