//"use strict";

/*
Copyright (C) 2011 by Matt Kotsenas -- MIT License

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
    // colorHelper - Internal namespace that centralizes working with colors. Converts the different ways
    // of specifying colors into rgba-syntax for use in the diffing algorithm.
    //
    var colorHelper = {};

    // Lookup of the named colors specified in CSS3 (http://www.w3.org/TR/css3-color/#svg-color)
    colorHelper.NAMED_COLORS = {};

    colorHelper.rgbToRgba = function (arg) {
        var regex = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/;

        arg.match(regex);

        var r = RegExp.$1;
        var g = RegExp.$2;
        var b = RegExp.$3;

        return { "r": r, "g": g, "b": b, "a": 1 };
    };

    // The format of an RGB value in hexadecimal notation is a '#' immediately followed by either three or six hexadecimal characters.
    colorHelper.hexToRgba = function (arg) {
        // The three-digit RGB notation (#rgb) is converted into six-digit form (#rrggbb) by replicating digits, not by adding zeros.
        // For example, #fb0 expands to #ffbb00.
        var hex3ToHex6 = function (hex3) {
            var hex6 = "";

            hex6 += hex3[0];
            hex6 += hex3[0];

            hex6 += hex3[1];
            hex6 += hex3[1];

            hex6 += hex3[2];
            hex6 += hex3[2];

            return hex6;
        };

        var hex6ToRgba = function (hex6) {
            var r = hex6.substring(0, 2);
            var g = hex6.substring(2, 4);
            var b = hex6.substring(4);

            r = parseInt(r, 16);
            g = parseInt(g, 16);
            b = parseInt(b, 16);

            return { "r": r, "g": g, "b": b, "a": 1 };
        };

        var regex = /^#([0-9a-fA-F]+)$/;

        arg.match(regex);

        var hex = RegExp.$1;

        if (hex.length === 3) { hex = hex3ToHex6(hex); }

        return hex6ToRgba(hex);
    };

    colorHelper.namedColorToRgba = function () { };
    colorHelper.parseColor = function () { }; // This function will take a string, apply some heuristics to determine what the input format is, then apply one of the other transform functions.

    //----- colorHelper -----

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

    jsImageDiff.diff = function (imgs, userCallback, userOptions) {
        var self = this;
        var sourceImages = [];

        var callback;
        var imgsResolvedCount;
        var totalImgs;
        var diffColor;

        var ctxDiff;
        var totalPixelCount;
        var diffPixelCount;

        var resolveImgs = function () {
            imgsResolvedCount += 1;

            if (imgsResolvedCount === totalImgs) {
                diff2();
            }
        };

        var parseArgs = function (imgs, userCallback, userOptions) {
            callback = userCallback;
            var options = userOptions || {}; // If options aren't specified, make a new empty object so we don't have check for 'undefined' for every property

            // Parse the source images; if they are <img> do nothing, otherwise put them in them.
            if (imgs.length < 2) { throw "You must supply at least two images to compare."; }

            imgsResolvedCount = 0;
            totalImgs = imgs.length;

            for (var i = 0; i < imgs.length; i++) {
                sourceImages.push(new ImgWrapper(imgs[i], resolveImgs));
            }

            var color = options.diffColor || "rgb(255,0,0)";
            diffColor = colorHelper.rgbToRgba(color);
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
                        if (isEqual && (imgR === imgPixels[j][i + 0]) && (imgG === imgPixels[j][i + 1]) && (imgB === imgPixels[j][i + 2]) && (imgA === imgPixels[j][i + 3])) {
                            // Pixel match, so move on to the next comparison
                        } else {
                            isEqual = false;
                        }
                    }

                    // If the pixels all match, paint that pixel to the diff canvas, otherwise paint our "diff color"
                    if (isEqual) {
                        imgDiffData.data[i + 0] = imgR;
                        imgDiffData.data[i + 1] = imgG;
                        imgDiffData.data[i + 2] = imgB;
                        imgDiffData.data[i + 3] = imgA;
                    } else {
                        imgDiffData.data[i + 0] = diffColor.r;
                        imgDiffData.data[i + 1] = diffColor.g;
                        imgDiffData.data[i + 2] = diffColor.b;
                        imgDiffData.data[i + 3] = diffColor.a * 255; //rgba()-syntax specifies an alpha between 0-1 (inclusive), but canvas specifies each pixel between 0-255 (inclusive)

                        diffPixelCount++;
                    }
                } catch (err) {
                    // We went out-of-bounds, so paint our "diff color"
                    imgDiffData.data[i + 0] = diffColor.r;
                    imgDiffData.data[i + 1] = diffColor.g;
                    imgDiffData.data[i + 2] = diffColor.b;
                    imgDiffData.data[i + 3] = diffColor.a * 255; //rgba()-syntax specifies an alpha between 0-1 (inclusive), but canvas specifies each pixel between 0-255 (inclusive)

                    diffPixelCount++;
                }
            }

            // Create diff image 
            ctxDiff.putImageData(imgDiffData, 0, 0);

            returnOutput();
        };

        parseArgs(imgs, userCallback, userOptions);

        var returnOutput = function () {
            var retVal = {};

            retVal.sourceCanvases = [];
            sourceImages.forEach(function (img) { retVal.sourceCanvases.push(img.getCtx().canvas); });

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
