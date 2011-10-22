jsImageDiff - An image diffing library using JavaScript and HTML5 Canvas
========================================================================

What's it for?
--------------
jsImageDiff is a client-side library for n-way image diffing. It's small, lightweight, fast, and has no dependencies on additional libraries. jsImageDiff should work anywhere HTML5 Canvas does.

How do I use it?
----------------
First, include the library in your page like this:
`<script type="text/javascript" src="jsimagediff.js"></script>`

Then pass an argument bag with _imgs_ as the key, and an array of images as the value.
`jsImageDiff.diff({"imgs": ["http://example.com/img1.jpg", document.getElementById("img2"), "http://example.com/img3.png"]});`

jsImageDiff can take URLs or DOM references to images.

FAQ
---

### Why do I get an error like: SCRIPT5022: DOM Exception: SECURITY_ERR (18) (or something similar) ###
jsImage diff uses the getImageData() API in HTML5 Canvas. For security reasons, Canvas won't allow JavaScript to write a cross-domain image and read the pixel data back out. If you need to read cross-domain content, you'll have to do the usual tricks. See http://stackoverflow.com/questions/4672643/html5-canvas-getimagedata-and-same-origin-policy for some additional info.