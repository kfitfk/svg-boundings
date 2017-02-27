'use strict';

var boundingOfImage = require('./lib/image_bounding');
var boundingOfShape = require('./lib/shape_bounding');
var boundingOfText = require('./lib/text_bounding');
var boundingOfGradient = require('./lib/gradient_bounding');

module.exports = {
  line: boundingOfShape.line,
  rect: boundingOfShape.rect,
  circle: boundingOfShape.circle,
  ellipse: boundingOfShape.ellipse,
  polygon: boundingOfShape.polygon,
  polyline: boundingOfShape.polyline,
  path: boundingOfShape.path,
  shape: boundingOfShape.shape,
  image: boundingOfImage,
  text: boundingOfText,
  gradient: boundingOfGradient
};
