var fs = require('fs');
var path = require('path');
var $ = require('cheerio');

var assert = require('assert');
var should = require('should');

var BoundingHelper = require('../index');

var svgStr, browserData, $svg;

// Simulate DOM object methods and properties used in BoundingHelper
$.prototype.getAttribute = $.prototype.attr;
Object.defineProperty($.prototype, 'tagName', {
  get: function() { return this.get(0).tagName; }
});

function compare(helperData, browserData) {
  (helperData.left - browserData.left).should.be.approximately(0, 0.5);
  (helperData.top - browserData.top).should.be.approximately(0, 0.5);
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
