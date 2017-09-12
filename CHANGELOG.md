## v2.0.2 (09/12/2017)

Fix `elementObject` doesn't return a gradient object in `lib/element_object.js` due to mixed letter case.

## v2.0.1 (09/06/2017)

Fix wrong bounding box of `<polygon>` and `<polyline>` if their `points` attribute starts with spaces.

## v2.0.0 (06/23/2017)

`boundingOfImage` method accepts an `<image>` node as parameter.

## v1.3.1 (04/11/2017)

No need to trim font size value.

## v1.3.0 (02/28/2017)

Refactor and more elements support.

- Add an option for returning true bounding box of `<ellipse>` with `transform` property;
- Support `<text>` bounding;
- Support `<linearGradient>` and `<radialGradient>` boundings;
- Use element object to eliminate differences between browser DOM element and cheerio node.

## v1.2.0 (01/23/2017)

Add image bounding.

## v1.1.1 (03/31/2016)

Add true bounding box option for the generic `boundingRectOfShape` method.

## v1.1.0 (03/28/2016)

Add `shouldReturnTrueBounding` option for `boundingRectOfPath`.

## v1.0.1 (12/31/2015)

Fix the following bugs.

- Return `0` when `<rect>` element is missing `x` or `y` property;
- Check numbers using scientific notation.