jsImageDiff - An image diffing library using JavaScript and HTML5 Canvas
========================================================================

What's it for?
--------------
jsImageDiff is a library for n-way image diffing. It's small, lightweight, fast, and has no additional library dependencies. jsImageDiff should work anywhere HTML5 Canvas does.

How do I use it?
----------------
First, include the library in your page like this:

```html
<script type="text/javascript" src="jsimagediff.js"></script>
```

Then call .diff() with the two required arguments and an optional property bag:

1. **imgs** - An array of same-origin images. Use either URLs or DOM references.
1. **callback** - A callback function to execute when the diff is finished. This function will have access to the results of the diff.
1. **options** - A property bag with settings to customize and extend jsImageDiff.

	* **diffColor** - The color to use when a pixel is different. Defaults to solid red 'rgb(255,0,0)'. Currently accepts rgb() and hex (e.g. #ff8c00) syntax.


```javascript
var images = ["http://example.com/img1.jpg", document.getElementById("img2"), "http://example.com/img3.png"];
var callback = function (results) { ... };
var options = { diffColor: "rgb(255,70,0)" };

jsImageDiff.diff(images, callback, options);
```

When your callback is executed, it'll be passed a single object-literal with the following structure:

```javascript
{
	sourceCanvases: [<canvas>,<canvas>,...], // Array of canvases of the original images.
	diffCanvas: <canvas>,                    // Canvas object representing the diff of all the images.
	                                         // Any pixel that differs between any of the canvases is replaced with diffColor.
	totalPixels: <int>,                      // Total number of pixels in the diff image.
	                                         // The image is the height of the tallest image and width of the widest.
	numPixelsDifferent: <int>,               // The number of pixels different in the diff image.
	percentImageDifferent: <float>           // (diffPixelCount / totalPixelCount) * 100
}
```

FAQ
---

### Why do I get an error like: SCRIPT5022: DOM Exception: SECURITY_ERR (18) (or something similar) ###
jsImageDiff uses the `getImageData()` API in [HTML5 Canvas](http://www.w3.org/TR/html5/the-canvas-element.html#the-canvas-element "HTML5 Canvas"). For [security reasons](http://www.w3.org/TR/html5/the-canvas-element.html#security-with-canvas-elements "Canvas Security"), Canvas won't allow JavaScript to write a cross-domain image and read the pixel data back out. If you need to read cross-domain content, you'll have to do the usual tricks (e.g. server-side proxying). See http://stackoverflow.com/questions/4672643/html5-canvas-getimagedata-and-same-origin-policy for some additional info.