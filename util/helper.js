'use strict';

var Helper = {
  matrixStrToObj: function(str) {
    var m = [];
    var rdigit = /[\d\.\-Ee]+/g;
    var n;

    while(n = rdigit.exec(str)) {
      m.push(+n);
    }

    return {
      a: m[0],
      b: m[1],
      c: m[2],
      d: m[3],
      e: m[4],
      f: m[5]
    };
  },

  matrixStrToArr: function(str) {
    var m = [];
    var rdigit = /[\d\.\-e]+/g;
    var n;

    while(n = rdigit.exec(str)) {
      m.push(+n);
    }

    return m;
  },

  boundingUnderTransform: function(matrix, t, r, b, l) {
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