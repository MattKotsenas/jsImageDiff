jsImageDiff - An image diffing library using JavaScript and HTML5 Canvas
========================================================================

What's it for?
--------------
jsImageDiff is a library for n-way image diffing. It's small, lightweight, fast, and has no additional libraries dependencies. jsImageDiff should work anywhere HTML5 Canvas does.

How do I use it?
----------------
First, include the library in your page like this:

```html
<script type="text/javascript" src="jsimagediff.js"></script>
```

Then pass an argument bag with two keys:

1. **imgs** - An array of same-origin images.
1. **callback** - A callback function to execute when the diff is finished. This function will have access to the results of the diff.

```javascript
jsImageDiff.diff(
	{
		imgs: ["http://example.com/img1.jpg", document.getElementById("img2"), "http://example.com/img3.png"],
		callback: callbackFunction
	}
);
```

jsImageDiff can take URLs or DOM references to images.

When your callback is executed, it'll be passed a single object-literal with the following structure:

```javascript
{
	sourceImages: [],              // Array of 'ImgWrappers' of the original images.
	diffCanvas: <canvas>,          // Canvas object representing the diff of all the images.
	                               // Any pixel that differs between any of the canvases is replaced with red (255,0,0).
	totalPixels: <int>,            // Total number of pixels in the diff image.
	                               // The diff image is the height of the tallest image and width of the widest image.
	numPixelsDifferent: <int>,     // The number of pixels different (red) in the diff image
	percentImageDifferent: <float> // (diffPixelCount / totalPixelCount) * 100
}
```

FAQ
---

### Why do I get an error like: SCRIPT5022: DOM Exception: SECURITY_ERR (18) (or something similar) ###
jsImageDiff uses the getImageData() API in HTML5 Canvas. For security reasons, Canvas won't allow JavaScript to write a cross-domain image and read the pixel data back out. If you need to read cross-domain content, you'll have to do the usual tricks. See http://stackoverflow.com/questions/4672643/html5-canvas-getimagedata-and-same-origin-policy for some additional info.