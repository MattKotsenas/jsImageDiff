//"use strict";

/*
Copyright (C) 2011 by Matt Kotsenas

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var jsImageDiff = (function (document, window) {

    var jsImageDiff = jsImageDiff || {};

    //
    // ImgWrapper - Async wrapper that holds a source image and calls the callback when the image is loaded.
    //
    var ImgWrapper = function (source, callback) {
        var self = this;
        var img;
        var ctx;

        // Takes an arg and will return true if arg is reference to a <img>
        var isImgTag = function (arg) {
            var retVal = false;

            if (arg === typeof Object) {
                if (arg.nodeName === "IMG") {
                    retVal = true;
                }
            }

            return retVal;
        };

        // Creates an <img> tag for the passed in image or URL. If the image is already a tag, make a new one.
        // We have to make a new tag because the image may not have finished loading yet, so if we go to check the width / height
        // we'll get 0. We could try to attach an onload handler to the already loading image, but that could create a
        // race condition between checking if loading is done and attaching the event handler.
        var createImgTag = function (source, callback) {
            var newImg = new Image();

            if (isImgTag(source)) {
                newImg.onload = callback;
                newImg.src = source.src;
                img = newImg;
            } else if (typeof source === "string") {
                // Should be URL, try to make an <img> tag and add
                // We need to wrap the callback in another callback because our createCanvas function also relies on the image being loaded.
                newImg.onload = function () { createCanvas(); callback(); };
                newImg.src = source;
                img = newImg;
            } else {
                // Couldn't match, just swallow the error for now
            }
        };

        var createCanvas = function () {
            var canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
        };

        var getCtx = function () {
            return ctx;
        };

        var getImgData = function () {
            var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
            return imgData.data;
        };

        createImgTag(source, callback);
        self.getCtx = getCtx;
        self.getImgData = getImgData;
    };
    //----- ImgWrapper -----

    jsImageDiff.diff = function (args) {
        var self = this;
        var sourceImages = [];

        var callback;
        var imgsResolvedCount;
        var totalImgs;

        var ctxDiff;
        var totalPixelCount;
        var diffPixelCount;

        var resolveImgs = function () {
            imgsResolvedCount += 1;

            if (imgsResolvedCount === totalImgs) {
                diff2();
            }
        };

        var parseArgs = function (args) {
            callback = args.callback || (function () { }); // Set an empty callback function if one isn't supplied.

            // Parse the source images; if they are <img> do nothing, otherwise put them in them.
            if (args.imgs.length < 2) { throw "You must supply at least two images to compare."; }
            var imgs = args.imgs;

            imgsResolvedCount = 0;
            totalImgs = imgs.length;

            for (var i = 0; i < imgs.length; i++) {
                sourceImages.push(new ImgWrapper(imgs[i], resolveImgs));
            }

        };

        var diff2 = function () {
            // Get images
            var img1 = sourceImages[0].getCtx();
            var img2 = sourceImages[1].getCtx();

            // Create diff canvas
            var newWidth = (img1.canvas.width > img2.canvas.width) ? img1.canvas.width : img2.canvas.width;
            var newHeight = (img1.canvas.height > img2.canvas.height) ? img1.canvas.height : img2.canvas.height;

            // var
            canvasDiff = document.createElement("canvas");
            canvasDiff.width = newWidth;
            canvasDiff.height = newHeight;
            var ctxDiff = canvasDiff.getContext("2d");

            // Get the pixel data for the images
            //var img1Pixels = sourceImages[0].getImgData();
            //var img2Pixels = sourceImages[1].getImgData();
            var imgPixels = [];
            sourceImages.forEach(function (img) { imgPixels.push(img.getImgData()); });

            var imgDiffData = ctxDiff.createImageData(ctxDiff.canvas.width, ctxDiff.canvas.height);
            var imgDiffPixels = imgDiffData.data;

            // Diff images; if source1 === source2, place into diff, otherwise, place RED
            // var var 
            diffPixelCount = 0;
            totalPixelCount = imgDiffPixels.length / 4;

            // i += 4 because the pixel array splits each pixel into rgba, so i[0] = red, i[1] = green, i[2] = blue, and i[3] = alpha
            for (var i = 0; i < imgDiffPixels.length; i += 4) {
                try {
                    //                    var img1r = img1Pixels[i + 0];
                    //                    var img1g = img1Pixels[i + 1];
                    //                    var img1b = img1Pixels[i + 2];
                    //                    var img1a = img1Pixels[i + 3];

                    //                    var img2r = img2Pixels[i + 0];
                    //                    var img2g = img2Pixels[i + 1];
                    //                    var img2b = img2Pixels[i + 2];
                    //                    var img2a = img2Pixels[i + 3];

                    var isEqual = true;

                    // We compare all the other images to the first image. Which image we pick is our "base" image doesn't matter
                    // because we require them ALL to be equal.
                    var imgR = imgPixels[0][i + 0];
                    var imgG = imgPixels[0][i + 1];
                    var imgB = imgPixels[0][i + 2];
                    var imgA = imgPixels[0][i + 3];

                    // Start 'j' at 1 because we're using 0 as our base, so we can safely skip comparing with ourselves.
                    for (var j = 1; j < imgPixels.length; j++) {
                        // First check 'isEqual'. If we already know that the pixel doesn't match across all the images, we can
                        // bail out early and avoid actually doing the comparison with the other images.
                        if (isEqual && (imgR === imgPixels[j][i + 0]) && (imgG === imgPixels[j][i + 1]) && (imgB === imgPixels[j][i + 2]) && (imgA === imgPixels[j][ + 3])) {
                            // Pixel match, so move on to the next comparison
                        } else {
                            isEqual = false;
                        }
                    }

                    // If the pixels all match, paint that pixel to the diff canvas, otherwise paint our "diff color"
                    //if ((img1r === img2r) && (img1g === img2g) && (img1b === img2b) && (img1a === img2a)) {
                    if (isEqual) {
                        imgDiffData.data[i + 0] = imgR;
                        imgDiffData.data[i + 1] = imgG;
                        imgDiffData.data[i + 2] = imgB;
                        imgDiffData.data[i + 3] = imgA;
                    } else {
                        imgDiffData.data[i + 0] = 255;
                        imgDiffData.data[i + 1] = 0;
                        imgDiffData.data[i + 2] = 0;
                        imgDiffData.data[i + 3] = 0xff;

                        diffPixelCount++;
                    }
                } catch (err) {
                    // We went out-of-bounds, so paint our "diff color"
                    imgDiffData.data[i + 0] = 255;
                    imgDiffData.data[i + 1] = 0;
                    imgDiffData.data[i + 2] = 0;
                    imgDiffData.data[i + 3] = 0xff;

                    diffPixelCount++;
                }
            }

            // Create diff image 
            ctxDiff.putImageData(imgDiffData, 0, 0);

            returnOutput();
        };

        parseArgs(args);

        var returnOutput = function () {
            var retVal = {};
            retVal.sourceImages = sourceImages;
            retVal.diffCanvas = canvasDiff;
            retVal.totalPixels = totalPixelCount;
            retVal.numPixelsDifferent = diffPixelCount;
            retVal.percentageImageDifferent = (diffPixelCount / totalPixelCount) * 100;

            // Return final results back to the original, user-supplied callback
            callback(retVal);
        }
    };

    return jsImageDiff;
})(document, window);
