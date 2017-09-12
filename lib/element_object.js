'use strict';

var RE_NUMBER_ATTRIBUTES = /^(?:[cr]?x\d?|[cr]?y\d?|width|height|r|letter\-spacing)$/i;

function isSVGElement(object) {
  return (
    typeof SVGElement === 'object' ?
    object instanceof SVGElement :
    object && typeof object === 'object' && object !== null && object.nodeType === 1 && typeof object.nodeName === 'string'
  );
}

function isCheerioObject($object) {
  return $object.cheerio && typeof $object.attr === 'function';
}

function type(object) {
  var type = object.type;
  if (isSVGElement(object)) type = object.nodeName;
  else if (isCheerioObject(object)) type = object.get(0).tagName;
  return type;
}

function attributesFromSVGElement(element, names) {
  var attributes = {};
  names.forEach(function(name) {
    var value = element.getAttribute(name);
    if (RE_NUMBER_ATTRIBUTES.test(name)) value = parseFloat(value) || 0;
    if (value != null) attributes[name] = value;
  });
  attributes.type = element.nodeName;
  return attributes;
}

function attributesFromCheerioObject($element, names) {
  var attributes = {};
  names.forEach(function(name) {
    var value = $element.attr(name);
    if (RE_NUMBER_ATTRIBUTES.test(name)) value = parseFloat(value) || 0;
    if (value != null) attributes[name] = value;
  });
  attributes.type = $element.get(0).tagName;
  return attributes;
}

function attributesFromElement(element, names) {
  if (isSVGElement(element)) return attributesFromSVGElement(element, names);
  else if (isCheerioObject(element)) return attributesFromCheerioObject(element, names);
  else return null;
}

function textObject(textEl) {
  var isSVGEl = false;

  if (isSVGElement(textEl)) isSVGEl = true;
  else if (isCheerioObject(textEl)) {} // do nothing
  else return null;

  var attributes = {};
  var children = isSVGEl ? textEl.children : textEl.children();

  // no <tspan>
  if (children.length === 0) {
    attributes = attributesFromElement(textEl, ['transform', 'font-size', 'letter-spacing']);
    attributes.text = isSVGEl ? textEl.textContent : textEl.text();
    attributes.children = [];
    return attributes;
  }

  // has <tspan>
  attributes = attributesFromElement(textEl, ['transform']);
  attributes.children = [];
  Array.prototype.forEach.call(children, function(childEl) {
    if (!isSVGEl) childEl = textEl.constructor(childEl);
    if (type(childEl) !== 'tspan') return;
    var obj = attributesFromElement(childEl, ['x', 'y', 'font-size', 'letter-spacing']);
    obj.text = isSVGEl ? childEl.textContent : childEl.text();
    attributes.children.push(obj);
  });
  return attributes;
}

function elementObject(element) {
  if (element.constructor.name === 'Object') return element;

  var obj = null;
  switch(type(element).toLowerCase()) {
    case 'lineargradient':
      obj = attributesFromElement(element, ['x1', 'y1', 'x2', 'y2', 'gradientTransform']);
      break;
    case 'radialgradient':
      obj = attributesFromElement(element, ['cx', 'cy', 'r', 'fx', 'fy', 'gradientTransform']);
      break;
    case 'text':
      obj = textObject(element);
      break;
    case 'line':
      obj = attributesFromElement(element, ['x1', 'y1', 'x2', 'y2', 'stroke-width']);
      break;
    case 'rect':
      obj = attributesFromElement(element, ['x', 'y', 'width', 'height', 'transform', 'stroke-width']);
      break;
    case 'polyline':
      obj = attributesFromElement(element, ['points', 'stroke-width']);
      break;
    case 'polygon':
      obj = attributesFromElement(element, ['points', 'stroke-width']);
      break;
    case 'circle':
      obj = attributesFromElement(element, ['cx', 'cy', 'r', 'transform', 'stroke-width']);
      break;
    case 'ellipse':
      obj = attributesFromElement(element, ['cx', 'cy', 'rx', 'ry', 'transform', 'stroke-width']);
      break;
    case 'path':
      obj = attributesFromElement(element, ['d', 'stroke-width']);
      break;
    case 'image':
      obj = attributesFromElement(element, ['width', 'height', 'transform']);
      break;
  }

  return obj;
}

module.exports = elementObject;
