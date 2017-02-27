'use strict';

var ElementObject = require('./element_object');

function radialGradientBoundingBox(gradientObj) {
  return {
    left: gradientObj.cx - gradientObj.r,
    top: gradientObj.cy - gradientObj.r,
    right: gradientObj.cx + gradientObj.r,
    bottom: gradientObj.cy + gradientObj.r,
    width: gradientObj.r * 2,
    height: gradientObj.r * 2
  };
}

function linearGradientBoundingBox(gradientObj) {
  return {
    left: Math.min(gradientObj.x1, gradientObj.x2),
    top: Math.min(gradientObj.y1, gradientObj.y2),
    right: Math.max(gradientObj.x1, gradientObj.x2),
    bottom: Math.max(gradientObj.y1, gradientObj.y2),
    width: Math.abs(gradientObj.x1 - gradientObj.x2),
    height: Math.abs(gradientObj.y1 - gradientObj.y2)
  };
}

function gradientBoundingBox(gradient) {
  var gradientObj = ElementObject(gradient);
  if (!gradientObj) return null;

  if (/^linearGradient$/i.test(gradientObj.type)) return linearGradientBoundingBox(gradientObj);
  else if (/^radialGradient$/i.test(gradientObj.type)) return radialGradientBoundingBox(gradientObj);
  else return null;
}

module.exports = gradientBoundingBox;