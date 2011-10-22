"use strict";

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

/*
args.imgs = ["img1", "img2", document.getElementById("foo")]
*/

var jsImageDiff = (function (document, window) {

    var jsImageDiff = jsImageDiff || {};

    var ImgWrapper = function (source) {
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

        var createImgTag = function (source) {
            if (isImgTag(source)) {
                // Is an <img> tag, add to images
                img = source;
            } else if (typeof source === "string") {
                // Should be URL, try to make an <img> tag and add
                var newImg = new Image();
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

        createImgTag(source);
        createCanvas();
        self.getCtx = getCtx;
        self.getImgData = getImgData;
    };

    jsImageDiff.diff = function (args) {
        var self = this;
        var sourceImages = [];

        var ctxDiff;
        var totalPixelCount;
        var diffPixelCount;

        var parseArgs = function (args) {
            // Parse the source images; if they are <img> do nothing, otherwise put them in them.
            var imgs = args.imgs;
            for (var i = 0; i < imgs.length; i++) {
                sourceImages.push(new ImgWrapper(imgs[i]));
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
            var img1Pixels = sourceImages[0].getImgData();
            var img2Pixels = sourceImages[1].getImgData();

            var imgDiffData = ctxDiff.createImageData(ctxDiff.canvas.width, ctxDiff.canvas.height);
            var imgDiffPixels = imgDiffData.data;

            // Diff images; if source1 === source2, place into diff, otherwise, place RED
            // var var 
            diffPixelCount = 0;
            totalPixelCount = imgDiffPixels.length / 4;

            // i += 4 because the pixel array splits each pixel into rgba, so i[0] = red, i[1] = green, i[2] = blue, and i[3] = alpha
            for (var i = 0; i < imgDiffPixels.length; i += 4) {
                try {
                    var img1r = img1Pixels[i + 0];
                    var img1g = img1Pixels[i + 1];
                    var img1b = img1Pixels[i + 2];
                    var img1a = img1Pixels[i + 3];

                    var img2r = img2Pixels[i + 0];
                    var img2g = img2Pixels[i + 1];
                    var img2b = img2Pixels[i + 2];
                    var img2a = img2Pixels[i + 3];

                    if ((img1r === img2r) && (img1g === img2g) && (img1b === img2b) && (img1a === img2a)) {
                        imgDiffData.data[i + 0] = img1r;
                        imgDiffData.data[i + 1] = img1g;
                        imgDiffData.data[i + 2] = img1b;
                        imgDiffData.data[i + 3] = img1a;
                    } else {
                        imgDiffData.data[i + 0] = 255;
                        imgDiffData.data[i + 1] = 0;
                        imgDiffData.data[i + 2] = 0;
                        imgDiffData.data[i + 3] = 0xff;

                        diffPixelCount++;
                    }
                } catch (err) {
                    // We went out-of-bounds, so fill in with all red
                    imgDiffData.data[i + 0] = 255;
                    imgDiffData.data[i + 1] = 0;
                    imgDiffData.data[i + 2] = 0;
                    imgDiffData.data[i + 3] = 0xff;

                    diffPixelCount++;
                }

                // Create diff image 
                ctxDiff.putImageData(imgDiffData, 0, 0);
            }
        };

        parseArgs(args);
        diff2();

        // Return output
        var retVal = {};
        retVal.sourceImages = sourceImages;
        retVal.diffCanvas = canvasDiff;
        retVal.totalPixels = totalPixelCount;
        retVal.numPixelsDifferent = diffPixelCount;
        retVal.percentageImageDifferent = (diffPixelCount / totalPixelCount) * 100;
        return retVal;
    };

    return jsImageDiff;
})(document, window);
