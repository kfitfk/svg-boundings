'use strict';

var Num = {
  round: function(number, decimals) {
    if (!decimals) decimals = 0;
    var scientificNotation = /e([-+]?\d+)/.exec(number);
    /**
     * After calling toString() of a number, if the value is in
     * scientific notation, it means:
     * EIGHER the number is pretty large, and the decimals can be ignored
     * OR the number is pretty close to 0
     */
    if (scientificNotation) {
      var exponent = parseInt(scientificNotation[1], 10);
      if (exponent > 0) return number;
      else return 0;
    }
    return Number(Math.round(number+'e'+decimals)+'e-'+decimals);
  },
};

module.exports = Num;
