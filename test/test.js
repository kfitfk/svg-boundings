var fs = require('fs');
var path = require('path');
var $ = require('cheerio');

var assert = require('assert');
var should = require('should');

var BoundingHelper = require('../index');

var svgStr = fs.readFileSync(path.join(__dirname, '..', 'assets', 'shapes.svg'), { encoding: 'utf-8' });
var browserData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'shapes_browser_data.json'), { encoding: 'utf-8' }));
var $svg = $.load(svgStr, { xmlMode: true })('svg').eq(0);

// Simulate DOM object methods and properties used in BoundingHelper
$.prototype.getAttribute = $.prototype.attr;
Object.defineProperty($.prototype, 'tagName', {
  get: function() { return this.get(0).tagName; }
});

describe('calculate shape bounding rects', function() {
  it('can get bounding rect of ellipse', function() {
    var id = 'ellipse';
    var ellipse = $svg.find('#' + id);
    var bounding = BoundingHelper.ellipse(ellipse);

    (bounding.left - browserData[id].left).should.be.approximately(0, 0.5);
    (bounding.top - browserData[id].top).should.be.approximately(0, 0.5);
    (bounding.width - browserData[id].width).should.be.approximately(0, 0.5);
    (bounding.height - browserData[id].height).should.be.approximately(0, 0.5);
  });

  it('can get bounding rect of rotated ellipse', function() {
    var id = 'ellipseRotate';
    var ellipse = $svg.find('#' + id);
    var bounding = BoundingHelper.ellipse(ellipse);

    (bounding.left - browserData[id].left).should.be.approximately(0, 0.5);
    (bounding.top - browserData[id].top).should.be.approximately(0, 0.5);
    (bounding.width - browserData[id].width).should.be.approximately(0, 0.5);
    (bounding.height - browserData[id].height).should.be.approximately(0, 0.5);
  });

  it('can get bounding rect of skewed ellipse', function() {
    var id = 'ellipseShear';
    var shape = $svg.find('#' + id);
    var bounding = BoundingHelper.shape(shape);

    (bounding.left - browserData[id].left).should.be.approximately(0, 0.5);
    (bounding.top - browserData[id].top).should.be.approximately(0, 0.5);
    (bounding.width - browserData[id].width).should.be.approximately(0, 0.5);
    (bounding.height - browserData[id].height).should.be.approximately(0, 0.5);
  });

  it('can get bounding rect of rect', function() {
    var id = 'rect';
    var rect = $svg.find('#' + id);
    var bounding = BoundingHelper.rect(rect);

    (bounding.left - browserData[id].left).should.be.approximately(0, 0.5);
    (bounding.top - browserData[id].top).should.be.approximately(0, 0.5);
    (bounding.width - browserData[id].width).should.be.approximately(0, 0.5);
    (bounding.height - browserData[id].height).should.be.approximately(0, 0.5);
  });

  it('can get bounding rect of rotated rect', function() {
    var id = 'rectRotate';
    var rect = $svg.find('#' + id);
    var bounding = BoundingHelper.rect(rect);

    (bounding.left - browserData[id].left).should.be.approximately(0, 0.5);
    (bounding.top - browserData[id].top).should.be.approximately(0, 0.5);
    (bounding.width - browserData[id].width).should.be.approximately(0, 0.5);
    (bounding.height - browserData[id].height).should.be.approximately(0, 0.5);
  });

  it('can get bounding rect of skewed rect', function() {
    var id = 'rectShear';
    var shape = $svg.find('#' + id);
    var bounding = BoundingHelper.shape(shape);

    (bounding.left - browserData[id].left).should.be.approximately(0, 0.5);
    (bounding.top - browserData[id].top).should.be.approximately(0, 0.5);
    (bounding.width - browserData[id].width).should.be.approximately(0, 0.5);
    (bounding.height - browserData[id].height).should.be.approximately(0, 0.5);
  });

  it('can get bounding rect of circle', function() {
    var id = 'circle';
    var circle = $svg.find('#' + id);
    var bounding = BoundingHelper.circle(circle);

    (bounding.left - browserData[id].left).should.be.approximately(0, 0.5);
    (bounding.top - browserData[id].top).should.be.approximately(0, 0.5);
    (bounding.width - browserData[id].width).should.be.approximately(0, 0.5);
    (bounding.height - browserData[id].height).should.be.approximately(0, 0.5);
  });

  it('can get bounding rect of rotated circle', function() {
    var id = 'circleRotate';
    var circle = $svg.find('#' + id);
    var bounding = BoundingHelper.circle(circle);

    (bounding.left - browserData[id].left).should.be.approximately(0, 0.5);
    (bounding.top - browserData[id].top).should.be.approximately(0, 0.5);
    (bounding.width - browserData[id].width).should.be.approximately(0, 0.5);
    (bounding.height - browserData[id].height).should.be.approximately(0, 0.5);
  });

  it('can get bounding rect of unproportionally scaled circle', function() {
    var id = 'circle';
    var shape = $svg.find('#' + id);
    var bounding = BoundingHelper.shape(shape);

    (bounding.left - browserData[id].left).should.be.approximately(0, 0.5);
    (bounding.top - browserData[id].top).should.be.approximately(0, 0.5);
    (bounding.width - browserData[id].width).should.be.approximately(0, 0.5);
    (bounding.height - browserData[id].height).should.be.approximately(0, 0.5);
  });

  it('can get bounding rect of path', function() {
    var id = 'heart';
    var path = $svg.find('#' + id);
    var bounding = BoundingHelper.path(path);

    (bounding.left - browserData[id].left).should.be.approximately(0, 0.5);
    (bounding.top - browserData[id].top).should.be.approximately(0, 0.5);
    (bounding.width - browserData[id].width).should.be.approximately(0, 0.5);
    (bounding.height - browserData[id].height).should.be.approximately(0, 0.5);
  });
});
