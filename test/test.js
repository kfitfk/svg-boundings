'use strict';

/* eslint-env mocha */

var fs = require('fs');
var path = require('path');
var $ = require('cheerio');

/* eslint-disable */
var assert = require('assert');
var should = require('should');
/* eslint-enable */

var BoundingHelper = require('../index');

var svgStr, browserData, aiData, $svg;

function compare(helperData, browserData) {
  (helperData.left - browserData.left).should.be.approximately(0, 0.5);
  (helperData.top - browserData.top).should.be.approximately(0, 0.5);
  (helperData.right - browserData.right).should.be.approximately(0, 0.5);
  (helperData.bottom - browserData.bottom).should.be.approximately(0, 0.5);
  (helperData.width - browserData.width).should.be.approximately(0, 0.5);
  (helperData.height - browserData.height).should.be.approximately(0, 0.5);
}

describe('calculate shape bounding rects', function() {
  before(function() {
    svgStr = fs.readFileSync(path.join(__dirname, '..', 'assets', 'shapes.svg'), { encoding: 'utf-8' });
    browserData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'shapes_browser_data.json'), { encoding: 'utf-8' }));
    $svg = $.load(svgStr, { xmlMode: true })('svg').eq(0);
  });

  it('can get bounding rect of ellipse', function() {
    var id = 'ellipse';
    var ellipse = $svg.find('#' + id);
    var bounding = BoundingHelper.ellipse(ellipse);

    compare(bounding, browserData[id]);
  });

  it('can get bounding rect of rotated ellipse', function() {
    var id = 'ellipseRotate';
    var ellipse = $svg.find('#' + id);
    var bounding = BoundingHelper.ellipse(ellipse);

    compare(bounding, browserData[id]);
  });

  it('can get bounding rect of skewed ellipse', function() {
    var id = 'ellipseShear';
    var shape = $svg.find('#' + id);
    var bounding = BoundingHelper.shape(shape);

    compare(bounding, browserData[id]);
  });

  it('can get bounding rect of rect', function() {
    var id = 'rect';
    var rect = $svg.find('#' + id);
    var bounding = BoundingHelper.rect(rect);

    compare(bounding, browserData[id]);
  });

  it('can get bounding rect of rotated rect', function() {
    var id = 'rectRotate';
    var rect = $svg.find('#' + id);
    var bounding = BoundingHelper.rect(rect);

    compare(bounding, browserData[id]);
  });

  it('can get bounding rect of skewed rect', function() {
    var id = 'rectShear';
    var shape = $svg.find('#' + id);
    var bounding = BoundingHelper.shape(shape);

    compare(bounding, browserData[id]);
  });

  it('can get bounding rect of circle', function() {
    var id = 'circle';
    var circle = $svg.find('#' + id);
    var bounding = BoundingHelper.circle(circle);

    compare(bounding, browserData[id]);
  });

  it('can get bounding rect of rotated circle', function() {
    var id = 'circleRotate';
    var circle = $svg.find('#' + id);
    var bounding = BoundingHelper.circle(circle);

    compare(bounding, browserData[id]);
  });

  it('can get bounding rect of unproportionally scaled circle', function() {
    var id = 'circle';
    var shape = $svg.find('#' + id);
    var bounding = BoundingHelper.shape(shape);

    compare(bounding, browserData[id]);
  });

  it('can get bounding rect of path', function() {
    var id = 'heart';
    var path = $svg.find('#' + id);
    var bounding = BoundingHelper.path(path);

    compare(bounding, browserData[id]);
  });
});

describe('calculate path boundings which use S/s and T/t commands', function() {
  before(function() {
    svgStr = fs.readFileSync(path.join(__dirname, '..', 'assets', 'curves.svg'), { encoding: 'utf-8' });
    browserData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'curves_browser_data.json'), { encoding: 'utf-8' }));
    $svg = $.load(svgStr, { xmlMode: true })('svg').eq(0);
  });

  it ('can get bounding rect of a path which uses s commands', function() {
    var ids = ['Mhcsss', 'Mhscs'];

    ids.forEach(function(id) {
      var path = $svg.find('#' + id);
      var bounding = BoundingHelper.path(path);
      compare(bounding, browserData[id]);
    });
  });

  it ('can get bounding rect of a path which uses S commands', function() {
    var ids = ['MHCSSS', 'MHSCS'];

    ids.forEach(function(id) {
      var path = $svg.find('#' + id);
      var bounding = BoundingHelper.path(path);
      compare(bounding, browserData[id]);
    });
  });

  it ('can get bounding rect of a path which uses t commands', function() {
    var ids = ['Mhqttt', 'Mhtttt'];

    ids.forEach(function(id) {
      var path = $svg.find('#' + id);
      var bounding = BoundingHelper.path(path);
      compare(bounding, browserData[id]);
    });
  });

  it ('can get bounding rect of a path which uses T commands', function() {
    var ids = ['MHQTTT', 'MHTTTT'];

    ids.forEach(function(id) {
      var path = $svg.find('#' + id);
      var bounding = BoundingHelper.path(path);
      compare(bounding, browserData[id]);
    });
  });
});

describe('calculate real path boundings', function() {
  before(function() {
    svgStr = fs.readFileSync(path.join(__dirname, '..', 'assets', 'curves.svg'), { encoding: 'utf-8' });
    aiData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'curves_ai_data.json'), { encoding: 'utf-8' }));
    $svg = $.load(svgStr, { xmlMode: true })('svg').eq(0);
  });

  it ('can get real bounding rect of a path which uses s commands', function() {
    var ids = ['Mhcsss', 'Mhscs'];

    ids.forEach(function(id) {
      var path = $svg.find('#' + id);
      var bounding = BoundingHelper.path(path, true);
      compare(bounding, aiData[id]);
    });
  });

  it ('can get real bounding rect of a path which uses S commands', function() {
    var ids = ['MHCSSS', 'MHSCS'];

    ids.forEach(function(id) {
      var path = $svg.find('#' + id);
      var bounding = BoundingHelper.path(path, true);
      compare(bounding, aiData[id]);
    });
  });

  it ('can get real bounding rect of a path which uses t commands', function() {
    var ids = ['Mhqttt', 'Mhtttt'];

    ids.forEach(function(id) {
      var path = $svg.find('#' + id);
      var bounding = BoundingHelper.path(path, true);
      compare(bounding, aiData[id]);
    });
  });

  it ('can get real bounding rect of a path which uses T commands', function() {
    var ids = ['MHQTTT', 'MHTTTT'];

    ids.forEach(function(id) {
      var path = $svg.find('#' + id);
      var bounding = BoundingHelper.path(path, true);
      compare(bounding, aiData[id]);
    });
  });

  it ('can get real bounding rect of a rotated ellipse', function() {
    var id = 'rotated';
    var path = $svg.find('#' + id);
    var bounding = BoundingHelper.ellipse(path, true);
    compare(bounding, aiData[id]);
  });

  it ('can get real bounding rect of a path which contains anchor points with the same x/y values.', function() {
    var id = 'hv';
    var path = $svg.find('#' + id);
    var bounding = BoundingHelper.path(path, true);
    compare(bounding ,aiData[id]);
  });
});

describe('calculate perfectly aligned paths bounding', function() {
  before(function() {
    svgStr = fs.readFileSync(path.join(__dirname, '..', 'assets', 'special_curves.svg'), { encoding: 'utf-8' });
    aiData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'special_curves_ai_data.json'), { encoding: 'utf-8' }));
    $svg = $.load(svgStr, { xmlMode: true })('svg').eq(0);
  });

  it('can get real bounding rect of a simple path segment whose anchor points and control points forms a rectangle - h1', function() {
    var id = 'h1';
    var path = $svg.find('#' + id);
    var bounding = BoundingHelper.path(path, true);
    compare(bounding ,aiData[id]);
  });

  it('can get real bounding rect of a simple path segment whose anchor points and control points forms a rectangle - h2', function() {
    var id = 'h2';
    var path = $svg.find('#' + id);
    var bounding = BoundingHelper.path(path, true);
    compare(bounding ,aiData[id]);
  });

  it('can get real bounding rect of a simple path segment whose anchor points and control points forms a rectangle - v1', function() {
    var id = 'v1';
    var path = $svg.find('#' + id);
    var bounding = BoundingHelper.path(path, true);
    compare(bounding ,aiData[id]);
  });

  it('can get real bounding rect of a simple path segment whose anchor points and control points forms a rectangle - v2', function() {
    var id = 'v2';
    var path = $svg.find('#' + id);
    var bounding = BoundingHelper.path(path, true);
    compare(bounding ,aiData[id]);
  });
});

describe('calculate image bounding rects', function() {
  before(function() {
    svgStr = fs.readFileSync(path.join(__dirname, '..', 'assets', 'images.svg'), { encoding: 'utf-8' });
    browserData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'images_browser_data.json'), { encoding: 'utf-8' }));
    $svg = $.load(svgStr, { xmlMode: true })('svg').eq(0);
  });

  it ('can get bounding rect of images', function() {
    var ids = ['tl', 'bl', 'br', 'c', 'tr'];

    ids.forEach(function(id) {
      var $image = $svg.find('#' + id);
      var bounding = BoundingHelper.image($image);
      compare(bounding, browserData[id]);
    });
  });
});

describe('calculate text bounding rects', function() {
  before(function() {
    svgStr = fs.readFileSync(path.join(__dirname, '..', 'assets', 'texts.svg'), { encoding: 'utf-8' });
    $svg = $.load(svgStr, { xmlMode: true })('svg').eq(0);
  });

  it ('can get bounding rect of texts', function() {
    var $text = $svg.find('#text');
    var bounding = BoundingHelper.text($text);
    compare(bounding, {
      left: 326,
      top: 253,
      right: 530,
      bottom: 277,
      width: 204,
      height: 24
    });
  });
});

describe('deal with complex d property', function() {
  it ('can parse adjacent fractional numbers without leading zeros', function() {
    var bounding = BoundingHelper.path({
      type: 'path',
      d: 'M8.52 13.763L11.7 10.58l.495.495-3.181 3.182z'
    }, true);
    compare(bounding, {
      top: 10.58,
      left: 8.52,
      bottom: 14.257,
      right: 12.195,
      width: 3.675,
      height: 3.677
    });
  });
  it ('can parse scientific counting is negative', function() {
    var bounding = BoundingHelper.path({
      type: 'path',
      d: 'M100.5,100.5l-1.4e-1-38.4-29.3-1.7e-1-31.3,32.1Z'
    }, true);
    compare(bounding, {
      left: 39.76,
      top: 61.93,
      right: 100.5,
      bottom: 100.5,
      width: 60.74,
      height: 38.57
    });
  });
});
