'use strict';

var Matrix = require('./matrix');
var RE_TRANSFORM_TYPE = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]+)\)/g;
var Helper = {
  /**
  * turn a transform string into matrix(a b c d e f) format
  * @param {string} val - the transform value of a node
  * @param {object|string} [baseMatrixOrTransform] - base matrix, default to a 3x3 identity matrix
  * @returns {string} - a matrix object
  */
  transformToMatrix: function(val, baseMatrixOrTransform) {
    var m;
    if (baseMatrixOrTransform instanceof Matrix) m = baseMatrixOrTransform;
    else if (typeof baseMatrixOrTransform === 'string') val = baseMatrixOrTransform + ' ' + val;
    if (!m) m = Matrix.identity(3);

    var transform = RE_TRANSFORM_TYPE.exec(val);
    var type, values;
    while (transform) {
      type = transform[1];
      values = transform[2].trim().split(/[\s,]+/).map(function(value) {
        return Number(value.trim());
      });

      switch(type) {
        case 'matrix':
          m = m.x(Matrix.matrix(values[0], values[1], values[2], values[3], values[4], values[5]));
          break;
        case 'translate':
          m = m.x(Matrix.translate(values[0], values[1] || 0));
          break;
        case 'scale':
          if (values.length === 1) m = m.x(Matrix.scale(values[0]));
          else m = m.x(Matrix.scale(values[0], values[1]));
          break;
        case 'rotate':
          if (values.length > 1) {
            m = m
            .x(Matrix.translate(values[1], values[2] || 0))
            .x(Matrix.rotate(values[0] + 'deg'))
            .x(Matrix.translate(-1 * values[1], -1 * values[2] || 0));
          }
          else m = m.x(Matrix.rotate(values[0] + 'deg'));
          break;
        case 'skewX':
          m = m.x(Matrix.skewX(values[0] + 'deg'));
          break;
        case 'skewY':
          m = m.x(Matrix.skewY(values[0] + 'deg'));
          break;
      }

      transform = RE_TRANSFORM_TYPE.exec(val);
    }
    return m;
  },

  /**
  * turn a transform string into matrix(a b c d e f) format
  * @param {string} val - the transform value of a node
  * @param {object|string} [baseMatrixOrTransform] - base matrix, default to a 3x3 identity matrix
  * @returns {string} - transform value in matrix(a b c d e f) format
  */
  normalizeTransform: function(val, baseMatrixOrTransform) {
    var m = Helper.transformToMatrix(val, baseMatrixOrTransform);
    return m.to2dTransformString();
  },

  boundingUnderTransform: function(matrix, t, r, b, l) {
    var ma = matrix.e(1, 1);
    var mb = matrix.e(2, 1);
    var mc = matrix.e(1, 2);
    var md = matrix.e(2, 2);
    var me = matrix.e(1, 3);
    var mf = matrix.e(2, 3);

    var tl_l = ma*l + mc*t + me;
    var tl_t = mb*l + md*t + mf;

    var tr_r = ma*r + mc*t + me;
    var tr_t = mb*r + md*t + mf;

    var bl_l = ma*l + mc*b + me;
    var bl_b = mb*l + md*b + mf;

    var br_r = ma*r + mc*b + me;
    var br_b = mb*r + md*b + mf;

    return {
      top: Math.min(tl_t, tr_t, bl_b, br_b),
      bottom: Math.max(tl_t, tr_t, bl_b, br_b),
      left: Math.min(tl_l, tr_r, bl_l, br_r),
      right: Math.max(tl_l, tr_r, bl_l, br_r),
      _wh: function() {
        delete this._wh;
        this.width = this.right - this.left;
        this.height = this.bottom - this.top;
        return this;
      }
    }._wh();
  }
};

module.exports = Helper;