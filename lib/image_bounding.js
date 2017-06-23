'use strict';

var Helper = require('../util/helper');
var ElementObject = require('./element_object');

/**
 * Bounding rectangle for <image>. This method doesn't check
 * <clipPath> or <mask>. It calculates bounding rectangle of
 * <image> tag itself.
 */
function imageBounding(image) {
  var imageObj = ElementObject(image);
  if (!imageObj) return null;

  if (!imageObj.transform) imageObj.transform = 'matrix(1 0 0 1 0 0)';
  var matrix = Helper.matrixStrToArr(imageObj.transform.trim());
  var width = imageObj.width;
  var height = imageObj.height;

  // The matrix variable contains 6 numbers, let's call them
  // a, b, c, d, e, f
  var a = matrix[0];
  var b = matrix[1];
  var c = matrix[2];
  var d = matrix[3];
  var e = matrix[4];
  var f = matrix[5];

  // The original top left point of the image is unknown. The e and f
  // in the matrix is the transformed top left point.
  // Now assume translate is applied to the image first, we have the
  // following points: (e, f), (e+w, f), (e+w, f+h), (e, f+h)
  var points1 = [
    e, f,
    e+width, f,
    e+width, f+height,
    e, f+height
  ];

  // Then apply trasform matrix (a b c d 0 0) to these points, the
  // formula is newX = a*x + c*y, newY = b*x + d*y
  var points2 = [];
  for (var i = 0; i < points1.length; i+=2) {
    points2[i] = a * points1[i] + c * points1[i+1];
    points2[i+1] = b * points1[i] + d * points1[i+1];
  }

  // Find the delta of the top left point and apply it to all the points
  var dx = points2[0] - points1[0];
  var dy = points2[1] - points1[1];
  var points = [e, f];
  for (var i = 2; i < points1.length; i+=2) {
    points[i] = points2[i] - dx;
    points[i+1] = points2[i+1] - dy;
  }

  var left = Number.POSITIVE_INFINITY;
  var right = Number.NEGATIVE_INFINITY;
  var top = Number.POSITIVE_INFINITY;
  var bottom = Number.NEGATIVE_INFINITY;

  for (var i = 0; i < points.length; i+=2) {
    if (points[i] < left) left = points[i];
    if (points[i] > right) right = points[i];
    if (points[i+1] < top) top = points[i+1];
    if (points[i+1] > bottom) bottom = points[i+1];
  }

  return {
    left: left,
    right: right,
    top: top,
    bottom: bottom,
    width: right - left,
    height: bottom - top
  };
}

module.exports = imageBounding;
