jsImageDiff
===========

An image diffing library using JavaScript and canvas

What's it for?
--------------
jsImageDiff is a library for n-way image diffing. It's small, lightweight, fast, and has no additional library dependencies. jsImageDiff should work anywhere the canvas element does.

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


```javascript
var images = ["http://example.com/img1.jpg", document.getElementById("img2"), "http://example.com/img3.png"];
var callback = function (results) { ... };
var options = { diffColor: "rgb(255,70,0)" };

jsImageDiff.diff(images, callback, options);
```

When your callback is executed, it'll be passed a single object-literal with the following structure:

```javascript
{
    // Array of canvases of the original images
    sourceCanvases: [<canvas>,<canvas>,...],

    // Canvas object representing the diff of all the images Any pixel that differs
    // between any of the canvases is replaced with diffColor
    diffCanvas: <canvas>,

    // Total number of pixels in the diff image. The image is the height of the
    // tallest image and width of the widest
    totalPixels: <int>,

    // The number of pixels different in the diff image
    numPixelsDifferent: <int>,

    // (diffPixelCount / totalPixelCount) * 100
    percentageImageDifferent: <float>
}
```

Options
-------
* **diffColor** - The color to use when a pixel is different. Defaults to solid red. Currently accepts rgb() and hex (e.g. #ff8c00) syntax.
* **useGrayScale** - This will convert the diff canvas to grayscale and place your diffColor on top of that instead of the original.

FAQ
---

### Why do I get an error like: SCRIPT5022: DOM Exception: SECURITY_ERR (18) (or something similar) ###
jsImageDiff uses the `getImageData()` API in [canvas](http://www.w3.org/TR/html5/embedded-content-0.html#the-canvas-element "HTML5 canvas spec"). For [security reasons](http://www.w3.org/TR/html5/embedded-content-0.html#security-with-canvas-elements "Security with canvas elements"), canvas won't allow JavaScript to write a cross-domain image and read the pixel data back out. If you need to read cross-domain content, you'll have to do the usual tricks (e.g. server-side proxying). See [Stack Overflow](http://stackoverflow.com/questions/4672643/html5-canvas-getimagedata-and-same-origin-policy) for some additional info.