# Bounding Box Calculator for AI exported SVG

This module calculates the bounding box of SVG shape elements. SVG shape elements includes `<circle>`, `<ellipse>`, `<line>`, `<path>`, `<polygon>`, `<polyline>`, `<rect>`. It works best for SVG documents exported from Adobe Illustrator. The test only covers files from Illustrator. It assumes all the property values are valid.

## What it doesn't do

The bounding box the module calculates doesn't exactly match the real one in some cases, we'll cover this in a later section. If you want a precise solution, this module is not for you.

This module doesn't account for the position of an embedded SVG document, meaning the result is relative to the SVG document's top left corner.

Since Illustrator always adds `transform` property on shape elements (when you save as SVG using "Presentation Attributes" for CSS Properties option), not on groups (the `<g>` tag), this module doesn't take nested `transform` into consideration.

## A word for non-exact matching bounding box

The result returned by this module should be the same as the browers' `getBoundingClientRect` does. Again, the coordinates is relative to the SVG document, not the HTML document, if you see a difference.

Browers doesn't return the exact bounding box in the following situations.

- Rotated `<ellipse>`;
- `<Path>` which has control points exceeding the real bounding box;
- Maybe more situations that I haven't found.

Neither does this module.

I don't search for the reason. I guess it's because it's too complex calculating such stuff.

An example is shown below. The actual bounding box is marked in green. Whereas the browsers give you the orange one when calling `getBoundingClientRect` on this `<path>` element. So the bounding box you get from this module is also the orange one.

![Bounding box issue for path elements](https://img.alicdn.com/tps/TB1GPO5LXXXXXcgXFXXXXXXXXXX-358-282.png)