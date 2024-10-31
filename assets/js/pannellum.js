/*
 * libpannellum - A WebGL and CSS 3D transform based Panorama Renderer
 * Copyright (c) 2012-2022 Matthew Petroff
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

window.libpannellum = (function(window, document, undefined) {

    'use strict';
    
    /**
     * Creates a new panorama renderer.
     * @constructor
     * @param {HTMLElement} container - The container element for the renderer.
     * @param {WebGLRenderingContext} [context] - Existing WebGL context (instead of container).
     */
    function Renderer(container, context) {
        var canvas;
        if (container) {
            canvas = document.createElement('canvas');
            canvas.style.width = canvas.style.height = '100%';
            container.appendChild(canvas);
        }
    
        var program, gl, vs, fs;
        var previewProgram, previewVs, previewFs;
        var fallbackImgSize;
        var world;
        var vtmps;
        var pose;
        var image, imageType;
        var texCoordBuffer, cubeVertBuf, cubeVertTexCoordBuf, cubeVertIndBuf;
        var globalParams;
        var sides = ['f', 'b', 'u', 'd', 'l', 'r'];
        var fallbackSides = ['f', 'r', 'b', 'l', 'u', 'd'];
    
        if (context)
            gl = context;
    
        /**
         * Initialize renderer.
         * @memberof Renderer
         * @instance
         * @param {Image|Array|Object} image - Input image; format varies based on
         *      `imageType`. For `equirectangular`, this is an image; for
         *      `cubemap`, this is an array of images for the cube faces in the
         *      order [+z, +x, -z, -x, +y, -y]; for `multires`, this is a
         *      configuration object.
         * @param {string} imageType - The type of the image: `equirectangular`,
         *      `cubemap`, or `multires`.
         * @param {number} haov - Initial horizontal angle of view.
         * @param {number} vaov - Initial vertical angle of view.
         * @param {number} voffset - Initial vertical offset angle.
         * @param {function} callback - Load callback function.
         * @param {Object} [params] - Other configuration parameters (`horizonPitch`, `horizonRoll`, `backgroundColor`).
         */
        this.init = function(_image, _imageType, haov, vaov, voffset, callback, params) {
            // Default argument for image type
            if (_imageType === undefined)
                _imageType = 'equirectangular';
    
            if (_imageType != 'equirectangular' && _imageType != 'cubemap' &&
                _imageType != 'multires') {
                console.log('Error: invalid image type specified!');
                throw {type: 'config error'};
            }
    
            imageType = _imageType;
            image = _image;
            globalParams = params || {};
    
            // Clear old data
            if (program) {
                if (vs) {
                    gl.detachShader(program, vs);
                    gl.deleteShader(vs);
                }
                if (fs) {
                    gl.detachShader(program, fs);
                    gl.deleteShader(fs);
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
                if (program.texture)
                    gl.deleteTexture(program.texture);
                if (program.nodeCache)
                    for (var i = 0; i < program.nodeCache.length; i++)
                        gl.deleteTexture(program.nodeCache[i].texture);
                if (program.textureLoads) {
                    pendingTextureRequests = [];
                    while (program.textureLoads.length > 0)
                        program.textureLoads.shift()(false);
                }
                gl.deleteProgram(program);
                program = undefined;
            }
            if (previewProgram) {
                if (previewVs) {
                    gl.detachShader(previewProgram, previewVs);
                    gl.deleteShader(previewVs);
                }
                if (previewFs) {
                    gl.detachShader(previewProgram, previewFs);
                    gl.deleteShader(previewFs);
                }
                gl.deleteProgram(previewProgram);
                previewProgram = undefined;
            }
            pose = undefined;
    
            var s;
            var faceMissing = false;
            var cubeImgWidth;
            if (imageType == 'cubemap') {
                for (s = 0; s < 6; s++) {
                    if (image[s].width > 0) {
                        if (cubeImgWidth === undefined)
                            cubeImgWidth = image[s].width;
                        if (cubeImgWidth != image[s].width)
                            console.log('Cube faces have inconsistent widths: ' + cubeImgWidth + ' vs. ' + image[s].width);
                    } else
                        faceMissing = true;
                }
            }
            function fillMissingFaces(imgSize) {
                if (faceMissing) { // Fill any missing fallback/cubemap faces with background
                    var nbytes = imgSize * imgSize * 4; // RGB, plus non-functional alpha
                    var imageArray = new Uint8ClampedArray(nbytes);
                    var rgb = params.backgroundColor ? params.backgroundColor : [0, 0, 0];
                    rgb[0] *= 255;
                    rgb[1] *= 255;
                    rgb[2] *= 255;
                    // Maybe filling could be done faster, see e.g., https://stackoverflow.com/questions/1295584/most-efficient-way-to-create-a-zero-filled-javascript-array
                    for (var i = 0; i < nbytes; i++) {
                        imageArray[i++] = rgb[0];
                        imageArray[i++] = rgb[1];
                        imageArray[i++] = rgb[2];
                    }
                    var backgroundSquare = new ImageData(imageArray, imgSize, imgSize);
                    for (s = 0; s < 6; s++) {
                        if (image[s].width == 0)
                            image[s] = backgroundSquare;
                    }
                }
            }
            
            // This awful browser specific test exists because iOS 8/9 and IE 11
            // don't display non-power-of-two cubemap textures but also don't
            // throw an error (tested on an iPhone 5c / iOS 8.1.3 / iOS 9.2 /
            // iOS 10.3.1).
            // Therefore, the WebGL context is never created for these browsers for
            // NPOT cubemaps, and the CSS 3D transform fallback renderer is used
            // instead.
            if (!(imageType == 'cubemap' &&
                (cubeImgWidth & (cubeImgWidth - 1)) !== 0 &&
                (navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad).* os 8_/) ||
                navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad).* os 9_/) ||
                navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad).* os 10_/) ||
                navigator.userAgent.match(/Trident.*rv[ :]*11\./)))) {
                // Enable WebGL on canvas
                if (!gl)
                    gl = canvas.getContext('experimental-webgl', {alpha: false, depth: false});
                if (gl && gl.getError() == 1286)
                    handleWebGLError1286();
            }
            
            // If there is no WebGL, fall back to CSS 3D transform renderer.
            // This will discard the image loaded so far and load the fallback image.
            // While browser specific tests are usually frowned upon, the
            // fallback viewer only really works with WebKit/Blink and IE 10/11
            // (it doesn't work properly in Firefox).
            if (!gl && ((imageType == 'multires' && image.hasOwnProperty('fallbackPath')) ||
                imageType == 'cubemap') &&
                ('WebkitAppearance' in document.documentElement.style ||
                navigator.userAgent.match(/Trident.*rv[ :]*11\./) ||
                navigator.appVersion.indexOf('MSIE 10') !== -1)) {
                // Remove old world if it exists
                if (world) {
                    container.removeChild(world);
                }
                
                // Initialize renderer
                world = document.createElement('div');
                world.className = 'pnlm-world';
                
                // Add images
                var path;
                if (image.basePath) {
                    path = image.basePath + image.fallbackPath;
                } else {
                    path = image.fallbackPath;
                }
                var loaded = 0;
                var onLoad = function() {
                    // Draw image on canvas
                    var faceCanvas = document.createElement('canvas');
                    faceCanvas.className = 'pnlm-face pnlm-' + fallbackSides[this.side] + 'face';
                    world.appendChild(faceCanvas);
                    var faceContext = faceCanvas.getContext('2d');
                    faceCanvas.style.width = this.width + 4 + 'px';
                    faceCanvas.style.height = this.height + 4 + 'px';
                    faceCanvas.width = this.width + 4;
                    faceCanvas.height = this.height + 4;
                    faceContext.drawImage(this, 2, 2);
                    var imgData = faceContext.getImageData(0, 0, faceCanvas.width, faceCanvas.height);
                    var data = imgData.data;
                    
                    // Duplicate edge pixels
                    var i;
                    var j;
                    for (i = 2; i < faceCanvas.width - 2; i++) {
                        for (j = 0; j < 4; j++) {
                            data[(i + faceCanvas.width) * 4 + j] = data[(i + faceCanvas.width * 2) * 4 + j];
                            data[(i + faceCanvas.width * (faceCanvas.height - 2)) * 4 + j] = data[(i + faceCanvas.width * (faceCanvas.height - 3)) * 4 + j];
                        }
                    }
                    for (i = 2; i < faceCanvas.height - 2; i++) {
                        for (j = 0; j < 4; j++) {
                            data[(i * faceCanvas.width + 1) * 4 + j] = data[(i * faceCanvas.width + 2) * 4 + j];
                            data[((i + 1) * faceCanvas.width - 2) * 4 + j] = data[((i + 1) * faceCanvas.width - 3) * 4 + j];
                        }
                    }
                    for (j = 0; j < 4; j++) {
                        data[(faceCanvas.width + 1) * 4 + j] = data[(faceCanvas.width * 2 + 2) * 4 + j];
                        data[(faceCanvas.width * 2 - 2) * 4 + j] = data[(faceCanvas.width * 3 - 3) * 4 + j];
                        data[(faceCanvas.width * (faceCanvas.height - 2) + 1) * 4 + j] = data[(faceCanvas.width * (faceCanvas.height - 3) + 2) * 4 + j];
                        data[(faceCanvas.width * (faceCanvas.height - 1) - 2) * 4 + j] = data[(faceCanvas.width * (faceCanvas.height - 2) - 3) * 4 + j];
                    }
                    for (i = 1; i < faceCanvas.width - 1; i++) {
                        for (j = 0; j < 4; j++) {
                            data[i * 4 + j] = data[(i + faceCanvas.width) * 4 + j];
                            data[(i + faceCanvas.width * (faceCanvas.height - 1)) * 4 + j] = data[(i + faceCanvas.width * (faceCanvas.height - 2)) * 4 + j];
                        }
                    }
                    for (i = 1; i < faceCanvas.height - 1; i++) {
                        for (j = 0; j < 4; j++) {
                            data[(i * faceCanvas.width) * 4 + j] = data[(i * faceCanvas.width + 1) * 4 + j];
                            data[((i + 1) * faceCanvas.width - 1) * 4 + j] = data[((i + 1) * faceCanvas.width - 2) * 4 + j];
                        }
                    }
                    for (j = 0; j < 4; j++) {
                        data[j] = data[(faceCanvas.width + 1) * 4 + j];
                        data[(faceCanvas.width - 1) * 4 + j] = data[(faceCanvas.width * 2 - 2) * 4 + j];
                        data[(faceCanvas.width * (faceCanvas.height - 1)) * 4 + j] = data[(faceCanvas.width * (faceCanvas.height - 2) + 1) * 4 + j];
                        data[(faceCanvas.width * faceCanvas.height - 1) * 4 + j] = data[(faceCanvas.width * (faceCanvas.height - 1) - 2) * 4 + j];
                    }
                    
                    // Draw image width duplicated edge pixels on canvas
                    faceContext.putImageData(imgData, 0, 0);
                    
                    incLoaded.call(this);
                };
                var incLoaded = function() {
                    if (this.width > 0) {
                        if (fallbackImgSize === undefined)
                            fallbackImgSize = this.width;
                        if (fallbackImgSize != this.width)
                            console.log('Fallback faces have inconsistent widths: ' + fallbackImgSize + ' vs. ' + this.width);
                    } else
                        faceMissing = true;
                    loaded++;
                    if (loaded == 6) {
                        fallbackImgSize = this.width;
                        container.appendChild(world);
                        callback();
                    }
                };
                faceMissing = false;
                for (s = 0; s < 6; s++) {
                    var faceImg = new Image();
                    faceImg.crossOrigin = globalParams.crossOrigin ? globalParams.crossOrigin : 'anonymous';
                    faceImg.side = s;
                    faceImg.onload = onLoad;
                    faceImg.onerror = incLoaded; // ignore missing face to support partial fallback image
                    if (imageType == 'multires') {
                        faceImg.src = path.replace('%s', fallbackSides[s]) + (image.extension ? '.' + image.extension : '');
                    } else {
                        faceImg.src = image[s].src;
                    }
                }
                fillMissingFaces(fallbackImgSize);
                return;
            } else if (!gl) {
                console.log('Error: no WebGL support detected!');
                throw {type: 'no webgl'};
            }
            if (imageType == 'cubemap')
                fillMissingFaces(cubeImgWidth);
            if (image.basePath) {
                image.fullpath = image.basePath + image.path;
            } else {
                image.fullpath = image.path;
            }
            image.invTileResolution = 1 / image.tileResolution;
            
            var vertices = createCube();
            vtmps = [];
            for (s = 0; s < 6; s++) {
                vtmps[s] = vertices.slice(s * 12, s * 12 + 12);
                vertices = createCube();
            }
            
            // Make sure image isn't too big
            var maxWidth = 0;
            if (imageType == 'equirectangular') {
                maxWidth = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                if (Math.max(image.width / 2, image.height) > maxWidth) {
                    console.log('Error: The image is too big; it\'s ' + image.width + 'px wide, '+
                                'but this device\'s maximum supported size is ' + (maxWidth * 2) + 'px.');
                    throw {type: 'webgl size error', width: image.width, maxWidth: maxWidth * 2};
                }
            } else if (imageType == 'cubemap') {
                if (cubeImgWidth > gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE)) {
                    console.log('Error: The image is too big; it\'s ' + cubeImgWidth + 'px wide, ' +
                                'but this device\'s maximum supported size is ' + maxWidth + 'px.');
                    throw {type: 'webgl size error', width: cubeImgWidth, maxWidth: maxWidth};
                }
            }
    
            // Store horizon pitch and roll if applicable
            if (params !== undefined) {
                var horizonPitch = isNaN(params.horizonPitch) ? 0 : Number(params.horizonPitch),
                    horizonRoll = isNaN(params.horizonRoll) ? 0 : Number(params.horizonRoll);
                if (horizonPitch != 0 || horizonRoll != 0)
                    pose = [horizonPitch, horizonRoll];
            }
    
            // Set 2d texture binding
            var glBindType = gl.TEXTURE_2D;
    
            // Create viewport for entire canvas
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    
            // Check precision support
            if (gl.getShaderPrecisionFormat) {
                var precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
                if (precision && precision.precision < 1) {
                    // `highp` precision not supported; https://stackoverflow.com/a/33308927
                    fragEquiCubeBase = fragEquiCubeBase.replace('highp', 'mediump');
                }
            }
    
            // Create vertex shader
            vs = gl.createShader(gl.VERTEX_SHADER);
            var vertexSrc = v;
            if (imageType == 'multires') {
                vertexSrc = vMulti;
            }
            gl.shaderSource(vs, vertexSrc);
            gl.compileShader(vs);
    
            // Create fragment shader
            fs = gl.createShader(gl.FRAGMENT_SHADER);
            var fragmentSrc = fragEquirectangular;
            if (imageType == 'cubemap') {
                glBindType = gl.TEXTURE_CUBE_MAP;
                fragmentSrc = fragCube;
            } else if (imageType == 'multires') {
                fragmentSrc = fragMulti;
            }
            gl.shaderSource(fs, fragmentSrc);
            gl.compileShader(fs);
    
            // Link WebGL program
            program = gl.createProgram();
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);
    
            // Log errors
            if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
                console.log(gl.getShaderInfoLog(vs));
            if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
                console.log(gl.getShaderInfoLog(fs));
            if (!gl.getProgramParameter(program, gl.LINK_STATUS))
                console.log(gl.getProgramInfoLog(program));
    
            // Use WebGL program
            gl.useProgram(program);
    
            program.drawInProgress = false;
    
            // Set background clear color (does not apply to cubemap/fallback image)
            if (params.backgroundColor !== null) {
                var color = params.backgroundColor ? params.backgroundColor : [0, 0, 0];
                gl.clearColor(color[0], color[1], color[2], 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
    
            // Look up texture coordinates location
            program.texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
            gl.enableVertexAttribArray(program.texCoordLocation);
    
            if (imageType != 'multires') {
                // Provide texture coordinates for rectangle
                if (!texCoordBuffer)
                    texCoordBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,1,1,1,-1,-1,1,1,-1,-1,-1]), gl.STATIC_DRAW);
                gl.vertexAttribPointer(program.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
                // Pass aspect ratio
                program.aspectRatio = gl.getUniformLocation(program, 'u_aspectRatio');
                gl.uniform1f(program.aspectRatio, gl.drawingBufferWidth / gl.drawingBufferHeight);
    
                // Locate psi, theta, focal length, horizontal extent, vertical extent, and vertical offset
                program.psi = gl.getUniformLocation(program, 'u_psi');
                program.theta = gl.getUniformLocation(program, 'u_theta');
                program.f = gl.getUniformLocation(program, 'u_f');
                program.h = gl.getUniformLocation(program, 'u_h');
                program.v = gl.getUniformLocation(program, 'u_v');
                program.vo = gl.getUniformLocation(program, 'u_vo');
                program.rot = gl.getUniformLocation(program, 'u_rot');
    
                // Pass horizontal extent, vertical extent, and vertical offset
                gl.uniform1f(program.h, haov / (Math.PI * 2.0));
                gl.uniform1f(program.v, vaov / Math.PI);
                gl.uniform1f(program.vo, voffset / Math.PI * 2);
    
                // Set background color
                if (imageType == 'equirectangular') {
                    program.backgroundColor = gl.getUniformLocation(program, 'u_backgroundColor');
                    gl.uniform4fv(program.backgroundColor, color.concat([1]));
                }
    
                // Create texture
                program.texture = gl.createTexture();
                gl.bindTexture(glBindType, program.texture);
    
                // Upload images to texture depending on type
                if (imageType == 'cubemap') {
                    // Load all six sides of the cube map
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image[1]);
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image[3]);
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image[4]);
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image[5]);
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image[0]);
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image[2]);
                } else {
                    if (image.width <= maxWidth) {
                        gl.uniform1i(gl.getUniformLocation(program, 'u_splitImage'), 0);
                        // Upload image to the texture
                        gl.texImage2D(glBindType, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
                    } else {
                        // Image needs to be split into two parts due to texture size limits
                        gl.uniform1i(gl.getUniformLocation(program, 'u_splitImage'), 1);
    
                        // Draw image on canvas
                        var cropCanvas = document.createElement('canvas');
                        cropCanvas.width = image.width / 2;
                        cropCanvas.height = image.height;
                        var cropContext = cropCanvas.getContext('2d');
                        cropContext.drawImage(image, 0, 0);
    
                        // Upload first half of image to the texture
                        var cropImage = cropContext.getImageData(0, 0, image.width / 2, image.height);
                        gl.texImage2D(glBindType, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cropImage);
    
                        // Create and bind texture for second half of image
                        program.texture2 = gl.createTexture();
                        gl.activeTexture(gl.TEXTURE1);
                        gl.bindTexture(glBindType, program.texture2);
                        gl.uniform1i(gl.getUniformLocation(program, 'u_image1'), 1);
    
                        // Upload second half of image to the texture
                        cropContext.drawImage(image, -image.width / 2, 0);
                        cropImage = cropContext.getImageData(0, 0, image.width / 2, image.height);
                        gl.texImage2D(glBindType, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cropImage);
    
                        // Set parameters for rendering any size
                        gl.texParameteri(glBindType, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(glBindType, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(glBindType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                        gl.texParameteri(glBindType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
                        // Reactivate first texture unit
                        gl.activeTexture(gl.TEXTURE0);
                    }
                }
    
                // Set parameters for rendering any size
                if (imageType != "cubemap" && image.width && image.width <= maxWidth &&
                    haov == 2 * Math.PI && (image.width & (image.width - 1)) == 0)
                    gl.texParameteri(glBindType, gl.TEXTURE_WRAP_S, gl.REPEAT); // Only supported for power-of-two images in WebGL 1
                else
                    gl.texParameteri(glBindType, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(glBindType, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(glBindType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(glBindType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
            } else {
                // Look up vertex coordinates location
                program.vertPosLocation = gl.getAttribLocation(program, 'a_vertCoord');
                gl.enableVertexAttribArray(program.vertPosLocation);
    
                // Create buffers
                if (!cubeVertBuf)
                    cubeVertBuf = gl.createBuffer();
                if (!cubeVertTexCoordBuf)
                    cubeVertTexCoordBuf = gl.createBuffer();
                if (!cubeVertIndBuf)
                    cubeVertIndBuf = gl.createBuffer();
    
                // Bind texture coordinate buffer and pass coordinates to WebGL
                gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertTexCoordBuf);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,1,0,1,1,0,1]), gl.STATIC_DRAW);
                gl.vertexAttribPointer(program.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
                // Bind square index buffer and pass indices to WebGL
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertIndBuf);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,0,2,3]), gl.STATIC_DRAW);
    
                // Bind vertex buffer
                gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertBuf);
                gl.vertexAttribPointer(program.vertPosLocation, 3, gl.FLOAT, false, 0, 0);
    
                // Find uniforms
                program.perspUniform = gl.getUniformLocation(program, 'u_perspMatrix');
                program.cubeUniform = gl.getUniformLocation(program, 'u_cubeMatrix');
                //program.colorUniform = gl.getUniformLocation(program, 'u_color');
    
                program.currentNodes = [];
                program.nodeCache = [];
                program.nodeCacheTimestamp = 0;
                program.textureLoads = [];
    
                if (image.shtHash || image.equirectangularThumbnail) {
                    // Create vertex shader
                    previewVs = gl.createShader(gl.VERTEX_SHADER);
                    gl.shaderSource(previewVs, v);
                    gl.compileShader(previewVs);
    
                    // Create fragment shader
                    previewFs = gl.createShader(gl.FRAGMENT_SHADER);
                    gl.shaderSource(previewFs, fragEquirectangular);
                    gl.compileShader(previewFs);
    
                    // Link WebGL program
                    previewProgram = gl.createProgram();
                    gl.attachShader(previewProgram, previewVs);
                    gl.attachShader(previewProgram, previewFs);
                    gl.linkProgram(previewProgram);
    
                    // Log errors
                    if (!gl.getShaderParameter(previewVs, gl.COMPILE_STATUS))
                        console.log(gl.getShaderInfoLog(previewVs));
                    if (!gl.getShaderParameter(previewFs, gl.COMPILE_STATUS))
                        console.log(gl.getShaderInfoLog(previewFs));
                    if (!gl.getProgramParameter(previewProgram, gl.LINK_STATUS))
                        console.log(gl.getProgramInfoLog(previewProgram));
    
                    // Use WebGL program
                    gl.useProgram(previewProgram);
    
                    // Look up texture coordinates location
                    previewProgram.texCoordLocation = gl.getAttribLocation(previewProgram, 'a_texCoord');
                    gl.enableVertexAttribArray(previewProgram.texCoordLocation);
    
                    // Provide texture coordinates for rectangle
                    if (!texCoordBuffer)
                        texCoordBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,1,1,1,-1,-1,1,1,-1,-1,-1]), gl.STATIC_DRAW);
                    gl.vertexAttribPointer(previewProgram.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
                    // Pass aspect ratio
                    previewProgram.aspectRatio = gl.getUniformLocation(previewProgram, 'u_aspectRatio');
                    gl.uniform1f(previewProgram.aspectRatio, gl.drawingBufferWidth / gl.drawingBufferHeight);
    
                    // Locate psi, theta, focal length, horizontal extent, vertical extent, and vertical offset
                    previewProgram.psi = gl.getUniformLocation(previewProgram, 'u_psi');
                    previewProgram.theta = gl.getUniformLocation(previewProgram, 'u_theta');
                    previewProgram.f = gl.getUniformLocation(previewProgram, 'u_f');
                    previewProgram.h = gl.getUniformLocation(previewProgram, 'u_h');
                    previewProgram.v = gl.getUniformLocation(previewProgram, 'u_v');
                    previewProgram.vo = gl.getUniformLocation(previewProgram, 'u_vo');
                    previewProgram.rot = gl.getUniformLocation(previewProgram, 'u_rot');
    
                    // Pass horizontal extent
                    gl.uniform1f(previewProgram.h, 1.0);
    
                    // Create texture
                    previewProgram.texture = gl.createTexture();
                    gl.bindTexture(glBindType, previewProgram.texture);
    
                    // Upload preview image to the texture
                    var previewImage, vext, voff;
                    var uploadPreview = function() {
                        gl.useProgram(previewProgram);
    
                        gl.uniform1i(gl.getUniformLocation(previewProgram, 'u_splitImage'), 0);
                        gl.texImage2D(glBindType, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, previewImage);
    
                        // Set parameters for rendering any size
                        gl.texParameteri(glBindType, gl.TEXTURE_WRAP_S, gl.REPEAT);
                        gl.texParameteri(glBindType, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(glBindType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                        gl.texParameteri(glBindType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
                        // Pass vertical extent and vertical offset
                        gl.uniform1f(previewProgram.v, vext);
                        gl.uniform1f(previewProgram.vo, voff);
    
                        gl.useProgram(program);
                    };
                    if (image.shtHash) {
                        previewImage = shtDecodeImage(image.shtHash);
                        // Vertical extent & offset are chosen to set the top and bottom
                        // pixels in the preview image to be exactly at the zenith and
                        // nadir, respectively, which matches the pre-calculated Ylm
                        vext = (2 + 1 / 31) / 2;
                        voff = 1 - (2 + 1 / 31) / 2;
                        uploadPreview();
                    }
                    if (image.equirectangularThumbnail) {
                        if (typeof image.equirectangularThumbnail === 'string') {
                            if (image.equirectangularThumbnail.slice(0, 5) == 'data:') {
                                // Data URI
                                previewImage = new Image();
                                previewImage.onload = function() {
                                    vext = 1;
                                    voff = 0;
                                    uploadPreview();
                                };
                                previewImage.src = image.equirectangularThumbnail;
                            } else {
                                console.log('Error: thumbnail string is not a data URI!');
                                throw {type: 'config error'};
                            }
                        } else {
                            // ImageData / ImageBitmap / HTMLImageElement / HTMLCanvasElement
                            previewImage = image.equirectangularThumbnail;
                            vext = 1;
                            voff = 0;
                            uploadPreview();
                        }
                    }
    
                    // Reactivate main program
                    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertBuf);
                    gl.vertexAttribPointer(program.vertPosLocation, 3, gl.FLOAT, false, 0, 0);
                    gl.useProgram(program);
                }
            }
    
            // Check if there was an error
            var err = gl.getError();
            if (err !== 0) {
                console.log('Error: Something went wrong with WebGL!', err);
                throw {type: 'webgl error'};
            }
    
            callback();
         };
    
        /**
         * Destroy renderer.
         * @memberof Renderer
         * @instance
         */
        this.destroy = function() {
            if (container !== undefined) {
                if (canvas !== undefined && container.contains(canvas)) {
                    container.removeChild(canvas);
                }
                if (world !== undefined && container.contains(world)) {
                    container.removeChild(world);
                }
            }
            if (gl) {
                // The spec says this is only supposed to simulate losing the WebGL
                // context, but in practice it tends to actually free the memory.
                var extension = gl.getExtension('WEBGL_lose_context');
                if (extension)
                    extension.loseContext();
            }
        };
    
        /**
         * Resize renderer (call after resizing container).
         * @memberof Renderer
         * @instance
         */
        this.resize = function() {
            var pixelRatio = window.devicePixelRatio || 1;
            canvas.width = canvas.clientWidth * pixelRatio;
            canvas.height = canvas.clientHeight * pixelRatio;
            if (gl) {
                if (gl.getError() == 1286)
                    handleWebGLError1286();
                gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                if (imageType != 'multires') {
                    gl.uniform1f(program.aspectRatio, canvas.clientWidth / canvas.clientHeight);
                } else if (image.shtHash) {
                    gl.useProgram(previewProgram);
                    gl.uniform1f(previewProgram.aspectRatio, canvas.clientWidth / canvas.clientHeight);
                    gl.useProgram(program);
                }
            }
        };
        // Initialize canvas size
        if (canvas)
            this.resize();
    
        /**
         * Set renderer horizon pitch and roll.
         * @memberof Renderer
         * @instance
         * @param {number} horizonPitch - Pitch of horizon (in radians).
         * @param {number} horizonRoll - Roll of horizon (in radians).
         */
        this.setPose = function(horizonPitch, horizonRoll) {
            horizonPitch = isNaN(horizonPitch) ? 0 : Number(horizonPitch);
            horizonRoll = isNaN(horizonRoll) ? 0 : Number(horizonRoll);
            if (horizonPitch == 0 && horizonRoll == 0)
                pose = undefined;
            else
                pose = [horizonPitch, horizonRoll];
        };
    
        /**
         * Render new view of panorama.
         * @memberof Renderer
         * @instance
         * @param {number} pitch - Pitch to render at (in radians).
         * @param {number} yaw - Yaw to render at (in radians).
         * @param {number} hfov - Horizontal field of view to render with (in radians).
         * @param {Object} [params] - Extra configuration parameters. 
         * @param {number} [params.roll] - Camera roll (in radians).
         * @param {string} [params.returnImage] - Return rendered image? If specified, should be 'ImageBitmap', 'image/jpeg', or 'image/png'.
         * @param {function} [params.hook] - Hook for executing arbitrary function in this environment.
         * @param {boolean} [params.dynamic] - Whether or not the image is dynamic (e.g., video) and should be updated.
         */
        this.render = function(pitch, yaw, hfov, params) {
            var focal, i, s, roll = 0;
            if (params === undefined)
                params = {};
            if (params.roll)
                roll = params.roll;
            if (params.dynamic)
                var dynamic = params.dynamic;
    
            // Apply pitch and roll transformation if applicable
            if (pose !== undefined) {
                var horizonPitch = pose[0],
                    horizonRoll = pose[1];
    
                // Calculate new pitch and yaw
                var orig_pitch = pitch,
                    orig_yaw = yaw,
                    x = Math.cos(horizonRoll) * Math.sin(pitch) * Math.sin(horizonPitch) +
                        Math.cos(pitch) * (Math.cos(horizonPitch) * Math.cos(yaw) +
                        Math.sin(horizonRoll) * Math.sin(horizonPitch) * Math.sin(yaw)),
                    y = -Math.sin(pitch) * Math.sin(horizonRoll) +
                        Math.cos(pitch) * Math.cos(horizonRoll) * Math.sin(yaw),
                    z = Math.cos(horizonRoll) * Math.cos(horizonPitch) * Math.sin(pitch) +
                        Math.cos(pitch) * (-Math.cos(yaw) * Math.sin(horizonPitch) +
                        Math.cos(horizonPitch) * Math.sin(horizonRoll) * Math.sin(yaw));
                pitch = Math.asin(Math.max(Math.min(z, 1), -1));
                yaw = Math.atan2(y, x);
    
                // Calculate roll
                var v = [Math.cos(orig_pitch) * (Math.sin(horizonRoll) * Math.sin(horizonPitch) * Math.cos(orig_yaw) -
                        Math.cos(horizonPitch) * Math.sin(orig_yaw)),
                        Math.cos(orig_pitch) * Math.cos(horizonRoll) * Math.cos(orig_yaw),
                        Math.cos(orig_pitch) * (Math.cos(horizonPitch) * Math.sin(horizonRoll) * Math.cos(orig_yaw) +
                        Math.sin(orig_yaw) * Math.sin(horizonPitch))],
                    w = [-Math.cos(pitch) * Math.sin(yaw), Math.cos(pitch) * Math.cos(yaw)];
                var roll_adj = Math.acos(Math.max(Math.min((v[0]*w[0] + v[1]*w[1]) /
                    (Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]) *
                    Math.sqrt(w[0]*w[0]+w[1]*w[1])), 1), -1));
                if (v[2] < 0)
                    roll_adj = 2 * Math.PI - roll_adj;
                roll += roll_adj;
            }
    
            // Execute function hook
            if (params.hook) {
                params.hook({
                    gl: gl,
                    program: program,
                    previewProgram: previewProgram,
                    imageType: imageType,
                    texCoordBuffer: texCoordBuffer,
                    cubeVertBuf: cubeVertBuf,
                    cubeVertTexCoordBuf: cubeVertTexCoordBuf,
                    cubeVertIndBuf: cubeVertIndBuf
                });
            }
    
            // If no WebGL
            if (!gl && (imageType == 'multires' || imageType == 'cubemap')) {
                // Determine face transforms
                s = fallbackImgSize / 2;
                
                var transforms = {
                    f: 'translate3d(-' + (s + 2) + 'px, -' + (s + 2) + 'px, -' + s + 'px)',
                    b: 'translate3d(' + (s + 2) + 'px, -' + (s + 2) + 'px, ' + s + 'px) rotateX(180deg) rotateZ(180deg)',
                    u: 'translate3d(-' + (s + 2) + 'px, -' + s + 'px, ' + (s + 2) + 'px) rotateX(270deg)',
                    d: 'translate3d(-' + (s + 2) + 'px, ' + s + 'px, -' + (s + 2) + 'px) rotateX(90deg)',
                    l: 'translate3d(-' + s + 'px, -' + (s + 2) + 'px, ' + (s + 2) + 'px) rotateX(180deg) rotateY(90deg) rotateZ(180deg)',
                    r: 'translate3d(' + s + 'px, -' + (s + 2) + 'px, -' + (s + 2) + 'px) rotateY(270deg)'
                };
                focal = 1 / Math.tan(hfov / 2);
                var zoom = focal * canvas.clientWidth / 2 + 'px';
                var transform = 'perspective(' + zoom + ') translateZ(' + zoom + ') rotateX(' + pitch + 'rad) rotateY(' + yaw + 'rad) ';
                
                // Apply face transforms
                var faces = Object.keys(transforms);
                for (i = 0; i < 6; i++) {
                    var face = world.querySelector('.pnlm-' + faces[i] + 'face');
                    if (!face)
                        continue; // ignore missing face to support partial cubemap/fallback image
                    face.style.webkitTransform = transform + transforms[faces[i]];
                    face.style.transform = transform + transforms[faces[i]];
                }
                return;
            }
            
            if (imageType != 'multires') {
                // Calculate focal length from vertical field of view
                var vfov = 2 * Math.atan(Math.tan(hfov * 0.5) / (gl.drawingBufferWidth / gl.drawingBufferHeight));
                focal = 1 / Math.tan(vfov * 0.5);
    
                // Pass psi, theta, roll, and focal length
                gl.uniform1f(program.psi, yaw);
                gl.uniform1f(program.theta, pitch);
                gl.uniform1f(program.rot, roll);
                gl.uniform1f(program.f, focal);
                
                if (dynamic === true) {
                    // Update texture if dynamic
                    if (imageType == 'equirectangular') {
                        gl.bindTexture(gl.TEXTURE_2D, program.texture);
                        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
                    }
                }
                
                // Draw using current buffer
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            
            } else {
                // Draw SHT hash preview, if needed
                var isPreview = (typeof image.shtHash !== 'undefined') ||
                    (typeof image.equirectangularThumbnail !== 'undefined');
                var drawPreview = isPreview;
                if (isPreview && program.currentNodes.length >= 6) {
                    drawPreview = false;
                    for (var i = 0; i < 6; i++) {
                        if (!program.currentNodes[i].textureLoaded) {
                            drawPreview = true;
                            break;
                        }
                    }
                }
                if (drawPreview) {
                    gl.useProgram(previewProgram);
                    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
                    gl.vertexAttribPointer(previewProgram.texCoordLocation, 2, gl.FLOAT, false, 0, 0);
                    gl.bindTexture(gl.TEXTURE_2D, previewProgram.texture);
    
                    // Calculate focal length from vertical field of view
                    var vfov = 2 * Math.atan(Math.tan(hfov * 0.5) / (gl.drawingBufferWidth / gl.drawingBufferHeight));
                    focal = 1 / Math.tan(vfov * 0.5);
    
                    // Pass psi, theta, roll, and focal length
                    gl.uniform1f(previewProgram.psi, yaw);
                    gl.uniform1f(previewProgram.theta, pitch);
                    gl.uniform1f(previewProgram.rot, roll);
                    gl.uniform1f(previewProgram.f, focal);
    
                    // Draw using current buffer
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
                    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertBuf);
                    gl.vertexAttribPointer(program.vertPosLocation, 3, gl.FLOAT, false, 0, 0);
                    gl.useProgram(program);
                }
    
                // Create perspective matrix
                var perspMatrix = makePersp(hfov, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100.0);
                var perspMatrixNoClip = makePersp(hfov, gl.drawingBufferWidth / gl.drawingBufferHeight, -100.0, 100.0);
                
                // Create rotation matrix
                var matrix = identityMatrix3();
                matrix = rotateMatrix(matrix, -roll, 'z');
                matrix = rotateMatrix(matrix, -pitch, 'x');
                matrix = rotateMatrix(matrix, yaw, 'y');
                matrix = makeMatrix4(matrix);
                
                // Set matrix uniforms
                gl.uniformMatrix4fv(program.perspUniform, false, transposeMatrix4(perspMatrix));
                gl.uniformMatrix4fv(program.cubeUniform, false, transposeMatrix4(matrix));
                
                // Find current nodes
                var rotPersp = rotatePersp(perspMatrix, matrix);
                var rotPerspNoClip = rotatePersp(perspMatrixNoClip, matrix);
                program.nodeCache.sort(multiresNodeSort);
                if (program.nodeCache.length > 200 &&
                    program.nodeCache.length > program.currentNodes.length + 50) {
                    // Remove older nodes from cache
                    var removed = program.nodeCache.splice(200, program.nodeCache.length - 200);
                    for (var j = 0; j < removed.length; j++) {
                        // Explicitly delete textures
                        gl.deleteTexture(removed[j].texture);
                    }
                }
                program.currentNodes = [];
                
                for (s = 0; s < 6; s++) {
                    var ntmp = new MultiresNode(vtmps[s], sides[s], 1, 0, 0, image.fullpath, null);
                    testMultiresNode(rotPersp, rotPerspNoClip, ntmp, pitch, yaw, hfov);
                }
                
                program.currentNodes.sort(multiresNodeRenderSort);
                
                // Unqueue any pending requests for nodes that are no longer visible
                for (i = pendingTextureRequests.length - 1; i >= 0; i--) {
                    if (program.currentNodes.indexOf(pendingTextureRequests[i].node) === -1) {
                        pendingTextureRequests[i].node.textureLoad = false;
                        pendingTextureRequests.splice(i, 1);
                    }
                }
                
                // Allow one request to be pending, so that we can create a texture buffer for that in advance of loading actually beginning
                if (pendingTextureRequests.length === 0) {
                    for (i = 0; i < program.currentNodes.length; i++) {
                        var node = program.currentNodes[i];
                        if (!node.texture && !node.textureLoad) {
                            node.textureLoad = true;
                
                            setTimeout(processNextTile, 0, node);
                            
                            // Only process one tile per frame to improve responsiveness
                            break;
                        }
                    }
                }
                
                // Process one pending image tile
                // This is synchronized to rendering to avoid dropping frames due
                // to texture loading happening at an inopportune time.
                if (program.textureLoads.length > 0)
                    program.textureLoads.shift()(true);
    
                // Draw tiles
                multiresDraw(!isPreview);
            }
            
            if (params.returnImage !== undefined) {
                if (window.createImageBitmap && params.returnImage == 'ImageBitmap') {
                    return createImageBitmap(canvas);
                } else {
                    if (params.returnImage.toString().indexOf('image/') == 0)
                        return canvas.toDataURL(params.returnImage);
                    else
                        return canvas.toDataURL('image/png'); // Old default
                }
            }
        };
        
        /**
         * Check if images are loading.
         * @memberof Renderer
         * @instance
         * @returns {boolean} Whether or not images are loading.
         */
        this.isLoading = function() {
            if (gl && imageType == 'multires') {
                for ( var i = 0; i < program.currentNodes.length; i++ ) {
                    if (!program.currentNodes[i].textureLoaded) {
                        return true;
                    }
                }
            }
            return false;
        };
    
        /**
         * Check if base image tiles are loaded.
         * @memberof Renderer
         * @instance
         * @returns {boolean} Whether or not base image tiles are loaded.
         */
        this.isBaseLoaded = function() {
            if (program.currentNodes.length >= 6) {
                for (var i = 0; i < 6; i++) {
                    if (!program.currentNodes[i].textureLoaded) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
    
        /**
         * Retrieve renderer's canvas.
         * @memberof Renderer
         * @instance
         * @returns {HTMLElement} Renderer's canvas.
         */
        this.getCanvas = function() {
            return canvas;
        };
        
        /**
         * Sorting method for multires nodes.
         * @private
         * @param {MultiresNode} a - First node.
         * @param {MultiresNode} b - Second node.
         * @returns {number} Base tiles first, then higher timestamp first.
         */
        function multiresNodeSort(a, b) {
            // Base tiles are always first
            if (a.level == 1 && b.level != 1) {
                return -1;
            }
            if (b. level == 1 && a.level != 1) {
                return 1;
            }
            
            // Higher timestamp first
            return b.timestamp - a.timestamp;
        }
        
        /**
         * Sorting method for multires node rendering.
         * @private
         * @param {MultiresNode} a - First node.
         * @param {MultiresNode} b - Second node.
         * @returns {number} Lower zoom levels first, then closest to center first.
         */
        function multiresNodeRenderSort(a, b) {
            // Lower zoom levels first
            if (a.level != b.level) {
                return a.level - b.level;
            }
            
            // Lower distance from center first
            return a.diff - b.diff;
        }
        
        /**
         * Draws multires nodes.
         * @param {bool} clear - Whether or not to clear canvas.
         * @private
         */
        function multiresDraw(clear) {
            if (!program.drawInProgress) {
                program.drawInProgress = true;
                // Clear canvas
                if (clear)
                    gl.clear(gl.COLOR_BUFFER_BIT);
                // Determine tiles that need to be drawn
                var node_paths = {};
                for (var i = 0; i < program.currentNodes.length; i++) {
                    if (node_paths[program.currentNodes[i].parentPath] === undefined)
                        node_paths[program.currentNodes[i].parentPath] = 0
                    node_paths[program.currentNodes[i].parentPath] += !(program.currentNodes[i].textureLoaded > 1); // !(undefined > 1) != (undefined <= 1)
                }
                // Draw tiles
                for (var i = 0; i < program.currentNodes.length; i++) {
                    // This optimization that doesn't draw a node if all its children
                    // will be drawn ignores the fact that some nodes don't have
                    // four children; these tiles are always drawn.
                    if (program.currentNodes[i].textureLoaded > 1 &&
                        node_paths[program.currentNodes[i].path] != 4) {
                        //var color = program.currentNodes[i].color;
                        //gl.uniform4f(program.colorUniform, color[0], color[1], color[2], 1.0);
                        
                        // Pass vertices to WebGL
                        gl.bufferData(gl.ARRAY_BUFFER, program.currentNodes[i].vertices, gl.STATIC_DRAW);
    
                        // Bind texture and draw tile
                        gl.bindTexture(gl.TEXTURE_2D, program.currentNodes[i].texture); // Bind program.currentNodes[i].texture to TEXTURE0
                        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
                    }
                }
                program.drawInProgress = false;
            }
        }
    
        /**
         * Creates new multires node.
         * @constructor
         * @private
         * @param {Float32Array} vertices - Node's vertices.
         * @param {string} side - Node's cube face.
         * @param {number} level - Node's zoom level.
         * @param {number} x - Node's x position.
         * @param {number} y - Node's y position.
         * @param {string} path - Node's path.
         * @param {string} parentPath - Node parent's path.
         */
        function MultiresNode(vertices, side, level, x, y, path, parentPath) {
            this.vertices = vertices;
            this.side = side;
            this.level = level;
            this.x = x;
            this.y = y;
            // Use tile key if paths need to be looked up in a dictionary, which needs a `tileKey` entry
            var p = typeof path === 'object' ? path.tileKey : path;
            p = p.replace('%s',side).replace('%l0',level-1).replace('%l',level).replace('%x',x).replace('%y',y);
            this.path = typeof path === 'object' ? path[p] : p;
            this.parentPath = parentPath;
        }
    
        /**
         * Test if multires node is visible. If it is, add it to current nodes,
         * load its texture, and load appropriate child nodes.
         * @private
         * @param {number[]} rotPersp - Rotated perspective matrix.
         * @param {number[]} rotPersp - Rotated perspective matrix without clipping behind camera.
         * @param {MultiresNode} node - Multires node to check.
         * @param {number} pitch - Pitch to check at.
         * @param {number} yaw - Yaw to check at.
         * @param {number} hfov - Horizontal field of view to check at.
         */
        function testMultiresNode(rotPersp, rotPerspNoClip, node, pitch, yaw, hfov) {
            if (checkSquareInView(rotPersp, node.vertices)) {
                // In order to determine if this tile resolution needs to be loaded
                // for this node, start by calculating positions of node corners
                // and checking if they're in view
                var cornersWinX = [],
                    cornersWinY = [],
                    minCornersWinZ = 2,
                    cornersInView = [],
                    numCornersInView = 0;
                for (var i = 0; i < 4; i++) {
                    var corner = applyRotPerspToVec(rotPerspNoClip, node.vertices.slice(i * 3, (i + 1) * 3));
                    cornersWinX.push(corner[0] * corner[3]);
                    cornersWinY.push(corner[1] * corner[3]);
                    var cornerWinZ = corner[2] * corner[3];
                    minCornersWinZ = Math.min(minCornersWinZ, cornerWinZ);
                    cornersInView.push(Math.abs(cornersWinX[i]) <= 1 && Math.abs(cornersWinY[i]) <= 1 && cornerWinZ > 0);
                    numCornersInView += cornersInView[i];
                }
    
                var cubeSize = image.cubeResolution * Math.pow(2, node.level - image.maxLevel);
                var numTiles = Math.ceil(cubeSize * image.invTileResolution) - 1;
                var doubleTileSize = cubeSize % image.tileResolution * 2;
                var lastTileSize = (cubeSize * 2) % image.tileResolution;
                if (lastTileSize === 0) {
                    lastTileSize = image.tileResolution;
                }
                if (doubleTileSize === 0) {
                    doubleTileSize = image.tileResolution * 2;
                }
    
                // Tiles should always be loaded if they're base tiles, in the
                // extremely-wide FOV edge case when a node corner is behind the
                // camera, and when no node corners are in the viewport. In other
                // cases, additional checks are required.
                if (node.level > 1 && minCornersWinZ > 0 && numCornersInView > 0) {
                    // Calculate length of node sides that are at least partly in view
                    var maxSide = 0;
                    for (var i = 0; i < 4; i++) {
                        var j = (i + 1) % 4;
                        if (cornersInView[i] || cornersInView[j]) {
                            var diffX = (cornersWinX[j] - cornersWinX[i]) * gl.drawingBufferWidth / 2,
                                diffY = (cornersWinY[j] - cornersWinY[i]) * gl.drawingBufferHeight / 2;
                            // Handle edge tiles
                            if (lastTileSize < image.tileResolution) {
                                if (node.x == numTiles)
                                    diffX *= image.tileResolution / lastTileSize;
                                else if (node.y == numTiles)
                                    diffY *= image.tileResolution / lastTileSize;
                            }
                            // Handle small tiles that have fewer than four children
                            if (doubleTileSize <= image.tileResolution) {
                                if (node.x == numTiles)
                                    diffX *= 2;
                                if (node.y == numTiles)
                                    diffY *= 2;
                            }
                            maxSide = Math.max(maxSide, Math.sqrt(diffX * diffX + diffY * diffY));
                        }
                    }
                    // Don't load tile if the largest node side is smaller than
                    // half the tile resolution, since the parent node is smaller
                    // than the parent tile in this case
                    if (maxSide <= image.tileResolution / 2)
                        return;
                }
    
                // Calculate central angle between center of view and center of tile
                var v = node.vertices;
                var x = v[0] + v[3] + v[6] + v[ 9];
                var y = v[1] + v[4] + v[7] + v[10];
                var z = v[2] + v[5] + v[8] + v[11];
                var r = Math.sqrt(x*x + y*y + z*z);
                var theta = Math.asin(z / r);
                var phi = Math.atan2(y, x);
                var ydiff = phi - yaw;
                ydiff += (ydiff > Math.PI) ? -2 * Math.PI : (ydiff < -Math.PI) ? 2 * Math.PI : 0;
                ydiff = Math.abs(ydiff);
                node.diff = Math.acos(Math.sin(pitch) * Math.sin(theta) + Math.cos(pitch) * Math.cos(theta) * Math.cos(ydiff));
                
                // Add node to current nodes and load texture if needed
                var inCurrent = false;
                for (var k = 0; k < program.nodeCache.length; k++) {
                    if (program.nodeCache[k].path == node.path) {
                        inCurrent = true;
                        program.nodeCache[k].timestamp = program.nodeCacheTimestamp++;
                        program.nodeCache[k].diff = node.diff;
                        program.currentNodes.push(program.nodeCache[k]);
                        break;
                    }
                }
                if (!inCurrent) {
                    //node.color = [Math.random(), Math.random(), Math.random()];
                    node.timestamp = program.nodeCacheTimestamp++;
                    program.currentNodes.push(node);
                    program.nodeCache.push(node);
                }
    
                // Create child nodes
                if (node.level < image.maxLevel) {
                    var f = 0.5;
                    if (node.x == numTiles || node.y == numTiles) {
                        f = 1.0 - image.tileResolution / (image.tileResolution + lastTileSize);
                    }
                    var i = 1.0 - f;
                    var children = [];
                    var vtmp, ntmp;
                    var f1 = f, f2 = f, f3 = f, i1 = i, i2 = i, i3 = i;
                    // Handle non-symmetric tiles
                    if (lastTileSize < image.tileResolution) {
                        if (node.x == numTiles && node.y != numTiles) {
                            f2 = 0.5;
                            i2 = 0.5;
                            if (node.side == 'd' || node.side == 'u') {
                                f3 = 0.5;
                                i3 = 0.5;
                            }
                        } else if (node.x != numTiles && node.y == numTiles) {
                            f1 = 0.5;
                            i1 = 0.5;
                            if (node.side == 'l' || node.side == 'r') {
                                f3 = 0.5;
                                i3 = 0.5;
                            }
                        }
                    }
                    // Handle small tiles that have fewer than four children
                    if (doubleTileSize <= image.tileResolution) {
                        if (node.x == numTiles) {
                            f1 = 0;
                            i1 = 1;
                            if (node.side == 'l' || node.side == 'r') {
                                f3 = 0;
                                i3 = 1;
                            }
                        }
                        if (node.y == numTiles) {
                            f2 = 0;
                            i2 = 1;
                            if (node.side == 'd' || node.side == 'u') {
                                f3 = 0;
                                i3 = 1;
                            }
                        }
                    }
                    
                    vtmp = new Float32Array([
                                       v[0],             v[1],             v[2],
                            v[0]*f1+v[3]*i1,    v[1]*f+v[4]*i,  v[2]*f3+v[5]*i3,
                            v[0]*f1+v[6]*i1,  v[1]*f2+v[7]*i2,  v[2]*f3+v[8]*i3,
                              v[0]*f+v[9]*i, v[1]*f2+v[10]*i2, v[2]*f3+v[11]*i3
                    ]);
                    ntmp = new MultiresNode(vtmp, node.side, node.level + 1, node.x * 2, node.y * 2, image.fullpath, node.path);
                    children.push(ntmp);
                    if (!(node.x == numTiles && doubleTileSize <= image.tileResolution)) {
                        vtmp = new Float32Array([
                                v[0]*f1+v[3]*i1,    v[1]*f+v[4]*i,  v[2]*f3+v[5]*i3,
                                           v[3],             v[4],             v[5],
                                  v[3]*f+v[6]*i,  v[4]*f2+v[7]*i2,  v[5]*f3+v[8]*i3,
                                v[0]*f1+v[6]*i1,  v[1]*f2+v[7]*i2,  v[2]*f3+v[8]*i3
                        ]);
                        ntmp = new MultiresNode(vtmp, node.side, node.level + 1, node.x * 2 + 1, node.y * 2, image.fullpath, node.path);
                        children.push(ntmp);
                    }
                    if (!(node.x == numTiles && doubleTileSize <= image.tileResolution) &&
                        !(node.y == numTiles && doubleTileSize <= image.tileResolution)) {
                        vtmp = new Float32Array([
                                v[0]*f1+v[6]*i1,  v[1]*f2+v[7]*i2,  v[2]*f3+v[8]*i3,
                                  v[3]*f+v[6]*i,  v[4]*f2+v[7]*i2,  v[5]*f3+v[8]*i3,
                                           v[6],             v[7],             v[8],
                                v[9]*f1+v[6]*i1,   v[10]*f+v[7]*i, v[11]*f3+v[8]*i3
                        ]);
                        ntmp = new MultiresNode(vtmp, node.side, node.level + 1, node.x * 2 + 1, node.y * 2 + 1, image.fullpath, node.path);
                        children.push(ntmp);
                    }
                    if (!(node.y == numTiles && doubleTileSize <= image.tileResolution)) {
                        vtmp = new Float32Array([
                                  v[0]*f+v[9]*i, v[1]*f2+v[10]*i2, v[2]*f3+v[11]*i3,
                                v[0]*f1+v[6]*i1,  v[1]*f2+v[7]*i2,  v[2]*f3+v[8]*i3,
                                v[9]*f1+v[6]*i1,   v[10]*f+v[7]*i, v[11]*f3+v[8]*i3,
                                           v[9],            v[10],            v[11]
                        ]);
                        ntmp = new MultiresNode(vtmp, node.side, node.level + 1, node.x * 2, node.y * 2 + 1, image.fullpath, node.path);
                        children.push(ntmp);
                    }
                    for (var j = 0; j < children.length; j++) {
                        testMultiresNode(rotPersp, rotPerspNoClip, children[j], pitch, yaw, hfov);
                    }
                }
            }
        }
        
        /**
         * Creates cube vertex array.
         * @private
         * @returns {Float32Array} Cube vertex array.
         */
        function createCube() {
            return new Float32Array([
                    -1,  1, -1,  1,  1, -1,  1, -1, -1, -1, -1, -1, // Front face
                     1,  1,  1, -1,  1,  1, -1, -1,  1,  1, -1,  1, // Back face
                    -1,  1,  1,  1,  1,  1,  1,  1, -1, -1,  1, -1, // Up face
                    -1, -1, -1,  1, -1, -1,  1, -1,  1, -1, -1,  1, // Down face
                    -1,  1,  1, -1,  1, -1, -1, -1, -1, -1, -1,  1, // Left face
                     1,  1, -1,  1,  1,  1,  1, -1,  1,  1, -1, -1  // Right face
            ]);
        }
        
        /**
         * Creates 3x3 identity matrix.
         * @private
         * @returns {Float32Array} Identity matrix.
         */
        function identityMatrix3() {
            return new Float32Array([
                1, 0, 0,
                0, 1, 0,
                0, 0, 1
            ]);
        }
        
        /**
         * Rotates a 3x3 matrix.
         * @private
         * @param {number[]} m - Matrix to rotate.
         * @param {number[]} angle - Angle to rotate by in radians.
         * @param {string} axis - Axis to rotate about (`x`, `y`, or `z`).
         * @returns {Float32Array} Rotated matrix.
         */
        function rotateMatrix(m, angle, axis) {
            var s = Math.sin(angle);
            var c = Math.cos(angle);
            if (axis == 'x') {
                return new Float32Array([
                    m[0], c*m[1] + s*m[2], c*m[2] - s*m[1],
                    m[3], c*m[4] + s*m[5], c*m[5] - s*m[4],
                    m[6], c*m[7] + s*m[8], c*m[8] - s*m[7]
                ]);
            }
            if (axis == 'y') {
                return new Float32Array([
                    c*m[0] - s*m[2], m[1], c*m[2] + s*m[0],
                    c*m[3] - s*m[5], m[4], c*m[5] + s*m[3],
                    c*m[6] - s*m[8], m[7], c*m[8] + s*m[6]
                ]);
            }
            if (axis == 'z') {
                return new Float32Array([
                    c*m[0] + s*m[1], c*m[1] - s*m[0], m[2],
                    c*m[3] + s*m[4], c*m[4] - s*m[3], m[5],
                    c*m[6] + s*m[7], c*m[7] - s*m[6], m[8]
                ]);
            }
        }
        
        /**
         * Turns a 3x3 matrix into a 4x4 matrix.
         * @private
         * @param {number[]} m - Input matrix.
         * @returns {Float32Array} Expanded matrix.
         */
        function makeMatrix4(m) {
            return new Float32Array([
                m[0], m[1], m[2],    0,
                m[3], m[4], m[5],    0,
                m[6], m[7], m[8],    0,
                   0,    0,    0,    1
            ]);
        }
        
        /**
         * Transposes a 4x4 matrix.
         * @private
         * @param {number[]} m - Input matrix.
         * @returns {Float32Array} Transposed matrix.
         */
        function transposeMatrix4(m) {
            return new Float32Array([
                m[ 0], m[ 4], m[ 8], m[12],
                m[ 1], m[ 5], m[ 9], m[13],
                m[ 2], m[ 6], m[10], m[14],
                m[ 3], m[ 7], m[11], m[15]
            ]);
        }
        
        /**
         * Creates a perspective matrix.
         * @private
         * @param {number} hfov - Desired horizontal field of view.
         * @param {number} aspect - Desired aspect ratio.
         * @param {number} znear - Near distance.
         * @param {number} zfar - Far distance.
         * @returns {Float32Array} Generated perspective matrix.
         */
        function makePersp(hfov, aspect, znear, zfar) {
            var fovy = 2 * Math.atan(Math.tan(hfov/2) * gl.drawingBufferHeight / gl.drawingBufferWidth);
            var f = 1 / Math.tan(fovy/2);
            return new Float32Array([
                f/aspect,   0,  0,  0,
                       0,   f,  0,  0,
                       0,   0,  (zfar+znear)/(znear-zfar), (2*zfar*znear)/(znear-zfar),
                       0,   0, -1,  0
            ]);
        }
        
        /**
         * Processes a loaded texture image into a WebGL texture.
         * @private
         * @param {Image} img - Input image.
         * @param {WebGLTexture} tex - Texture to bind image to.
         */
        function processLoadedTexture(img, tex) {
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
        
        var pendingTextureRequests = [];
    
        // Based on http://blog.tojicode.com/2012/03/javascript-memory-optimization-and.html
        var loadTexture = (function() {
            var cacheTop = 4;   // Maximum number of concurrent loads
            var textureImageCache = {};
            var crossOrigin;
            function TextureImageLoader() {
                var self = this;
                this.texture = this.callback = null;
                this.image = new Image();
                this.image.crossOrigin = crossOrigin ? crossOrigin : 'anonymous';
                var loadFn = function() {
                    program.textureLoads.push(function(execute) {
                        if (execute) {
                            if (self.image.width > 0 && self.image.height > 0) { // Ignore missing tile to support partial image
                                processLoadedTexture(self.image, self.texture);
                                self.callback(self.texture, true);
                            } else {
                                self.callback(self.texture, false);
                            }
                        }
                        releaseTextureImageLoader(self);
                    });
                };
                this.image.addEventListener('load', loadFn);
                this.image.addEventListener('error', loadFn); // Ignore missing tile file to support partial image; otherwise retry loop causes high CPU load
            }
    
            TextureImageLoader.prototype.loadTexture = function(src, texture, callback) {
                this.texture = texture;
                this.callback = callback;
                this.image.src = src;
            };
    
            function PendingTextureRequest(node, src, texture, callback) {
                this.node = node;
                this.src = src;
                this.texture = texture;
                this.callback = callback;
            }
    
            function releaseTextureImageLoader(til) {
                if (pendingTextureRequests.length) {
                    var req = pendingTextureRequests.shift();
                    til.loadTexture(req.src, req.texture, req.callback);
                } else
                    textureImageCache[cacheTop++] = til;
            }
    
            for (var i = 0; i < cacheTop; i++)
                textureImageCache[i] = new TextureImageLoader();
    
            return function(node, src, callback, _crossOrigin) {
                crossOrigin = _crossOrigin;
                var texture = gl.createTexture();
                if (cacheTop)
                    textureImageCache[--cacheTop].loadTexture(src, texture, callback);
                else
                    pendingTextureRequests.push(new PendingTextureRequest(node, src, texture, callback));
                return texture;
            };
        })();
    
        /**
         * Loads image and creates texture for a multires node / tile.
         * @private
         * @param {MultiresNode} node - Input node.
         */
        function processNextTileFallback(node) {
            loadTexture(node, node.path + (image.extension ? '.' + image.extension : ''), function(texture, loaded) {
                node.texture = texture;
                node.textureLoaded = loaded ? 2 : 1;
            }, globalParams.crossOrigin);
        }
    
        // Load images in separate thread when possible
        var processNextTile;
        if (window.Worker && window.createImageBitmap) {
            function workerFunc() {
                self.onmessage = function(e) {
                    var path = e.data[0],
                        crossOrigin = e.data[1];
                    fetch(path, {
                        mode: 'cors',
                        credentials: crossOrigin == 'use-credentials' ? 'include' : 'same-origin'
                    }).then(function(response) {
                        return response.blob();
                    }).then(function(blob) {
                        return createImageBitmap(blob);
                    }).then(function(bitmap) {
                        postMessage([path, true, bitmap], [bitmap]);
                    }).catch(function() {
                        postMessage([path, false]);
                    });
                };
            }
            var workerFuncBlob = new Blob(['(' + workerFunc.toString() + ')()'], {type: 'application/javascript'}),
                worker = new Worker(URL.createObjectURL(workerFuncBlob)),
                texturesLoading = {};
            worker.onmessage = function(e) {
                var path = e.data[0],
                    success = e.data[1],
                    bitmap = e.data[2];
                program.textureLoads.push(function(execute) {
                    var texture,
                        loaded = false;
                    if (success && execute) { // Ignore missing tile to support partial image
                        texture = gl.createTexture();
                        processLoadedTexture(bitmap, texture);
                        loaded = true;
                    }
                    var node = texturesLoading[path];
                    delete texturesLoading[path];
                    if (node !== undefined) {
                        node.texture = texture;
                        node.textureLoaded = loaded ? 2 : 1;
                    }
                });
            };
            processNextTile = function(node) {
                // Since web worker is created from a Blob, we need the absolute URL
                var path = new URL(node.path + (image.extension ? '.' + image.extension : ''), window.location).href;
                texturesLoading[path] = node;
                worker.postMessage([path, globalParams.crossOrigin]);
            };
        } else {
            processNextTile = processNextTileFallback;
        }
        
        /**
         * Rotates perspective matrix.
         * @private
         * @param {number[]} p - Perspective matrix.
         * @param {number[]} r - Rotation matrix.
         * @returns {Float32Array} Rotated matrix.
         */
        function rotatePersp(p, r) {
            return new Float32Array([
                p[ 0]*r[0], p[ 0]*r[1], p[ 0]*r[ 2],     0,
                p[ 5]*r[4], p[ 5]*r[5], p[ 5]*r[ 6],     0,
                p[10]*r[8], p[10]*r[9], p[10]*r[10], p[11],
                     -r[8],      -r[9],      -r[10],     0
            ]);
        }
        
        /**
         * Applies rotated perspective matrix to a 3-vector
         * (last element is inverted).
         * @private
         * @param {number[]} m - Rotated perspective matrix.
         * @param {number[]} v - Input 3-vector.
         * @returns {Float32Array} Resulting 4-vector.
         */
        function applyRotPerspToVec(m, v) {
            return new Float32Array([
                        m[ 0]*v[0] + m[ 1]*v[1] + m[ 2]*v[2],
                        m[ 4]*v[0] + m[ 5]*v[1] + m[ 6]*v[2],
                m[11] + m[ 8]*v[0] + m[ 9]*v[1] + m[10]*v[2],
                     1/(m[12]*v[0] + m[13]*v[1] + m[14]*v[2])
            ]);
        }
        
        /**
         * Checks if a vertex is visible.
         * @private
         * @param {number[]} m - Rotated perspective matrix.
         * @param {number[]} v - Input vertex.
         * @returns {number} 1 or -1 if the vertex is or is not visible,
         *      respectively.
         */
        function checkInView(m, v) {
            var vpp = applyRotPerspToVec(m, v);
            var winX = vpp[0]*vpp[3];
            var winY = vpp[1]*vpp[3];
            var winZ = vpp[2]*vpp[3];
            var ret = [0, 0, 0];
            
            if ( winX < -1 )
                ret[0] = -1;
            if ( winX > 1 )
                ret[0] = 1;
            if ( winY < -1 )
                ret[1] = -1;
            if ( winY > 1 )
                ret[1] = 1;
            if ( winZ < -1 || winZ > 1 )
                ret[2] = 1;
            return ret;
        }
        
        /**
         * Checks if a square (tile) is visible.
         * @private
         * @param {number[]} m - Rotated perspective matrix.
         * @param {number[]} v - Square's vertex array.
         * @returns {boolean} Whether or not the square is visible.
         */
        function checkSquareInView(m, v) {
            var check1 = checkInView(m, v.slice(0, 3));
            var check2 = checkInView(m, v.slice(3, 6));
            var check3 = checkInView(m, v.slice(6, 9));
            var check4 = checkInView(m, v.slice(9, 12));
            var testX = check1[0] + check2[0] + check3[0] + check4[0];
            if ( testX == -4 || testX == 4 )
                return false;
            var testY = check1[1] + check2[1] + check3[1] + check4[1];
            if ( testY == -4 || testY == 4 )
                return false;
            var testZ = check1[2] + check2[2] + check3[2] + check4[2];
            return testZ != 4;
        }
    
        /**
         * On iOS (iPhone 5c, iOS 10.3), this WebGL error occurs when the canvas is
         * too big. Unfortunately, there's no way to test for this beforehand, so we
         * reduce the canvas size if this error is thrown.
         * @private
         */
        function handleWebGLError1286() {
            console.log('Reducing canvas size due to error 1286!');
            canvas.width = Math.round(canvas.width / 2);
            canvas.height = Math.round(canvas.height / 2);
        }
    
        // Data for rendering SHT hashes
        var shtB83chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~',
            shtYlmStr = 'Bf[ff4fff|ffff0fffffBo@Ri5xag{Jmdf2+WiefCs@Ll7+Vi]Btag6' +
            '[NmdgCv=Ho9;Qk;7zWiF_GsahDy:ErE?Mn$5+SkS_AyWiD#-CuJ[Iqp6;Nnx?7*SlE$' +
            '*BxR@FtPA?Jq+%7:NnF*zAzn?CwIG@Ft-Y9?IrG+vA%w:AzGR?Cx*IF@EuI,nA+$*9%' +
            'Gu:A#xCR?ByJ-VB-*wA+J**9*ZBv:9%L.QD.*aB.O.v9-MF+$8,O:MG:*OD;a:UB:IO' +
            ':n9:Q:KJ;#IG=u-KE=Hs:MC?T:IO=wEL?#%FJ@K**FI@Y;HV=pDU?*sCS@S.uCR[m;H' +
            'p=VDq?*SCs@s.QCt[r:Iw=OEz?#IF$@#*HF%@u:K$;KI+=uEK-=*sCM:?w:M+:HO.;a' +
            'CU;:%OCn?:z.Q..Ha;.ODv?-yFG$@,$-V;-Hw=+JH*?*lBP:?%%,n=+J*?%GQ:=#NCt' +
            '?;y++v=%O:=zGt?:xHI,@-u,*z=zX?:wI+@,tEY??%r-$*;xt@,tP=?$qG%[:xn.#-:' +
            'u$[%qp];xnN?[*sl.y:-r-?yn$^+sks_=yoi:v=*o?;uk;[zoi,_+skh:s@zl[+pi];' +
            'tkg][xmhg;o@ti^xkg{$mhf|+oigf;f[ff_fff|ffff~fffff',
            shtMaxYlm = 3.317,
            shtYlm = [];
    
        /**
         * Decodes an integer-encoded float.
         * @private
         * @param {number} i - Integer-encoded float.
         * @param {number} maxVal - Maximum value of decoded float.
         * @returns {number} Decoded float.
         */
        function shtDecodeFloat(i, maxVal) {
            return Math.pow(((Math.abs(i) - maxVal) / maxVal), 2) * (i - maxVal > 0 ? 1 : -1);
        }
    
        /**
         * Decodes encoded spherical harmonic transform coefficients.
         * @private
         * @param {number} val - Encoded coefficient.
         * @param {number} maxVal - Maximum value of coefficients.
         * @returns {number[]} Decoded coefficients; one per color channel [r, g, b].
         */
        function shtDecodeCoeff(val, maxVal) {
            var quantR = Math.floor(val / (19 * 19)),
                quantG = Math.floor(val / 19) % 19,
                quantB = val % 19;
            var r = shtDecodeFloat(quantR, 9) * maxVal,
                g = shtDecodeFloat(quantG, 9) * maxVal,
                b = shtDecodeFloat(quantB, 9) * maxVal;
            return [r, g, b];
        }
    
        /**
         * Decodes base83-encoded string to integers.
         * @private
         * @param {string} b83str - Encoded string.
         * @param {number} length - Number of characters per integer.
         * @returns {number[]} Decoded integers.
         */
        function shtB83decode(b83str, length) {
            var cnt = Math.floor(b83str.length / length),
                vals = [];
            for (var i = 0; i < cnt; i++) {
                var val = 0;
                for (var j = 0; j < length; j++) {
                    val = val * 83 + shtB83chars.indexOf(b83str[i * length + j]);
                }
                vals.push(val);
            }
            return vals;
        }
    
        /**
         * Renders pixel from spherical harmonic transform coefficients.
         * @private
         * @param {number[]} flm - Real spherical harmonic transform coefficients.
         * @param {number[]} Ylm - 4pi-normalized spherical harmonics evaluated for ell, m, and lat.
         * @param {number} lon - Longitude (radians).
         * @returns {number} Pixel value.
         */
        function shtFlm2pixel(flm, Ylm, lon) {
            var lmax = Math.floor(Math.sqrt(flm.length)) - 1
    
            // Precalculate sine and cosine coefficients
            var cosm = Array(lmax + 1),
                sinm = Array(lmax + 1);
            sinm[0] = 0;
            cosm[0] = 1;
            sinm[1] = Math.sin(lon);
            cosm[1] = Math.cos(lon);
            for (var m = 2; m <= lmax; m++) {
                sinm[m] = 2 * sinm[m - 1] * cosm[1] - sinm[m - 2];
                cosm[m] = 2 * cosm[m - 1] * cosm[1] - cosm[m - 2];
            }
    
            // Calculate value at pixel
            var expand = 0,
                cosidx = 0;
            for (var i = 1; i <= lmax + 1; i++)
                cosidx += i;
            for (var l = lmax; l >= 0; l--) {
                var idx = Math.floor((l + 1) * l / 2);
                // First coefficient is 1 when using 4pi normalization
                expand += idx != 0 ? flm[idx] * Ylm[idx - 1] : flm[idx];
                for (var m = 1; m <= l; m++)
                    expand += (flm[++idx] * cosm[m] + flm[idx + cosidx - l - 1] * sinm[m]) * Ylm[idx - 1];
            }
    
            return Math.round(expand);
        }
    
        /**
         * Renders image from spherical harmonic transform (SHT) hash.
         * @private
         * @param {string} shtHash - SHT hash.
         * @returns {ImageData} Rendered image.
         */
        function shtDecodeImage(shtHash) {
            if (shtYlm.length < 1) {
                // Decode Ylm if they're not already decoded
                var ylmLen = shtYlmStr.length / 32;
                for (var i = 0; i < 32; i++) {
                    shtYlm.push([]);
                    for (var j = 0; j < ylmLen; j++)
                        shtYlm[i].push(shtDecodeFloat(shtB83decode(shtYlmStr[i * ylmLen + j], 1), 41) * shtMaxYlm);
                }
            }
    
            // Decode SHT hash
            var lmax = shtB83decode(shtHash[0], 1)[0],
                maxVal = (shtDecodeFloat(shtB83decode(shtHash[1], 1), 41) + 1) * 255 / 2,
                vals = shtB83decode(shtHash.slice(2), 2),
                rVals = [],
                gVals = [],
                bVals = [];
            for (var i = 0; i < vals.length; i++) {
                var v = shtDecodeCoeff(vals[i], maxVal);
                rVals.push(v[0]);
                gVals.push(v[1]);
                bVals.push(v[2]);
            }
    
            // Render image
            var lonStep = 0.03125 * Math.PI;
            var img = [];
            for (var i = 31; i >= 0; i--) {
                for (var j = 0; j < 64; j++) {
                    img.push(shtFlm2pixel(rVals, shtYlm[i], (j + 0.5) * lonStep));
                    img.push(shtFlm2pixel(gVals, shtYlm[i], (j + 0.5) * lonStep));
                    img.push(shtFlm2pixel(bVals, shtYlm[i], (j + 0.5) * lonStep));
                    img.push(255);
                }
            }
            return new ImageData(new Uint8ClampedArray(img), 64, 32);
        }
    }
    
    // Vertex shader for equirectangular and cube
    var v = [
    'attribute vec2 a_texCoord;',
    'varying vec2 v_texCoord;',
    
    'void main() {',
        // Set position
        'gl_Position = vec4(a_texCoord, 0.0, 1.0);',
        
        // Pass the coordinates to the fragment shader
        'v_texCoord = a_texCoord;',
    '}'
    ].join('');
    
    // Vertex shader for multires
    var vMulti = [
    'attribute vec3 a_vertCoord;',
    'attribute vec2 a_texCoord;',
    
    'uniform mat4 u_cubeMatrix;',
    'uniform mat4 u_perspMatrix;',
    
    'varying mediump vec2 v_texCoord;',
    
    'void main(void) {',
        // Set position
        'gl_Position = u_perspMatrix * u_cubeMatrix * vec4(a_vertCoord, 1.0);',
        
        // Pass the coordinates to the fragment shader
        'v_texCoord = a_texCoord;',
    '}'
    ].join('');
    
    // Fragment shader
    var fragEquiCubeBase = [
    'precision highp float;', // mediump looks bad on some mobile devices
    
    'uniform float u_aspectRatio;',
    'uniform float u_psi;',
    'uniform float u_theta;',
    'uniform float u_f;',
    'uniform float u_h;',
    'uniform float u_v;',
    'uniform float u_vo;',
    'uniform float u_rot;',
    
    'const float PI = 3.14159265358979323846264;',
    
    // Texture
    'uniform sampler2D u_image0;',
    'uniform sampler2D u_image1;',
    'uniform bool u_splitImage;',
    'uniform samplerCube u_imageCube;',
    
    // Coordinates passed in from vertex shader
    'varying vec2 v_texCoord;',
    
    // Background color (display for partial panoramas)
    'uniform vec4 u_backgroundColor;',
    
    'void main() {',
        // Map canvas/camera to sphere
        'float x = v_texCoord.x * u_aspectRatio;',
        'float y = v_texCoord.y;',
        'float sinrot = sin(u_rot);',
        'float cosrot = cos(u_rot);',
        'float rot_x = x * cosrot - y * sinrot;',
        'float rot_y = x * sinrot + y * cosrot;',
        'float sintheta = sin(u_theta);',
        'float costheta = cos(u_theta);',
        'float a = u_f * costheta - rot_y * sintheta;',
        'float root = sqrt(rot_x * rot_x + a * a);',
        'float lambda = atan(rot_x / root, a / root) + u_psi;',
        'float phi = atan((rot_y * costheta + u_f * sintheta) / root);',
    ].join('\n');
    
    // Fragment shader
    var fragCube = fragEquiCubeBase + [
        // Look up color from texture
        'float cosphi = cos(phi);',
        'gl_FragColor = textureCube(u_imageCube, vec3(cosphi*sin(lambda), sin(phi), cosphi*cos(lambda)));',
    '}'
    ].join('\n');
    
    // Fragment shader
    var fragEquirectangular = fragEquiCubeBase + [
        // Wrap image
        'lambda = mod(lambda + PI, PI * 2.0) - PI;',
    
        // Map texture to sphere
        'vec2 coord = vec2(lambda / PI, phi / (PI / 2.0));',
    
        // Look up color from texture
        // Map from [-1,1] to [0,1] and flip y-axis
        'if(coord.x < -u_h || coord.x > u_h || coord.y < -u_v + u_vo || coord.y > u_v + u_vo)',
            'gl_FragColor = u_backgroundColor;',
        'else {',
            'if(u_splitImage) {',
                // Image was split into two textures to work around texture size limits
                'if(coord.x < 0.0)',
                    'gl_FragColor = texture2D(u_image0, vec2((coord.x + u_h) / u_h, (-coord.y + u_v + u_vo) / (u_v * 2.0)));',
                'else',
                    'gl_FragColor = texture2D(u_image1, vec2((coord.x + u_h) / u_h - 1.0, (-coord.y + u_v + u_vo) / (u_v * 2.0)));',
            '} else {',
                'gl_FragColor = texture2D(u_image0, vec2((coord.x + u_h) / (u_h * 2.0), (-coord.y + u_v + u_vo) / (u_v * 2.0)));',
            '}',
        '}',
    '}'
    ].join('\n');
    
    // Fragment shader
    var fragMulti = [
    'varying mediump vec2 v_texCoord;',
    'uniform sampler2D u_sampler;',
    //'uniform mediump vec4 u_color;',
    
    'void main(void) {',
        // Look up color from texture
        'gl_FragColor = texture2D(u_sampler, v_texCoord);',
    //    'if(v_texCoord.x > 0.99 || v_texCoord.y > 0.99 || v_texCoord.x < 0.01 || v_texCoord.y < 0.01) {gl_FragColor = vec4(0.0,0.0,0.0,1.0);}', // Draw tile edges
    //    'gl_FragColor = u_color;',
    '}'
    ].join('');
    
    return {
        renderer: function(container, image, imagetype) {
            return new Renderer(container, image, imagetype);
        }
    };
    
    })(window, document);


/*
 * Pannellum - An HTML5 based Panorama Viewer
 * Copyright (c) 2011-2022 Matthew Petroff
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

window.pannellum = (function(window, document, undefined) {

    'use strict';
    
    /**
     * Creates a new panorama viewer.
     * @constructor
     * @param {HTMLElement|string} container - The container (div) element for the
     *      viewer, or its ID.
     * @param {Object} initialConfig - Initial configuration for viewer.
     */
    function Viewer(container, initialConfig) {
    
    var _this = this;
    
    // Declare variables
    var config,
        renderer,
        preview,
        draggingHotSpot,
        isUserInteracting = false,
        latestInteraction = Date.now(),
        onPointerDownPointerX = 0,
        onPointerDownPointerY = 0,
        onPointerDownPointerDist = -1,
        onPointerDownYaw = 0,
        onPointerDownPitch = 0,
        keysDown = new Array(10),
        fullscreenActive = false,
        loaded,
        error = false,
        isTimedOut = false,
        listenersAdded = false,
        panoImage,
        prevTime,
        speed = {'yaw': 0, 'pitch': 0, 'hfov': 0},
        animating = false,
        orientation = false,
        orientationYawOffset = 0,
        autoRotateStart,
        autoRotateSpeed = 0,
        origHfov,
        origPitch,
        animatedMove = {},
        externalEventListeners = {},
        specifiedPhotoSphereExcludes = [],
        update = false, // Should we update when still to render dynamic content
        updateOnce = false,
        eps = 1e-6,
        resizeObserver,
        hotspotsCreated = false,
        xhr,
        destroyed = false;
    
    var defaultConfig = {
        hfov: 100,
        minHfov: 50,
        multiResMinHfov: false,
        maxHfov: 120,
        pitch: 0,
        minPitch: undefined,
        maxPitch: undefined,
        yaw: 0,
        minYaw: -180,
        maxYaw: 180,
        roll: 0,
        haov: 360,
        vaov: 180,
        vOffset: 0,
        autoRotate: false,
        autoRotateInactivityDelay: -1,
        autoRotateStopDelay: undefined,
        type: 'equirectangular',
        northOffset: 0,
        showFullscreenCtrl: true,
        dynamic: false,
        dynamicUpdate: false,
        doubleClickZoom: true,
        keyboardZoom: true,
        mouseZoom: true,
        showZoomCtrl: true,
        autoLoad: false,
        showControls: true,
        orientationOnByDefault: false,
        hotSpotDebug: false,
        backgroundColor: [0, 0, 0],
        avoidShowingBackground: false,
        animationTimingFunction: timingFunction,
        draggable: true,
        dragConfirm: false,
        disableKeyboardCtrl: false,
        crossOrigin: 'anonymous',
        targetBlank: false,
        touchPanSpeedCoeffFactor: 1,
        capturedKeyNumbers: [16, 17, 27, 37, 38, 39, 40, 61, 65, 68, 83, 87, 107, 109, 173, 187, 189],
        friction: 0.15,
        // Custom status
        huiStatus: 'view' // 'editor', 'view'
    };
    
    // Translatable / configurable strings
    // Some strings contain '%s', which is a placeholder for inserted values
    // When setting strings in external configuration, `\n` should be used instead of `<br>` to insert line breaks
    defaultConfig.strings = {
        // Labels
        loadButtonLabel: 'Click to<br>Load<br>Panorama',
        loadingLabel: 'Loading...',
        bylineLabel: 'by %s',    // One substitution: author
    
        // Errors
        noPanoramaError: 'No panorama image was specified.',
        fileAccessError: 'The file %s could not be accessed.',  // One substitution: file URL
        malformedURLError: 'There is something wrong with the panorama URL.',
        iOS8WebGLError: "Due to iOS 8's broken WebGL implementation, only " +
                        "progressive encoded JPEGs work for your device (this " +
                        "panorama uses standard encoding).",
        genericWebGLError: 'Your browser does not have the necessary WebGL support to display this panorama.',
        textureSizeError: 'This panorama is too big for your device! It\'s ' +
                    '%spx wide, but your device only supports images up to ' +
                    '%spx wide. Try another device.' +
                    ' (If you\'re the author, try scaling down the image.)',    // Two substitutions: image width, max image width
        unknownError: 'Unknown error. Check developer console.',
        twoTouchActivate: 'Use two fingers together to pan the panorama.',
        twoTouchXActivate: 'Use two fingers together to pan the panorama horizontally.',
        twoTouchYActivate: 'Use two fingers together to pan the panorama vertically.',
        ctrlZoomActivate: 'Use %s + scroll to zoom the panorama.',  // One substitution: key name
    };
    
    // Initialize container
    container = typeof container === 'string' ? document.getElementById(container) : container;
    container.classList.add('pnlm-container');
    container.tabIndex = 0;
    
    // Create container for ui
    var uiContainer = document.createElement('div');
    uiContainer.className = 'pnlm-ui';
    container.appendChild(uiContainer);
    
    // Create container for renderer
    var renderContainer = document.createElement('div');
    renderContainer.className = 'pnlm-render-container';
    container.appendChild(renderContainer);
    var dragFix = document.createElement('div');
    dragFix.className = 'pnlm-dragfix';
    uiContainer.appendChild(dragFix);
    
    // Display about information on right click
    var aboutMsg = document.createElement('span');
    aboutMsg.className = 'pnlm-about-msg';
    var aboutMsgLink = document.createElement('a');
    aboutMsgLink.href = 'https://villatheme.com/';
    aboutMsgLink.textContent = 'Villatheme';
    aboutMsg.appendChild(aboutMsgLink);
    var aboutMsgVersion = document.createElement('span');
    // VERSION PLACEHOLDER FOR BUILD
    aboutMsg.appendChild(aboutMsgVersion);
    uiContainer.appendChild(aboutMsg);
    dragFix.addEventListener('contextmenu', aboutMessage);
    
    // Create info display
    var infoDisplay = {};
    
    // Hot spot debug indicator
    var hotSpotDebugIndicator = document.createElement('div');
    hotSpotDebugIndicator.className = 'pnlm-sprite pnlm-hot-spot-debug-indicator';
    uiContainer.appendChild(hotSpotDebugIndicator);
    
    // Panorama info
    infoDisplay.container = document.createElement('div');
    infoDisplay.container.className = 'pnlm-panorama-info';
    infoDisplay.title = document.createElement('div');
    infoDisplay.title.className = 'pnlm-title-box';
    infoDisplay.container.appendChild(infoDisplay.title);
    infoDisplay.author = document.createElement('div');
    infoDisplay.author.className = 'pnlm-author-box';
    infoDisplay.container.appendChild(infoDisplay.author);
    uiContainer.appendChild(infoDisplay.container);
    
    // Load box
    infoDisplay.load = {};
    infoDisplay.load.box = document.createElement('div');
    infoDisplay.load.box.className = 'pnlm-load-box';
    infoDisplay.load.boxp = document.createElement('p');
    infoDisplay.load.box.appendChild(infoDisplay.load.boxp);
    infoDisplay.load.lbox = document.createElement('div');
    infoDisplay.load.lbox.className = 'pnlm-lbox';
    infoDisplay.load.lbox.innerHTML = '<div class="pnlm-loading"></div>';
    infoDisplay.load.box.appendChild(infoDisplay.load.lbox);
    infoDisplay.load.lbar = document.createElement('div');
    infoDisplay.load.lbar.className = 'pnlm-lbar';
    infoDisplay.load.lbarFill = document.createElement('div');
    infoDisplay.load.lbarFill.className = 'pnlm-lbar-fill';
    infoDisplay.load.lbar.appendChild(infoDisplay.load.lbarFill);
    infoDisplay.load.box.appendChild(infoDisplay.load.lbar);
    infoDisplay.load.msg = document.createElement('p');
    infoDisplay.load.msg.className = 'pnlm-lmsg';
    infoDisplay.load.box.appendChild(infoDisplay.load.msg);
    uiContainer.appendChild(infoDisplay.load.box);
    
    // Error message
    infoDisplay.errorMsg = document.createElement('div');
    infoDisplay.errorMsg.className = 'pnlm-error-msg pnlm-info-box';
    uiContainer.appendChild(infoDisplay.errorMsg);
    
    // Interaction message
    infoDisplay.interactionMsg = document.createElement('div');
    infoDisplay.interactionMsg.className = 'pnlm-interaction-msg pnlm-info-box';
    uiContainer.appendChild(infoDisplay.interactionMsg);
    
    // Create controls
    var controls = {};
    controls.container = document.createElement('div');
    controls.container.className = 'pnlm-controls-container';
    uiContainer.appendChild(controls.container);
    
    // Load button
        /**
         * Title: Change element from 'button' to 'div' and add properties cursor, display
         * Position: function viewer
         * Date Created: 2024/02/16
         * Author: Hydro
         */

    controls.load = document.createElement('div');
    controls.load.className = 'pnlm-load-button';
    controls.load.style.cursor = 'pointer';
    controls.load.style.display = 'flex';
    controls.load.addEventListener('click', function() {
        processOptions();
        load();
    });
    uiContainer.appendChild(controls.load);
    
    // Zoom controls
    controls.zoom = document.createElement('div');
    controls.zoom.className = 'pnlm-zoom-controls pnlm-controls';
    controls.zoomIn = document.createElement('div');
    controls.zoomIn.className = 'pnlm-zoom-in pnlm-sprite pnlm-control';
    controls.zoomIn.addEventListener('click', zoomIn);
    controls.zoom.appendChild(controls.zoomIn);
    controls.zoomOut = document.createElement('div');
    controls.zoomOut.className = 'pnlm-zoom-out pnlm-sprite pnlm-control';
    controls.zoomOut.addEventListener('click', zoomOut);
    controls.zoom.appendChild(controls.zoomOut);
    controls.container.appendChild(controls.zoom);
    
    // Fullscreen toggle
    controls.fullscreen = document.createElement('div');
    controls.fullscreen.addEventListener('click', toggleFullscreen);
    controls.fullscreen.className = 'pnlm-fullscreen-toggle-button pnlm-sprite pnlm-fullscreen-toggle-button-inactive pnlm-controls pnlm-control';
    if (document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled)
        controls.container.appendChild(controls.fullscreen);
    
    // Device orientation toggle
    controls.orientation = document.createElement('div');
    controls.orientation.addEventListener('click', function(e) {
        if (orientation)
            stopOrientation();
        else
            startOrientation();
    });
    controls.orientation.addEventListener('mousedown', function(e) {e.stopPropagation();});
    controls.orientation.addEventListener('touchstart', function(e) {e.stopPropagation();});
    controls.orientation.addEventListener('pointerdown', function(e) {e.stopPropagation();});
    controls.orientation.className = 'pnlm-orientation-button pnlm-orientation-button-inactive pnlm-sprite pnlm-controls pnlm-control';
    var orientationSupport = false;
    if (window.DeviceOrientationEvent && location.protocol == 'https:' &&
        (navigator.userAgent.toLowerCase().indexOf('mobi') >= 0 ||
        (/* iPad */ navigator.userAgent.indexOf("Mac") >= 0 && navigator.maxTouchPoints && navigator.maxTouchPoints > 0))) {
        // This user agent check is here because there's no way to check if a
        // device has an inertia measurement unit. We used to be able to check if a
        // DeviceOrientationEvent had non-null values, but with iOS 13 requiring a
        // permission prompt to access such events, this is no longer possible.
        controls.container.appendChild(controls.orientation);
        orientationSupport = true;
    }
    
    // Compass
    var compass = document.createElement('div');
    compass.className = 'pnlm-compass pnlm-controls pnlm-control';
    uiContainer.appendChild(compass);
    
    // Load and process configuration
    if (initialConfig.firstScene) {
        // Activate first scene if specified in URL
        mergeConfig(initialConfig.firstScene);
    } else if (initialConfig.default && initialConfig.default.firstScene) {
        // Activate first scene if specified in file
        mergeConfig(initialConfig.default.firstScene);
    } else {
        mergeConfig(null);
    }
    processOptions(true);
    
    /**
     * Initializes viewer.
     * @private
     */
    function init() {
        // Display an error for IE 9 as it doesn't work but also doesn't otherwise
        // show an error (older versions don't work at all)
        // Based on: http://stackoverflow.com/a/10965203
        var div = document.createElement("div");
        div.innerHTML = "<!--[if lte IE 9]><i></i><![endif]-->";
        if (div.getElementsByTagName("i").length == 1) {
            anError();
            return;
        }
    
        origHfov = config.hfov;
        origPitch = config.pitch;
    
        var i, p;
        
        if (config.type == 'cubemap') {
            panoImage = [];
            for (i = 0; i < 6; i++) {
                panoImage.push(new Image());
                panoImage[i].crossOrigin = config.crossOrigin;
            }
            infoDisplay.load.lbox.style.display = 'block';
            infoDisplay.load.lbar.style.display = 'none';
        } else if (config.type == 'multires') {
            var c = JSON.parse(JSON.stringify(config.multiRes));    // Deep copy
            // Avoid "undefined" in path, check (optional) multiRes.basePath, too
            // Use only multiRes.basePath if it's an absolute URL
            if (config.basePath && config.multiRes.basePath &&
                !(/^(?:[a-z]+:)?\/\//i.test(config.multiRes.basePath))) {
                c.basePath = config.basePath + config.multiRes.basePath;
            } else if (config.multiRes.basePath) {
                c.basePath = config.multiRes.basePath;
            } else if(config.basePath) {
                c.basePath = config.basePath;
            }
            panoImage = c;
        } else {
            if (config.dynamic === true) {
                panoImage = config.panorama;
            } else {
                if (config.panorama === undefined) {
                    anError(config.strings.noPanoramaError);
                    return;
                }
                panoImage = new Image();
            }
        }
    
        // Configure image loading
        if (config.type == 'cubemap') {
            // Quick loading counter for synchronous loading
            var itemsToLoad = 6;
            
            var onLoad = function() {
                itemsToLoad--;
                if (itemsToLoad === 0) {
                    onImageLoad();
                }
            };
            
            var onError = function(e) {
                var a = document.createElement('a');
                a.href = e.target.src;
                a.textContent = a.href;
                anError(config.strings.fileAccessError.replace('%s', a.outerHTML));
            };
            
            for (i = 0; i < panoImage.length; i++) {
                p = config.cubeMap[i];
                if (p == "null") { // support partial cubemap image with explicitly empty faces
                    console.log('Will use background instead of missing cubemap face ' + i);
                    onLoad();
                } else {
                    if (config.basePath && !absoluteURL(p)) {
                        p = config.basePath + p;
                    }
                    panoImage[i].onload = onLoad;
                    panoImage[i].onerror = onError;
                    panoImage[i].src = sanitizeURL(p);
                }
            }
        } else if (config.type == 'multires') {
            onImageLoad();
        } else {
            p = '';
            if (config.basePath) {
                p = config.basePath;
            }
            
            if (config.dynamic !== true) {
                // Still image
                if (config.panorama instanceof Image || config.panorama instanceof ImageData ||
                    (window.ImageBitmap && config.panorama instanceof ImageBitmap)) {
                    panoImage = config.panorama;
                    onImageLoad();
                    return;
                }
    
                p = absoluteURL(config.panorama) ? config.panorama : p + config.panorama;
    
                panoImage.onload = function() {
                    window.URL.revokeObjectURL(this.src);  // Clean up
                    onImageLoad();
                };
                
                xhr = new XMLHttpRequest();
                xhr.onloadend = function() {
                    if (xhr.status != 200) {
                        // Display error if image can't be loaded
                        var a = document.createElement('a');
                        a.href = p;
                        a.textContent = a.href;
                        anError(config.strings.fileAccessError.replace('%s', a.outerHTML));
                        return;
                    }
                    var img = this.response;
                    parseGPanoXMP(img, p);
                    infoDisplay.load.msg.innerHTML = '';
                };
                xhr.onprogress = function(e) {
                    if (e.lengthComputable) {
                        // Display progress
                        var percent = e.loaded / e.total * 100;
                        infoDisplay.load.lbarFill.style.width = percent + '%';
                        var unit, numerator, denominator;
                        if (e.total > 1e6) {
                            unit = 'MB';
                            numerator = (e.loaded / 1e6).toFixed(2);
                            denominator = (e.total / 1e6).toFixed(2);
                        } else if (e.total > 1e3) {
                            unit = 'kB';
                            numerator = (e.loaded / 1e3).toFixed(1);
                            denominator = (e.total / 1e3).toFixed(1);
                        } else {
                            unit = 'B';
                            numerator = e.loaded;
                            denominator = e.total;
                        }
                        infoDisplay.load.msg.innerHTML = numerator + ' / ' + denominator + ' ' + unit;
                    } else {
                        // Display loading spinner
                        infoDisplay.load.lbox.style.display = 'block';
                        infoDisplay.load.lbar.style.display = 'none';
                    }
                };
                try {
                    xhr.open('GET', p, true);
                } catch (e) {
                    // Malformed URL
                    anError(config.strings.malformedURLError);
                }
                xhr.responseType = 'blob';
                xhr.setRequestHeader('Accept', 'image/*,*/*;q=0.9');
                xhr.withCredentials = config.crossOrigin === 'use-credentials';
                xhr.send();
            }
        }
        
        if (config.draggable)
            uiContainer.classList.add('pnlm-grab');
        uiContainer.classList.remove('pnlm-grabbing');
    
        // Properly handle switching to dynamic scenes
        update = config.dynamicUpdate === true;
        if (config.dynamic && update) {
            panoImage = config.panorama;
            onImageLoad();
        }
    }
    
    /**
     * Test if URL is absolute or relative.
     * @private
     * @param {string} url - URL to test
     * @returns {boolean} True if absolute, else false
     */
    function absoluteURL(url) {
        // From http://stackoverflow.com/a/19709846
        return new RegExp('^(?:[a-z]+:)?//', 'i').test(url) || url[0] == '/' || url.slice(0, 5) == 'blob:';
    }
    
    /**
     * Create renderer and initialize event listeners once image is loaded.
     * @private
     */
    function onImageLoad() {
        if (!renderer)
            renderer = new libpannellum.renderer(renderContainer);
    
        // Only add event listeners once
        if (!listenersAdded) {
            listenersAdded = true;
            dragFix.addEventListener('mousedown', onDocumentMouseDown, false);
            document.addEventListener('mousemove', onDocumentMouseMove, false);
            document.addEventListener('mouseup', onDocumentMouseUp, false);
            if (config.mouseZoom) {
                uiContainer.addEventListener('mousewheel', onDocumentMouseWheel, false);
                uiContainer.addEventListener('DOMMouseScroll', onDocumentMouseWheel, false);
            }
            if (config.doubleClickZoom) {
                dragFix.addEventListener('dblclick', onDocumentDoubleClick, false);
            }
            container.addEventListener('mozfullscreenchange', onFullScreenChange, false);
            container.addEventListener('webkitfullscreenchange', onFullScreenChange, false);
            container.addEventListener('msfullscreenchange', onFullScreenChange, false);
            container.addEventListener('fullscreenchange', onFullScreenChange, false);
            if (typeof ResizeObserver === 'function') {
                resizeObserver = new ResizeObserver(onDocumentResize);
                resizeObserver.observe(container);
            } else {
                window.addEventListener('resize', onDocumentResize, false);
                window.addEventListener('orientationchange', onDocumentResize, false);
            }
            if (!config.disableKeyboardCtrl) {
                container.addEventListener('keydown', onDocumentKeyPress, false);
                container.addEventListener('keyup', onDocumentKeyUp, false);
                container.addEventListener('blur', clearKeys, false);
            }
            document.addEventListener('mouseleave', onDocumentMouseUp, false);
            if (document.documentElement.style.pointerAction === '' &&
                document.documentElement.style.touchAction === '') {
                dragFix.addEventListener('pointerdown', onDocumentPointerDown, false);
                dragFix.addEventListener('pointermove', onDocumentPointerMove, false);
                dragFix.addEventListener('pointerup', onDocumentPointerUp, false);
                dragFix.addEventListener('pointerleave', onDocumentPointerUp, false);
            } else {
                dragFix.addEventListener('touchstart', onDocumentTouchStart, false);
                dragFix.addEventListener('touchmove', onDocumentTouchMove, false);
                dragFix.addEventListener('touchend', onDocumentTouchEnd, false);
            }
    
            // Deal with MS pointer events
            if (window.navigator.pointerEnabled)
                container.style.touchAction = 'none';
        }
    
        renderInit();
        setHfov(config.hfov); // Possibly adapt HFOV after configuration and canvas is complete; prevents empty space on top or bottom by zooming out too much
        setTimeout(function(){isTimedOut = true;}, 500);
    }
    
    /**
     * Parses Google Photo Sphere XMP Metadata.
     * https://developers.google.com/photo-sphere/metadata/
     * @private
     * @param {Image} image - Image to read XMP metadata from.
     */
    function parseGPanoXMP(image, url) {
        var reader = new FileReader();
        reader.addEventListener('loadend', function() {
            var img = reader.result;
    
            // This awful browser specific test exists because iOS 8 does not work
            // with non-progressive encoded JPEGs.
            if (navigator.userAgent.toLowerCase().match(/(iphone|ipod|ipad).* os 8_/)) {
                var flagIndex = img.indexOf('\xff\xc2');
                if (flagIndex < 0 || flagIndex > 65536)
                    anError(config.strings.iOS8WebGLError);
            }
    
            var start = img.indexOf('<x:xmpmeta');
            if (start > -1 && config.ignoreGPanoXMP !== true) {
                var xmpData = img.substring(start, img.indexOf('</x:xmpmeta>') + 12);
                
                // Extract the requested tag from the XMP data
                var getTag = function(tag) {
                    var result;
                    if (xmpData.indexOf(tag + '="') >= 0) {
                        result = xmpData.substring(xmpData.indexOf(tag + '="') + tag.length + 2);
                        result = result.substring(0, result.indexOf('"'));
                    } else if (xmpData.indexOf(tag + '>') >= 0) {
                        result = xmpData.substring(xmpData.indexOf(tag + '>') + tag.length + 1);
                        result = result.substring(0, result.indexOf('<'));
                    }
                    if (result !== undefined) {
                        return Number(result);
                    }
                    return null;
                };
                
                // Relevant XMP data
                var xmp = {
                    fullWidth: getTag('GPano:FullPanoWidthPixels'),
                    croppedWidth: getTag('GPano:CroppedAreaImageWidthPixels'),
                    fullHeight: getTag('GPano:FullPanoHeightPixels'),
                    croppedHeight: getTag('GPano:CroppedAreaImageHeightPixels'),
                    topPixels: getTag('GPano:CroppedAreaTopPixels'),
                    heading: getTag('GPano:PoseHeadingDegrees'),
                    horizonPitch: getTag('GPano:PosePitchDegrees'),
                    horizonRoll: getTag('GPano:PoseRollDegrees'),
                    pitch: getTag('GPano:InitialViewPitchDegrees'),
                    yaw: getTag('GPano:InitialViewHeadingDegrees'),
                    hfov: getTag('GPano:InitialHorizontalFOVDegrees')
                };
                
                if (xmp.fullWidth !== null && xmp.croppedWidth !== null &&
                    xmp.fullHeight !== null && xmp.croppedHeight !== null &&
                    xmp.topPixels !== null) {
                    
                    // Set up viewer using GPano XMP data
                    if (specifiedPhotoSphereExcludes.indexOf('haov') < 0)
                        config.haov = xmp.croppedWidth / xmp.fullWidth * 360;
                    if (specifiedPhotoSphereExcludes.indexOf('vaov') < 0)
                        config.vaov = xmp.croppedHeight / xmp.fullHeight * 180;
                    if (specifiedPhotoSphereExcludes.indexOf('vOffset') < 0)
                        config.vOffset = ((xmp.topPixels + xmp.croppedHeight / 2) / xmp.fullHeight - 0.5) * -180;
                    if (xmp.heading !== null && specifiedPhotoSphereExcludes.indexOf('northOffset') < 0) {
                        // TODO: make sure this works correctly for partial panoramas
                        config.northOffset = xmp.heading;
                        if (config.compass !== false) {
                            config.compass = true;
                        }
                    }
                    if (xmp.horizonPitch !== null && xmp.horizonRoll !== null) {
                        if (specifiedPhotoSphereExcludes.indexOf('horizonPitch') < 0)
                            config.horizonPitch = xmp.horizonPitch;
                        if (specifiedPhotoSphereExcludes.indexOf('horizonRoll') < 0)
                            config.horizonRoll = xmp.horizonRoll;
                    }
                    
                    if (xmp.pitch != null && specifiedPhotoSphereExcludes.indexOf('pitch') < 0)
                        config.pitch = xmp.pitch;
                    if (xmp.yaw != null && specifiedPhotoSphereExcludes.indexOf('yaw') < 0)
                        config.yaw = xmp.yaw;
                    if (xmp.hfov != null && specifiedPhotoSphereExcludes.indexOf('hfov') < 0)
                        config.hfov = xmp.hfov;
                }
            }
            
            // Load panorama
            panoImage.src = window.URL.createObjectURL(image);
            panoImage.onerror = function() {
                // If the image fails to load, we check the Content Security Policy
                // headers and see if they block loading images as blobs. If they
                // do, we load the image directly from the URL. While this should
                // allow the image to load, it does prevent parsing of XMP data.
                function getCspHeaders() {
                    if (!window.fetch)
                        return null;
                    return window.fetch(document.location.href)
                        .then(function(resp){
                            return resp.headers.get('Content-Security-Policy');
                        });
                }
                getCspHeaders().then(function(cspHeaders) {
                    if (cspHeaders) {
                        var invalidImgSource = cspHeaders.split(";").find(function(p) {
                            var matchstring = p.match(/img-src(.*)/);
                            if (matchstring) {
                                return !matchstring[1].includes("blob");
                            }
                        });
                        if (invalidImgSource) {
                            console.log('CSP blocks blobs; reverting to URL.');
                            panoImage.crossOrigin = config.crossOrigin;
                            panoImage.src = url;
                        }
                    }
                });
            }
        });
        if (reader.readAsBinaryString !== undefined)
            reader.readAsBinaryString(image);
        else
            reader.readAsText(image);
    }
    
    /**
     * Displays an error message.
     * @private
     * @param {string} errorMsg - Error message to display. If not specified, a
     *      generic WebGL error is displayed.
     */
    function anError(errorMsg) {
        if (errorMsg === undefined)
            errorMsg = config.strings.genericWebGLError;
        infoDisplay.errorMsg.innerHTML = '<p>' + errorMsg + '</p>';
        controls.load.style.display = 'none';
        infoDisplay.load.box.style.display = 'none';
        infoDisplay.errorMsg.style.display = 'table';
        error = true;
        loaded = undefined;
        renderContainer.style.display = 'none';
        fireEvent('error', errorMsg);
    }
    
    /**
     * Hides error message display.
     * @private
     */
    function clearError() {
        if (error) {
            infoDisplay.load.box.style.display = 'none';
            infoDisplay.errorMsg.style.display = 'none';
            error = false;
            renderContainer.style.display = 'block';
            fireEvent('errorcleared');
        }
    }
    
    /**
     * Displays an interaction message.
     * @private
     * @param {string} msg - Message to display.
     */
    function showInteractionMessage(interactionMsg) {
        infoDisplay.interactionMsg.style.opacity = 1;
    
        infoDisplay.interactionMsg.innerHTML = '<p>' + interactionMsg + '</p>';
        infoDisplay.interactionMsg.style.display = 'table';
        fireEvent('messageshown');
    
        clearTimeout(infoDisplay.interactionMsg.timeout);
        infoDisplay.interactionMsg.removeEventListener('transitionend', clearInteractionMessage);
        infoDisplay.interactionMsg.timeout = setTimeout(function() {
            infoDisplay.interactionMsg.style.opacity = 0;
            infoDisplay.interactionMsg.addEventListener('transitionend', clearInteractionMessage);
        }, 2000);
    }
    
    /**
     * Hides interaction message display.
     * @private
     */
    function clearInteractionMessage() {
        infoDisplay.interactionMsg.style.opacity = 0;
        infoDisplay.interactionMsg.style.display = 'none';
        fireEvent('messagecleared');
    }
    
    /**
     * Displays about message.
     * @private
     * @param {MouseEvent} event - Right click location
     */
    function aboutMessage(event) {
        var pos = mousePosition(event);
        aboutMsg.style.left = pos.x + 'px';
        aboutMsg.style.top = pos.y + 'px';
        clearTimeout(aboutMessage.t1);
        clearTimeout(aboutMessage.t2);
        aboutMsg.style.display = 'block';
        aboutMsg.style.opacity = 1;
        aboutMessage.t1 = setTimeout(function() {aboutMsg.style.opacity = 0;}, 2000);
        aboutMessage.t2 = setTimeout(function() {aboutMsg.style.display = 'none';}, 2500);
        event.preventDefault();
    }
    
    /**
     * Calculate mouse position relative to top left of viewer container.
     * @private
     * @param {MouseEvent} event - Mouse event to use in calculation
     * @returns {Object} Calculated X and Y coordinates
     */
    function mousePosition(event) {
        var bounds = container.getBoundingClientRect();
        var pos = {};
        // pageX / pageY needed for iOS
        pos.x = (event.clientX || event.pageX) - bounds.left;
        pos.y = (event.clientY || event.pageY) - bounds.top;
        return pos;
    }
    
    /**
     * Event handler for mouse clicks. Initializes panning. Prints center and click
     * location coordinates when hot spot debugging is enabled.
     * @private
     * @param {MouseEvent} event - Document mouse down event.
     */
    function onDocumentMouseDown(event) {
        // Override default action
        event.preventDefault();
        // But not all of it
        container.focus();
        
        // Only do something if the panorama is loaded
        if (!loaded || !config.draggable || config.draggingHotSpot) {
            return;
        }
        
        // Calculate mouse position relative to top left of viewer container
        var pos = mousePosition(event);
    
        // Log pitch / yaw of mouse click when debugging / placing hot spots
        if (config.hotSpotDebug) {
            var coords = mouseEventToCoords(event);
            console.log('Pitch: ' + coords[0] + ', Yaw: ' + coords[1] + ', Center Pitch: ' +
                config.pitch + ', Center Yaw: ' + config.yaw + ', HFOV: ' + config.hfov);
        }
        
        // Turn off auto-rotation if enabled
        stopAnimation();
    
        stopOrientation();
        config.roll = 0;
    
        speed.hfov = 0;
    
        isUserInteracting = true;
        latestInteraction = Date.now();
        
        onPointerDownPointerX = pos.x;
        onPointerDownPointerY = pos.y;
        
        onPointerDownYaw = config.yaw;
        onPointerDownPitch = config.pitch;
        
        uiContainer.classList.add('pnlm-grabbing');
        uiContainer.classList.remove('pnlm-grab');
        
        fireEvent('mousedown', event);
        animateInit();
    }
    
    /**
     * Event handler for double clicks. Zooms in at clicked location
     * @private
     * @param {MouseEvent} event - Document mouse down event.
     */
    function onDocumentDoubleClick(event) {
        if (config.minHfov === config.hfov) {
            _this.setHfov(origHfov, 1000);
        } else {
            var coords = mouseEventToCoords(event);
            _this.lookAt(coords[0], coords[1], config.minHfov, 1000);
        }
    }
    
    /**
     * Calculate panorama pitch and yaw from location of mouse event.
     * @private
     * @param {MouseEvent} event - Document mouse down event.
     * @returns {number[]} [pitch, yaw]
     */
    function mouseEventToCoords(event) {
        var pos = mousePosition(event);
        var canvas = renderer.getCanvas();
        var canvasWidth = canvas.clientWidth,
            canvasHeight = canvas.clientHeight;
        var x = pos.x / canvasWidth * 2 - 1;
        var y = (1 - pos.y / canvasHeight * 2) * canvasHeight / canvasWidth;
        var focal = 1 / Math.tan(config.hfov * Math.PI / 360);
        var s = Math.sin(config.pitch * Math.PI / 180);
        var c = Math.cos(config.pitch * Math.PI / 180);
        var a = focal * c - y * s;
        var root = Math.sqrt(x*x + a*a);
        var pitch = Math.atan((y * c + focal * s) / root) * 180 / Math.PI;
        var yaw = Math.atan2(x / root, a / root) * 180 / Math.PI + config.yaw;
        if (yaw < -180)
            yaw += 360;
        if (yaw > 180)
            yaw -= 360;
        return [pitch, yaw];
    }
    
    /**
     * Event handler for mouse moves. Pans center of view.
     * @private
     * @param {MouseEvent} event - Document mouse move event.
     */
    function onDocumentMouseMove(event) {
        if (draggingHotSpot) {
            moveHotSpot(draggingHotSpot, event);
        } else if (isUserInteracting && loaded) {
            latestInteraction = Date.now();
            var canvas = renderer.getCanvas();
            var canvasWidth = canvas.clientWidth,
                canvasHeight = canvas.clientHeight;
            var pos = mousePosition(event);
            //TODO: This still isn't quite right
            var yaw = ((Math.atan(onPointerDownPointerX / canvasWidth * 2 - 1) - Math.atan(pos.x / canvasWidth * 2 - 1)) * 180 / Math.PI * config.hfov / 90) + onPointerDownYaw;
            speed.yaw = (yaw - config.yaw) % 360 * 0.2;
            config.yaw = yaw;
            
            var vfov = 2 * Math.atan(Math.tan(config.hfov/360*Math.PI) * canvasHeight / canvasWidth) * 180 / Math.PI;
            
            var pitch = ((Math.atan(pos.y / canvasHeight * 2 - 1) - Math.atan(onPointerDownPointerY / canvasHeight * 2 - 1)) * 180 / Math.PI * vfov / 90) + onPointerDownPitch;
            speed.pitch = (pitch - config.pitch) * 0.2;
            config.pitch = pitch;
        }
    }
    
    /**
     * Event handler for mouse up events. Stops panning.
     * @private
     */
    function onDocumentMouseUp(event) {
        if (draggingHotSpot && draggingHotSpot.dragHandlerFunc)
            draggingHotSpot.dragHandlerFunc(event, draggingHotSpot.dragHandlerArgs);
        draggingHotSpot = null;
    
        if (!isUserInteracting) {
            return;
        }
        isUserInteracting = false;
        if (Date.now() - latestInteraction > 15) {
            // Prevents jump when user rapidly moves mouse, stops, and then
            // releases the mouse button
            speed.pitch = speed.yaw = 0;
        }
        uiContainer.classList.add('pnlm-grab');
        uiContainer.classList.remove('pnlm-grabbing');
        latestInteraction = Date.now();
    
        fireEvent('mouseup', event);
    }
    
    /**
     * Event handler for touches. Initializes panning if one touch or zooming if
     * two touches.
     * @private
     * @param {TouchEvent} event - Document touch start event.
     */
    function onDocumentTouchStart(event) {
        // Only do something if the panorama is loaded
        if (!loaded || !config.draggable || draggingHotSpot) {
            return;
        }
    
        // Turn off auto-rotation if enabled
        stopAnimation();
    
        stopOrientation();
        config.roll = 0;
    
        speed.hfov = 0;
    
        // Calculate touch position relative to top left of viewer container
        var pos0 = mousePosition(event.targetTouches[0]);
    
        onPointerDownPointerX = pos0.x;
        onPointerDownPointerY = pos0.y;
        
        if (event.targetTouches.length == 2) {
            // Down pointer is the center of the two fingers
            var pos1 = mousePosition(event.targetTouches[1]);
            onPointerDownPointerX += (pos1.x - pos0.x) * 0.5;
            onPointerDownPointerY += (pos1.y - pos0.y) * 0.5;
            onPointerDownPointerDist = Math.sqrt((pos0.x - pos1.x) * (pos0.x - pos1.x) +
                                                 (pos0.y - pos1.y) * (pos0.y - pos1.y));
        }
        isUserInteracting = true;
        latestInteraction = Date.now();
        
        onPointerDownYaw = config.yaw;
        onPointerDownPitch = config.pitch;
    
        fireEvent('touchstart', event);
        animateInit();
    }
    
    /**
     * Event handler for touch movements. Pans center of view if one touch or
     * adjusts zoom if two touches.
     * @private
     * @param {TouchEvent} event - Document touch move event.
     */
    function onDocumentTouchMove(event) {
        if (!config.draggable) {
            return;
        }
    
        // Override default action
        if (!config.dragConfirm)
            event.preventDefault();
        if (loaded) {
            latestInteraction = Date.now();
        }
        if (isUserInteracting && loaded) {
            var pos0 = mousePosition(event.targetTouches[0]);
            var clientX = pos0.x;
            var clientY = pos0.y;
    
            if (event.targetTouches.length == 2 && onPointerDownPointerDist != -1) {
                var pos1 = mousePosition(event.targetTouches[1]);
                clientX += (pos1.x - pos0.x) * 0.5;
                clientY += (pos1.y - pos0.y) * 0.5;
                var clientDist = Math.sqrt((pos0.x - pos1.x) * (pos0.x - pos1.x) +
                                           (pos0.y - pos1.y) * (pos0.y - pos1.y));
                setHfov(config.hfov + (onPointerDownPointerDist - clientDist) * 0.1);
                onPointerDownPointerDist = clientDist;
            }
    
            // The smaller the config.hfov value (the more zoomed-in the user is), the faster
            // yaw/pitch are perceived to change on one-finger touchmove (panning) events and vice versa.
            // To improve usability at both small and large zoom levels (config.hfov values)
            // we introduce a dynamic pan speed coefficient.
            //
            // Currently this seems to *roughly* keep initial drag/pan start position close to
            // the user's finger while panning regardless of zoom level / config.hfov value.
            var touchmovePanSpeedCoeff = (config.hfov / 360) * config.touchPanSpeedCoeffFactor;
    
    
            if (!fullscreenActive && (config.dragConfirm == 'both' || config.dragConfirm == 'yaw') && event.targetTouches.length != 2) {
                if (onPointerDownPointerX != clientX) {
                    if (config.dragConfirm == 'yaw')
                        showInteractionMessage(config.strings.twoTouchXActivate);
                    else
                        showInteractionMessage(config.strings.twoTouchActivate);
                }
            } else {
                var yaw = (onPointerDownPointerX - clientX) * touchmovePanSpeedCoeff + onPointerDownYaw;
                speed.yaw = (yaw - config.yaw) % 360 * 0.2;
                config.yaw = yaw;
            }
    
    
            if (!fullscreenActive && (config.dragConfirm == 'both' || config.dragConfirm == 'pitch') && event.targetTouches.length != 2) {
                if (onPointerDownPointerY != clientY) {
                    if (config.dragConfirm == 'pitch')
                        showInteractionMessage(config.strings.twoTouchYActivate);
                    else
                        showInteractionMessage(config.strings.twoTouchActivate);
                }
            } else {
                var pitch = (clientY - onPointerDownPointerY) * touchmovePanSpeedCoeff + onPointerDownPitch;
                speed.pitch = (pitch - config.pitch) * 0.2;
                config.pitch = pitch;
            }
    
    
            if ((config.dragConfirm == 'yaw' || config.dragConfirm == 'pitch' || config.dragConfirm == 'both') && event.targetTouches.length == 2) {
                clearInteractionMessage();
                event.preventDefault();
            }
    
        }
    }
    
    /**
     * Event handler for end of touches. Stops panning and/or zooming.
     * @private
     */
    function onDocumentTouchEnd() {
        draggingHotSpot = null;
    
        isUserInteracting = false;
        if (Date.now() - latestInteraction > 150) {
            speed.pitch = speed.yaw = 0;
        }
        onPointerDownPointerDist = -1;
        latestInteraction = Date.now();
    
        fireEvent('touchend', event);
    }
    
    var pointerIDs = [],
        pointerCoordinates = [];
    /**
     * Event handler for touch starts in IE / Edge.
     * @private
     * @param {PointerEvent} event - Document pointer down event.
     */
    function onDocumentPointerDown(event) {
        if (event.pointerType == 'touch') {
            // Only do something if the panorama is loaded
            if (!loaded || !config.draggable)
                return;
            pointerIDs.push(event.pointerId);
            pointerCoordinates.push({clientX: event.clientX, clientY: event.clientY});
            event.targetTouches = pointerCoordinates;
            onDocumentTouchStart(event);
            event.preventDefault();
        }
    }
    
    /**
     * Event handler for touch moves in IE / Edge.
     * @private
     * @param {PointerEvent} event - Document pointer move event.
     */
    function onDocumentPointerMove(event) {
        if (event.pointerType == 'touch') {
            if (draggingHotSpot) {
                moveHotSpot(draggingHotSpot, event);
                return;
            }
    
            if (!config.draggable)
                return;
            for (var i = 0; i < pointerIDs.length; i++) {
                if (event.pointerId == pointerIDs[i]) {
                    pointerCoordinates[i].clientX = event.clientX;
                    pointerCoordinates[i].clientY = event.clientY;
                    event.targetTouches = pointerCoordinates;
                    onDocumentTouchMove(event);
                    event.preventDefault();
                    return;
                }
            }
        }
    }
    
    /**
     * Event handler for touch ends in IE / Edge.
     * @private
     * @param {PointerEvent} event - Document pointer up event.
     */
    function onDocumentPointerUp(event) {
        if (draggingHotSpot && draggingHotSpot.dragHandlerFunc)
            draggingHotSpot.dragHandlerFunc(event, draggingHotSpot.dragHandlerArgs);
        draggingHotSpot = null;
    
        if (event.pointerType == 'touch') {
            var defined = false;
            for (var i = 0; i < pointerIDs.length; i++) {
                if (event.pointerId == pointerIDs[i])
                    pointerIDs[i] = undefined;
                if (pointerIDs[i])
                    defined = true;
            }
            if (!defined) {
                pointerIDs = [];
                pointerCoordinates = [];
                onDocumentTouchEnd();
            }
            event.preventDefault();
        }
    }
    
    /**
     * Event handler for mouse wheel. Changes zoom.
     * @private
     * @param {WheelEvent} event - Document mouse wheel event.
     */
    function onDocumentMouseWheel(event) {
        // Only do something if the panorama is loaded and mouse wheel zoom is enabled
        if (!loaded || (config.mouseZoom == 'fullscreenonly' && !fullscreenActive)) {
            return;
        }
    
        // Ctrl for zoom
        if (!fullscreenActive && config.mouseZoom == 'ctrl' && !event.ctrlKey) {
            var keyname = navigator.platform.indexOf('Mac') != -1 ? 'control' : 'ctrl';
            showInteractionMessage(config.strings.ctrlZoomActivate.replace('%s', '<kbd class="pnlm-outline">' + keyname + '</kbd>'));
            return;
        }
        clearInteractionMessage();
    
        event.preventDefault();
    
        // Turn off auto-rotation if enabled
        stopAnimation();
        latestInteraction = Date.now();
    
        if (event.wheelDeltaY) {
            // WebKit
            setHfov(config.hfov - event.wheelDeltaY * 0.05);
            speed.hfov = event.wheelDelta < 0 ? 1 : -1;
        } else if (event.wheelDelta) {
            // Opera / Explorer 9
            setHfov(config.hfov - event.wheelDelta * 0.05);
            speed.hfov = event.wheelDelta < 0 ? 1 : -1;
        } else if (event.detail) {
            // Firefox
            setHfov(config.hfov + event.detail * 1.5);
            speed.hfov = event.detail > 0 ? 1 : -1;
        }
        animateInit();
    }
    
    /**
     * Event handler for key presses. Updates list of currently pressed keys.
     * @private
     * @param {KeyboardEvent} event - Document key press event.
     */
    function onDocumentKeyPress(event) {
        // Turn off auto-rotation if enabled
        stopAnimation();
        latestInteraction = Date.now();
    
        stopOrientation();
        config.roll = 0;
    
        // Record key pressed
        var keynumber = event.which || event.keycode;
    
        // Override default action for keys that are used
        if (config.capturedKeyNumbers.indexOf(keynumber) < 0)
            return;
        if (!fullscreenActive && (keynumber == 16 || keynumber == 17) && config.mouseZoom == 'ctrl')
            // Disable ctrl / shift zoom when holding the ctrl key is required for
            // scroll wheel zooming
            return;
        event.preventDefault();
        
        // If escape key is pressed
        if (keynumber == 27) {
            // If in fullscreen mode
            if (fullscreenActive) {
                toggleFullscreen();
            }
        } else {
            // Change key
            changeKey(keynumber, true);
        }
    }
    
    /**
     * Clears list of currently pressed keys.
     * @private
     */
    function clearKeys() {
        for (var i = 0; i < 10; i++) {
            keysDown[i] = false;
        }
    }
    
    /**
     * Event handler for key releases. Updates list of currently pressed keys.
     * @private
     * @param {KeyboardEvent} event - Document key up event.
     */
    function onDocumentKeyUp(event) {
        // Record key pressed
        var keynumber = event.which || event.keycode;
        
        // Override default action for keys that are used
        if (config.capturedKeyNumbers.indexOf(keynumber) < 0)
            return;
        event.preventDefault();
        
        // Change key
        changeKey(keynumber, false);
    }
    
    /**
     * Updates list of currently pressed keys.
     * @private
     * @param {number} keynumber - Key number.
     * @param {boolean} value - Whether or not key is pressed.
     */
    function changeKey(keynumber, value) {
        var keyChanged = false;
        switch(keynumber) {
            // If minus key is released
            case 109: case 189: case 17: case 173:
                if (keysDown[0] != value) { keyChanged = true; }
                keysDown[0] = value; break;
            
            // If plus key is released
            case 107: case 187: case 16: case 61:
                if (keysDown[1] != value) { keyChanged = true; }
                keysDown[1] = value; break;
            
            // If up arrow is released
            case 38:
                if (keysDown[2] != value) { keyChanged = true; }
                keysDown[2] = value; break;
            
            // If "w" is released
            case 87:
                if (keysDown[6] != value) { keyChanged = true; }
                keysDown[6] = value; break;
            
            // If down arrow is released
            case 40:
                if (keysDown[3] != value) { keyChanged = true; }
                keysDown[3] = value; break;
            
            // If "s" is released
            case 83:
                if (keysDown[7] != value) { keyChanged = true; }
                keysDown[7] = value; break;
            
            // If left arrow is released
            case 37:
                if (keysDown[4] != value) { keyChanged = true; }
                keysDown[4] = value; break;
            
            // If "a" is released
            case 65:
                if (keysDown[8] != value) { keyChanged = true; }
                keysDown[8] = value; break;
            
            // If right arrow is released
            case 39:
                if (keysDown[5] != value) { keyChanged = true; }
                keysDown[5] = value; break;
            
            // If "d" is released
            case 68:
                if (keysDown[9] != value) { keyChanged = true; }
                keysDown[9] = value;
        }
        
        if (keyChanged && value) {
            if (typeof performance !== 'undefined' && performance.now()) {
                prevTime = performance.now();
            } else {
                prevTime = Date.now();
            }
            animateInit();
        }
    }
    
    /**
     * Pans and/or zooms panorama based on currently pressed keys. Also handles
     * panorama "inertia" and auto rotation.
     * @private
     */
    function keyRepeat() {
        // Only do something if the panorama is loaded
        if (!loaded) {
            return;
        }
    
        var isKeyDown = false;
    
        var prevPitch = config.pitch;
        var prevYaw = config.yaw;
        var prevZoom = config.hfov;
        
        var newTime;
        if (typeof performance !== 'undefined' && performance.now()) {
            newTime = performance.now();
        } else {
            newTime = Date.now();
        }
        if (prevTime === undefined) {
            prevTime = newTime;
        }
        var diff = (newTime - prevTime) * config.hfov / 1200;
        diff = Math.min(diff, 10.0); // Avoid jump if something goes wrong with time diff
        
        // If minus key is down
        if (keysDown[0] && config.keyboardZoom === true) {
            setHfov(config.hfov + (speed.hfov * 0.8 + 0.4) * diff);
            isKeyDown = true;
        }
        
        // If plus key is down
        if (keysDown[1] && config.keyboardZoom === true) {
            setHfov(config.hfov + (speed.hfov * 0.8 - 0.2) * diff);
            isKeyDown = true;
        }
        
        // If up arrow or "w" is down
        if (keysDown[2] || keysDown[6]) {
            // Pan up
            config.pitch += (speed.pitch * 0.8 + 0.2) * diff;
            isKeyDown = true;
        }
        
        // If down arrow or "s" is down
        if (keysDown[3] || keysDown[7]) {
            // Pan down
            config.pitch += (speed.pitch * 0.8 - 0.2) * diff;
            isKeyDown = true;
        }
        
        // If left arrow or "a" is down
        if (keysDown[4] || keysDown[8]) {
            // Pan left
            config.yaw += (speed.yaw * 0.8 - 0.2) * diff;
            isKeyDown = true;
        }
        
        // If right arrow or "d" is down
        if (keysDown[5] || keysDown[9]) {
            // Pan right
            config.yaw += (speed.yaw * 0.8 + 0.2) * diff;
            isKeyDown = true;
        }
    
        if (isKeyDown)
            latestInteraction = Date.now();
    
        // If auto-rotate
        if (config.autoRotate) {
            // Pan
            if (newTime - prevTime > 0.001) {
                var timeDiff = (newTime - prevTime) / 1000;
                var yawDiff = (speed.yaw / timeDiff * diff - config.autoRotate * 0.2) * timeDiff;
                yawDiff = (-config.autoRotate > 0 ? 1 : -1) * Math.min(Math.abs(config.autoRotate * timeDiff), Math.abs(yawDiff));
                config.yaw += yawDiff;
            }
            
            // Deal with stopping auto rotation after a set delay
            if (config.autoRotateStopDelay) {
                config.autoRotateStopDelay -= newTime - prevTime;
                if (config.autoRotateStopDelay <= 0) {
                    config.autoRotateStopDelay = false;
                    autoRotateSpeed = config.autoRotate;
                    config.autoRotate = 0;
                }
            }
        }
    
        // Animated moves
        if (animatedMove.pitch) {
            animateMove('pitch');
            prevPitch = config.pitch;
        }
        if (animatedMove.yaw) {
            animateMove('yaw');
            prevYaw = config.yaw;
        }
        if (animatedMove.hfov) {
            animateMove('hfov');
            prevZoom = config.hfov;
        }
    
        // "Inertia"
        if (diff > 0 && !config.autoRotate) {
            // "Friction"
            var slowDownFactor = 1 - config.friction;
    
            // Yaw
            if (!keysDown[4] && !keysDown[5] && !keysDown[8] && !keysDown[9] && !animatedMove.yaw) {
                config.yaw += speed.yaw * diff * slowDownFactor;
            }
            // Pitch
            if (!keysDown[2] && !keysDown[3] && !keysDown[6] && !keysDown[7] && !animatedMove.pitch) {
                config.pitch += speed.pitch * diff * slowDownFactor;
            }
            // Zoom
            if (!keysDown[0] && !keysDown[1] && !animatedMove.hfov) {
                if (config.hfov > 90) {
                    // Slow down faster for wider HFOV
                    slowDownFactor *= 1 - (config.hfov - 90) / 90;
                }
                setHfov(config.hfov + speed.hfov * diff * slowDownFactor);
            }
        }
    
        prevTime = newTime;
        if (diff > 0) {
            speed.yaw = speed.yaw * 0.8 + (config.yaw - prevYaw) / diff * 0.2;
            speed.pitch = speed.pitch * 0.8 + (config.pitch - prevPitch) / diff * 0.2;
            speed.hfov = speed.hfov * 0.8 + (config.hfov - prevZoom) / diff * 0.2;
            
            // Limit speed
            var maxSpeed = config.autoRotate ? Math.abs(config.autoRotate) : 5;
            speed.yaw = Math.min(maxSpeed, Math.max(speed.yaw, -maxSpeed));
            speed.pitch = Math.min(maxSpeed, Math.max(speed.pitch, -maxSpeed));
            speed.hfov = Math.min(maxSpeed, Math.max(speed.hfov, -maxSpeed));
        }
        
        // Stop movement if opposite controls are pressed
        if (keysDown[0] && keysDown[1]) {
            speed.hfov = 0;
        }
        if ((keysDown[2] || keysDown[6]) && (keysDown[3] || keysDown[7])) {
            speed.pitch = 0;
        }
        if ((keysDown[4] || keysDown[8]) && (keysDown[5] || keysDown[9])) {
            speed.yaw = 0;
        }
    }
    
    /**
     * Animates moves.
     * @param {string} axis - Axis to animate
     * @private
     */
    function animateMove(axis) {
        var t = animatedMove[axis];
        var normTime = Math.min(1, Math.max((Date.now() - t.startTime) / 1000 / (t.duration / 1000), 0));
        var result = t.startPosition + config.animationTimingFunction(normTime) * (t.endPosition - t.startPosition);
        if ((t.endPosition > t.startPosition && result >= t.endPosition) ||
            (t.endPosition < t.startPosition && result <= t.endPosition) ||
            t.endPosition === t.startPosition) {
            result = t.endPosition;
            speed[axis] = 0;
            delete animatedMove[axis];
        }
        config[axis] = result;
    }
    
    /**
     * @param {number} t - Normalized time in animation
     * @return {number} Position in animation
     * @private
     */
    function timingFunction(t) {
        // easeInOutQuad from https://gist.github.com/gre/1650294
        return t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    }
    
    /**
     * Event handler for document resizes. Updates viewer size and rerenders view.
     * @private
     */
    function onDocumentResize() {
        // Resize panorama renderer (moved to onFullScreenChange)
        //renderer.resize();
        //animateInit();
    
        // Kludge to deal with WebKit regression: https://bugs.webkit.org/show_bug.cgi?id=93525
        onFullScreenChange('resize');
    }
    
    /**
     * Initializes animation.
     * @private
     */
    function animateInit() {
        if (animating) {
            return;
        }
        animating = true;
        animate();
    }
    
    /**
     * Animates view, using requestAnimationFrame to trigger rendering.
     * @private
     */
    function animate() {
        if (destroyed) {
            return;
        }
    
        render();
        if (autoRotateStart)
            clearTimeout(autoRotateStart);
        if (isUserInteracting || orientation === true) {
            requestAnimationFrame(animate);
        } else if (keysDown[0] || keysDown[1] || keysDown[2] || keysDown[3] ||
            keysDown[4] || keysDown[5] || keysDown[6] || keysDown[7] ||
            keysDown[8] || keysDown[9] || config.autoRotate ||
            animatedMove.pitch || animatedMove.yaw || animatedMove.hfov ||
            Math.abs(speed.yaw) > 0.01 || Math.abs(speed.pitch) > 0.01 ||
            Math.abs(speed.hfov) > 0.01) {
    
            keyRepeat();
            if (config.autoRotateInactivityDelay >= 0 && autoRotateSpeed &&
                Date.now() - latestInteraction > config.autoRotateInactivityDelay &&
                !config.autoRotate) {
                config.autoRotate = autoRotateSpeed;
                _this.lookAt(origPitch, undefined, origHfov, 3000);
            }
            requestAnimationFrame(animate);
        } else if (renderer && (renderer.isLoading() || (config.dynamic === true && update))) {
            requestAnimationFrame(animate);
        } else {
            if (_this.getPitch && _this.getYaw && _this.getHfov)
                fireEvent('animatefinished', {pitch: _this.getPitch(), yaw: _this.getYaw(), hfov: _this.getHfov()});
            animating = false;
            prevTime = undefined;
            var autoRotateStartTime = config.autoRotateInactivityDelay -
                (Date.now() - latestInteraction);
            if (autoRotateStartTime > 0) {
                autoRotateStart = setTimeout(function() {
                    config.autoRotate = autoRotateSpeed;
                    _this.lookAt(origPitch, undefined, origHfov, 3000);
                    animateInit();
                }, autoRotateStartTime);
            } else if (config.autoRotateInactivityDelay >= 0 && autoRotateSpeed) {
                config.autoRotate = autoRotateSpeed;
                _this.lookAt(origPitch, undefined, origHfov, 3000);
                animateInit();
            }
        }
    }
    
    /**
     * Renders panorama view.
     * @private
     */
    function render() {
        var tmpyaw;
    
        if (loaded) {
            var canvas = renderer.getCanvas();
    
            if (config.autoRotate !== false) {
                // When auto-rotating this check needs to happen first (see issue #764)
                if (config.yaw > 360) {
                    config.yaw -= 360;
                } else if (config.yaw < -360) {
                    config.yaw += 360;
                }
            }
    
            // Keep a tmp value of yaw for autoRotate comparison later
            tmpyaw = config.yaw;
    
            // Optionally avoid showing background (empty space) on left or right by adapting min/max yaw
            var hoffcut = 0,
                voffcut = 0;
            if (config.avoidShowingBackground) {
                var hfov2 = config.hfov / 2,
                    vfov2 = Math.atan2(Math.tan(hfov2 / 180 * Math.PI), (canvas.width / canvas.height)) * 180 / Math.PI,
                    transposed = config.vaov > config.haov;
                if (transposed) {
                    voffcut = vfov2 * (1 - Math.min(Math.cos((config.pitch - hfov2) / 180 * Math.PI),
                                                    Math.cos((config.pitch + hfov2) / 180 * Math.PI)));
                } else {
                    hoffcut = hfov2 * (1 - Math.min(Math.cos((config.pitch - vfov2) / 180 * Math.PI),
                                                    Math.cos((config.pitch + vfov2) / 180 * Math.PI)));
                }
            }
    
            // Ensure the yaw is within min and max allowed
            var yawRange = config.maxYaw - config.minYaw,
                minYaw = -180,
                maxYaw = 180;
            if (yawRange < 360) {
                minYaw = config.minYaw + config.hfov / 2 + hoffcut;
                maxYaw = config.maxYaw - config.hfov / 2 - hoffcut;
                if (yawRange < config.hfov) {
                    // Lock yaw to average of min and max yaw when both can be seen at once
                    minYaw = maxYaw = (minYaw + maxYaw) / 2;
                }
                config.yaw = Math.max(minYaw, Math.min(maxYaw, config.yaw));
            }
            
            if (!(config.autoRotate !== false)) {
                // When not auto-rotating, this check needs to happen after the
                // previous check (see issue #698)
                if (config.yaw > 360) {
                    config.yaw -= 360;
                } else if (config.yaw < -360) {
                    config.yaw += 360;
                }
            }
    
            // Check if we autoRotate in a limited by min and max yaw
            // If so reverse direction
            if (config.autoRotate !== false && tmpyaw != config.yaw &&
                prevTime !== undefined) { // this condition prevents changing the direction initially
                config.autoRotate *= -1;
            }
    
            // Ensure the calculated pitch is within min and max allowed
            var vfov = 2 * Math.atan(Math.tan(config.hfov / 180 * Math.PI * 0.5) /
                (canvas.width / canvas.height)) / Math.PI * 180;
            var minPitch = config.minPitch + vfov / 2,
                maxPitch = config.maxPitch - vfov / 2;
            var pitchRange = config.maxPitch - config.minPitch;
            if (pitchRange < vfov) {
                // Lock pitch to average of min and max pitch when both can be seen at once
                minPitch = maxPitch = (minPitch + maxPitch) / 2;
            }
            if (isNaN(minPitch))
                minPitch = -90;
            if (isNaN(maxPitch))
                maxPitch = 90;
            config.pitch = Math.max(minPitch, Math.min(maxPitch, config.pitch));
            
            renderer.render(config.pitch * Math.PI / 180, config.yaw * Math.PI / 180, config.hfov * Math.PI / 180, {roll: config.roll * Math.PI / 180, dynamic: update});
            if (updateOnce)
                updateOnce = update = false;
            
            renderHotSpots();
            
            // Update compass
            if (config.compass) {
                compass.style.transform = 'rotate(' + (-config.yaw - config.northOffset) + 'deg)';
                compass.style.webkitTransform = 'rotate(' + (-config.yaw - config.northOffset) + 'deg)';
            }
        }
    }
    
    /**
     * Creates a new quaternion.
     * @private
     * @constructor
     * @param {Number} w - W value
     * @param {Number} x - X value
     * @param {Number} y - Y value
     * @param {Number} z - Z value
     */
    function Quaternion(w, x, y, z) {
        this.w = w;
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    /**
     * Multiplies quaternions.
     * @private
     * @param {Quaternion} q - Quaternion to multiply
     * @returns {Quaternion} Result of multiplication
     */
    Quaternion.prototype.multiply = function(q) {
        return new Quaternion(this.w*q.w - this.x*q.x - this.y*q.y - this.z*q.z,
                              this.x*q.w + this.w*q.x + this.y*q.z - this.z*q.y,
                              this.y*q.w + this.w*q.y + this.z*q.x - this.x*q.z,
                              this.z*q.w + this.w*q.z + this.x*q.y - this.y*q.x);
    };
    
    /**
     * Converts quaternion to Euler angles.
     * @private
     * @returns {Number[]} [phi angle, theta angle, psi angle]
     */
    Quaternion.prototype.toEulerAngles = function() {
        var phi = Math.atan2(2 * (this.w * this.x + this.y * this.z),
                             1 - 2 * (this.x * this.x + this.y * this.y)),
            theta = Math.asin(2 * (this.w * this.y - this.z * this.x)),
            psi = Math.atan2(2 * (this.w * this.z + this.x * this.y),
                             1 - 2 * (this.y * this.y + this.z * this.z));
        return [phi, theta, psi];
    };
    
    /**
     * Converts device orientation API Tait-Bryan angles to a quaternion.
     * @private
     * @param {Number} alpha - Alpha angle (in degrees)
     * @param {Number} beta - Beta angle (in degrees)
     * @param {Number} gamma - Gamma angle (in degrees)
     * @returns {Quaternion} Orientation quaternion
     */
    function taitBryanToQuaternion(alpha, beta, gamma) {
        var r = [beta ? beta * Math.PI / 180 / 2 : 0,
                 gamma ? gamma * Math.PI / 180 / 2 : 0,
                 alpha ? alpha * Math.PI / 180 / 2 : 0];
        var c = [Math.cos(r[0]), Math.cos(r[1]), Math.cos(r[2])],
            s = [Math.sin(r[0]), Math.sin(r[1]), Math.sin(r[2])];
    
        return new Quaternion(c[0]*c[1]*c[2] - s[0]*s[1]*s[2],
                              s[0]*c[1]*c[2] - c[0]*s[1]*s[2],
                              c[0]*s[1]*c[2] + s[0]*c[1]*s[2],
                              c[0]*c[1]*s[2] + s[0]*s[1]*c[2]);
    }
    
    /**
     * Computes current device orientation quaternion from device orientation API
     * Tait-Bryan angles.
     * @private
     * @param {Number} alpha - Alpha angle (in degrees)
     * @param {Number} beta - Beta angle (in degrees)
     * @param {Number} gamma - Gamma angle (in degrees)
     * @returns {Quaternion} Orientation quaternion
     */
    function computeQuaternion(alpha, beta, gamma) {
        // Convert Tait-Bryan angles to quaternion
        var quaternion = taitBryanToQuaternion(alpha, beta, gamma);
        // Apply world transform
        quaternion = quaternion.multiply(new Quaternion(Math.sqrt(0.5), -Math.sqrt(0.5), 0, 0));
        // Apply screen transform
        var angle = window.orientation ? -window.orientation * Math.PI / 180 / 2 : 0;
        return quaternion.multiply(new Quaternion(Math.cos(angle), 0, -Math.sin(angle), 0));
    }
    
    /**
     * Event handler for device orientation API. Controls pointing.
     * @private
     * @param {DeviceOrientationEvent} event - Device orientation event.
     */
    function orientationListener(e) {
        var q = computeQuaternion(e.alpha, e.beta, e.gamma).toEulerAngles();
        if (typeof(orientation) == 'number' && orientation < 10) {
            // This kludge is necessary because iOS sometimes provides a few stale
            // device orientation events when the listener is removed and then
            // readded. Thus, we skip the first 10 events to prevent this from
            // causing problems.
            orientation += 1;
        } else if (orientation === 10) {
            // Record starting yaw to prevent jumping
            orientationYawOffset = q[2] / Math.PI * 180 + config.yaw;
            orientation = true;
            requestAnimationFrame(animate);
        } else {
            config.pitch = q[0] / Math.PI * 180;
            config.roll = -q[1] / Math.PI * 180;
            config.yaw = -q[2] / Math.PI * 180 + orientationYawOffset;
        }
    }
    
    /**
     * Initializes renderer.
     * @private
     */
    function renderInit() {
        try {
            var params = {};
            if (config.horizonPitch !== undefined)
                params.horizonPitch = config.horizonPitch * Math.PI / 180;
            if (config.horizonRoll !== undefined)
                params.horizonRoll = config.horizonRoll * Math.PI / 180;
            if (config.backgroundColor !== undefined)
                params.backgroundColor = config.backgroundColor;
            renderer.init(panoImage, config.type, config.haov * Math.PI / 180, config.vaov * Math.PI / 180, config.vOffset * Math.PI / 180, renderInitCallback, params);
        } catch(event) {
            // Panorama not loaded
    
            if (config.dynamic !== true) {
                // Allow image to be garbage collected
                panoImage = undefined;
            }
    
            // Display error if there is a bad texture
            if (event.type == 'webgl error' || event.type == 'no webgl') {
                anError();
            } else if (event.type == 'webgl size error') {
                anError(config.strings.textureSizeError.replace('%s', event.width).replace('%s', event.maxWidth));
            } else {
                anError(config.strings.unknownError);
                throw event;
            }
        }
    }
    
    /**
     * Triggered when render initialization finishes. Handles fading between
     * scenes as well as showing the compass and hot spots and hiding the loading
     * display.
     * @private
     */
    function renderInitCallback() {
        // Fade if specified
        if (config.sceneFadeDuration && renderer.fadeImg !== undefined) {
            renderer.fadeImg.style.opacity = 0;
            // Remove image
            var fadeImg = renderer.fadeImg;
            delete renderer.fadeImg;
            setTimeout(function() {
                renderContainer.removeChild(fadeImg);
                fireEvent('scenechangefadedone');
            }, config.sceneFadeDuration);
        }
        
        // Show compass if applicable
        if (config.compass) {
            compass.style.display = 'inline';
        } else {
            compass.style.display = 'none';
        }
        
        // Show hotspots
        createHotSpots();
        
        // Hide loading display
        infoDisplay.load.box.style.display = 'none';
        if (preview !== undefined) {
            renderContainer.removeChild(preview);
            preview = undefined;
        }
        loaded = true;
    
        if (config.dynamic !== true) {
            // Allow image to be garbage collected
            panoImage = undefined;
        }
        
        animateInit();
    
        fireEvent('load');
    }
    
    /**
     * Creates hot spot element for the current scene.
     * @private
     * @param {Object} hs - The configuration for the hot spot
     */
    function createHotSpot(hs) {
        // Make sure hot spot pitch and yaw are numbers
        hs.pitch = Number(hs.pitch) || 0;
        hs.yaw = Number(hs.yaw) || 0;
    
        var div = document.createElement('div');

        /**
         * Title: Create border for hotspot
         * Position: function createHotSpot
         * Date Created: 2024/01/31
         * Author: Hydro
         */
        if (config.huiStatus === 'editor') {
            let borderHotspot = document.createElement('p');
            borderHotspot.className = 'vi-hui-border-hotspot';
            div.appendChild(borderHotspot);
        }

        if (hs.hy_opacity) {
            div.style.opacity = hs.hy_opacity;
        }
        if (hs.hy_dimension) {
            div.style.height = hs.hy_dimension + 'px';
            div.style.width = hs.hy_dimension + 'px';
        }

        div.tabIndex = -1;
        div.className = 'pnlm-hotspot-base';
        if (hs.cssClass)
            div.className += ' ' + hs.cssClass;
        else
            div.className += ' pnlm-hotspot pnlm-sprite pnlm-' + escapeHTML(hs.type);
    
        var span = document.createElement('span');
        if (hs.text)
            span.innerHTML = escapeHTML(hs.text);
    
        var a;
        if (hs.video) {
            var video = document.createElement('video'),
                vidp = hs.video;
            if (config.basePath && !absoluteURL(vidp))
                vidp = config.basePath + vidp;
            video.src = sanitizeURL(vidp);
            video.controls = true;
            video.style.width = hs.width + 'px';
            uiContainer.appendChild(div);
            span.appendChild(video);
        } else if (hs.image) {
            /**
                * Title: Custom render element
                * Position: function createHotSpot
                * Date Created: 2024/01/26
                * Author: Hydro
            */
            var imgp = hs.image;
            if (config.basePath && !absoluteURL(imgp))
                imgp = config.basePath + imgp;

            if( config.huiStatus === 'editor') {
                a = document.createElement('div');
                a.dataset.href = sanitizeURL(hs.URL ? hs.URL : imgp, true);
            }else {
                a = document.createElement('a');
                a.href = sanitizeURL(hs.URL ? hs.URL : imgp, true);
                if (config.targetBlank) {
                    a.target = '_blank';
                    a.rel = 'noopener';
                }
            }
            
            span.appendChild(a);
            var image = document.createElement('img');
            image.src = sanitizeURL(imgp);
            image.style.width = hs.width + 'px';
            image.style.paddingTop = '5px';
            uiContainer.appendChild(div);
            a.appendChild(image);
            span.style.maxWidth = 'initial';
        } else if (hs.URL) {
            /**
                * Title: Custom render element
                * Position: function createHotSpot
                * Date Created: 2024/01/26
                * Author: Hydro
            */
            if( config.huiStatus === 'editor') {
                a = document.createElement('div');
                a.dataset.href = sanitizeURL(hs.URL, true);
                if (hs.attributes) {
                    for (var key in hs.attributes) {
                        a.setAttribute(key, hs.attributes[key]);
                    }
                }
            }else {
                a = document.createElement('a');
                a.href = sanitizeURL(hs.URL, true);
                if (hs.attributes) {
                    for (var key in hs.attributes) {
                        a.setAttribute(key, hs.attributes[key]);
                    }
                } else if (config.targetBlank) {
                    a.target = '_blank';
                    a.rel = 'noopener';
                }
            }

            uiContainer.appendChild(a);
            div.className += ' pnlm-pointer';
            span.className += ' pnlm-pointer';
            a.appendChild(div);

        } else {
            if (hs.sceneId) {
                div.onclick = div.ontouchend = function() {
                    if (!div.clicked) {
                        div.clicked = true;
                        // Default code of library
                        // loadScene(hs.sceneId, hs.targetPitch, hs.targetYaw, hs.targetHfov);
                        
                        /**
                         * Title: Custom effect move over scene
                         * Position: function createHotSpot
                         * Date Created: 2024/01/24
                         * Author: Hydro
                         */
                        // Custom code start
                        if (config.huiStatus !== 'editor') {
                            _this.setHfov(_this.getHfov() - 120);
                            _this.lookAt(hs.pitch, hs.yaw, _this.getConfig.minHfov, 800);
                            setTimeout( function() {
                                loadScene(hs.sceneId, hs.targetPitch, hs.targetYaw, hs.targetHfov);
                            }, 800 );
                        }
                        // Custom code end
                    }
                    return false;
                };
                div.className += ' pnlm-pointer';
                span.className += ' pnlm-pointer';
            }
            uiContainer.appendChild(div);
        }
    
        if (hs.createTooltipFunc) {
            hs.createTooltipFunc(div, hs.createTooltipArgs);
        } else if (hs.text || hs.video || hs.image) {
            div.classList.add('pnlm-tooltip');
            div.appendChild(span);
            span.style.width = span.scrollWidth - 20 + 'px';
            span.style.marginLeft = -(span.scrollWidth - div.offsetWidth) / 2 + 'px';
            span.style.marginTop = -span.scrollHeight - 12 + 'px';
        }
        if (hs.clickHandlerFunc) {
            div.addEventListener('click', function(e) {
                hs.clickHandlerFunc(e, hs.clickHandlerArgs);
            }, 'false');
            if (document.documentElement.style.pointerAction === '' &&
                document.documentElement.style.touchAction === '') {
                div.addEventListener('pointerup', function(e) {
                    hs.clickHandlerFunc(e, hs.clickHandlerArgs);
                }, false);
            } else {
                div.addEventListener('touchend', function(e) {
                    hs.clickHandlerFunc(e, hs.clickHandlerArgs);
                }, false);
            }
            div.className += ' pnlm-pointer';
            span.className += ' pnlm-pointer';
        }
        if (hs.draggable) {
            // Handle mouse by container event listeners
            div.addEventListener('mousedown', function (e) {
                if (hs.dragHandlerFunc)
                    hs.dragHandlerFunc(e, hs.dragHandlerArgs);
                draggingHotSpot = hs;
            });
    
            if (document.documentElement.style.pointerAction === '' &&
                document.documentElement.style.touchAction === '') {
                div.addEventListener('pointerdown', function (e) {
                    if (hs.dragHandlerFunc)
                        hs.dragHandlerFunc(e, hs.dragHandlerArgs);
                    draggingHotSpot = hs;
                });
            }
    
            // Handle touch events by hotspot event listener
            div.addEventListener('touchmove', function(e) {
                moveHotSpot(hs, e.targetTouches[0]);
            });
            div.addEventListener('touchend', function (e) {
                if (hs.dragHandlerFunc)
                    hs.dragHandlerFunc(e, hs.dragHandlerArgs);
                draggingHotSpot = null;
            })
        }
        
        hs.div = div;
    }
    
    /**
     * Moves a curently displayed hot spot.
     * @private
     * @param {Object} hs - Hot spot to move.
     * @param {MouseEvent} event - Mouse event to get coordinates from.
     */
    function moveHotSpot(hs, event){
        var coords = mouseEventToCoords(event);
        hs.pitch = coords[0];
        hs.yaw = coords[1];
        renderHotSpot(hs);
    };
    
    /**
     * Creates hot spot elements for the current scene.
     * @private
     */
    function createHotSpots() {
        if (hotspotsCreated) return;
    
        if (!config.hotSpots) {
            config.hotSpots = [];
        } else {
            // Sort by pitch so tooltip is never obscured by another hot spot
            config.hotSpots = config.hotSpots.sort(function(a, b) {
                return a.pitch < b.pitch;
            });
            config.hotSpots.forEach(createHotSpot);
        }
        hotspotsCreated = true;
        renderHotSpots();
    }
    
    /**
     * Destroys currently created hot spot elements.
     * @private
     */
    function destroyHotSpots() {
        var hs = config.hotSpots;
        hotspotsCreated = false;
        delete config.hotSpots;
        if (hs) {
            for (var i = 0; i < hs.length; i++) {
                var current = hs[i].div;
                if (current) {
                    while (current.parentNode && current.parentNode != uiContainer) {
                        current = current.parentNode;
                    }
                    uiContainer.removeChild(current);
                }
                delete hs[i].div;
            }
        }
    }
    
    /**
     * Renders hot spot, updating its position and visibility.
     * @private
     */
    function renderHotSpot(hs) {
        var hsPitchSin = Math.sin(hs.pitch * Math.PI / 180),
            hsPitchCos = Math.cos(hs.pitch * Math.PI / 180),
            configPitchSin = Math.sin(config.pitch * Math.PI / 180),
            configPitchCos = Math.cos(config.pitch * Math.PI / 180),
            yawCos = Math.cos((-hs.yaw + config.yaw) * Math.PI / 180);
        var z = hsPitchSin * configPitchSin + hsPitchCos * yawCos * configPitchCos;
        if ((hs.yaw <= 90 && hs.yaw > -90 && z <= 0) ||
          ((hs.yaw > 90 || hs.yaw <= -90) && z <= 0)) {
            hs.div.style.visibility = 'hidden';
        } else {
            var yawSin = Math.sin((-hs.yaw + config.yaw) * Math.PI / 180),
                hfovTan = Math.tan(config.hfov * Math.PI / 360);
            hs.div.style.visibility = 'visible';
            // Subpixel rendering doesn't work in Firefox
            // https://bugzilla.mozilla.org/show_bug.cgi?id=739176
            var canvas = renderer.getCanvas(),
                canvasWidth = canvas.clientWidth,
                canvasHeight = canvas.clientHeight;
            var coord = [-canvasWidth / hfovTan * yawSin * hsPitchCos / z / 2,
                -canvasWidth / hfovTan * (hsPitchSin * configPitchCos -
                hsPitchCos * yawCos * configPitchSin) / z / 2];
            // Apply roll
            var rollSin = Math.sin(config.roll * Math.PI / 180),
                rollCos = Math.cos(config.roll * Math.PI / 180);
            coord = [coord[0] * rollCos - coord[1] * rollSin,
                     coord[0] * rollSin + coord[1] * rollCos];
            // Apply transform
            coord[0] += (canvasWidth - hs.div.offsetWidth) / 2;
            coord[1] += (canvasHeight - hs.div.offsetHeight) / 2;
            var transform = 'translate(' + coord[0] + 'px, ' + coord[1] +
                'px) translateZ(9999px) rotate(' + config.roll + 'deg)';
            if (hs.scale) {
                if (typeof hs.scale == 'number')
                    transform += ' scale(' + hs.scale + ')';
                else
                    transform += ' scale(' + (origHfov/config.hfov) / z + ')';
            }
            hs.div.style.webkitTransform = transform;
            hs.div.style.MozTransform = transform;
            hs.div.style.transform = transform;
        }
    }
    
    /**
     * Renders hot spots, updating their positions and visibility.
     * @private
     */
    function renderHotSpots() {
        config.hotSpots.forEach(renderHotSpot);
    }
    
    /**
     * Merges a scene configuration into the current configuration.
     * @private
     * @param {string} sceneId - Identifier of scene configuration to merge in.
     */
    function mergeConfig(sceneId) {
        config = {};
        var k, s;
        var photoSphereExcludes = ['haov', 'vaov', 'vOffset', 'northOffset', 'horizonPitch', 'horizonRoll'];
        specifiedPhotoSphereExcludes = [];
        
        // Merge default config
        for (k in defaultConfig) {
            if (defaultConfig.hasOwnProperty(k)) {
                config[k] = defaultConfig[k];
            }
        }
        
        // Merge default scene config
        for (k in initialConfig.default) {
            if (initialConfig.default.hasOwnProperty(k)) {
                if (k == 'strings') {
                    for (s in initialConfig.default.strings) {
                        if (initialConfig.default.strings.hasOwnProperty(s)) {
                            config.strings[s] = escapeHTML(initialConfig.default.strings[s]);
                        }
                    }
                } else {
                    config[k] = initialConfig.default[k];
                    if (photoSphereExcludes.indexOf(k) >= 0) {
                        specifiedPhotoSphereExcludes.push(k);
                    }
                }
            }
        }
        
        // Merge current scene config
        if ((sceneId !== null) && (sceneId !== '') && (initialConfig.scenes) && (initialConfig.scenes[sceneId])) {
            var scene = initialConfig.scenes[sceneId];
            for (k in scene) {
                if (scene.hasOwnProperty(k)) {
                    if (k == 'strings') {
                        for (s in scene.strings) {
                            if (scene.strings.hasOwnProperty(s)) {
                                config.strings[s] = escapeHTML(scene.strings[s]);
                            }
                        }
                    } else {
                        config[k] = scene[k];
                        if (photoSphereExcludes.indexOf(k) >= 0) {
                            specifiedPhotoSphereExcludes.push(k);
                        }
                    }
                }
            }
            config.scene = sceneId;
        }
        
        // Merge initial config
        for (k in initialConfig) {
            if (initialConfig.hasOwnProperty(k)) {
                if (k == 'strings') {
                    for (s in initialConfig.strings) {
                        if (initialConfig.strings.hasOwnProperty(s)) {
                            config.strings[s] = escapeHTML(initialConfig.strings[s]);
                        }
                    }
                } else {
                    config[k] = initialConfig[k];
                    if (photoSphereExcludes.indexOf(k) >= 0) {
                        specifiedPhotoSphereExcludes.push(k);
                    }
                }
            }
        }
    }
    
    /**
     * Processes configuration options.
     * @param {boolean} [isPreview] - Whether or not the preview is being displayed
     * @private
     */
    function processOptions(isPreview) {
        isPreview = isPreview ? isPreview : false;
    
        // Process preview first so it always loads before the browser hits its
        // maximum number of connections to a server as can happen with cubic
        // panoramas
        if (isPreview && 'preview' in config) {
            var p = config.preview;
            if (config.basePath && !absoluteURL(p))
                p = config.basePath + p;
            preview = document.createElement('div');
            preview.className = 'pnlm-preview-img';
            preview.style.backgroundImage = "url('" + sanitizeURLForCss(p) + "')";
            renderContainer.appendChild(preview);
        }
    
        // Handle different preview values
        var title = config.title,
            author = config.author;
        if (isPreview) {
            if ('previewTitle' in config)
                config.title = config.previewTitle;
            if ('previewAuthor' in config)
                config.author = config.previewAuthor;
        }
    
        // Reset title / author display
        if (!config.hasOwnProperty('title'))
            infoDisplay.title.innerHTML = '';
        if (!config.hasOwnProperty('author'))
            infoDisplay.author.innerHTML = '';
        if (!config.hasOwnProperty('title') && !config.hasOwnProperty('author'))
            infoDisplay.container.style.display = 'none';
        if (config.targetBlank) {
            aboutMsgLink.rel = 'noopener';
            aboutMsgLink.target = '_blank';
        }
    
        // Fill in load button label and loading box text
        controls.load.innerHTML = '<div><p>' + config.strings.loadButtonLabel + '</p></div>';
        infoDisplay.load.boxp.innerHTML = config.strings.loadingLabel;
    
        // Process other options
        for (var key in config) {
          if (config.hasOwnProperty(key)) {
            switch(key) {
                case 'title':
                    infoDisplay.title.innerHTML = escapeHTML(config[key]);
                    infoDisplay.container.style.display = 'inline';
                    break;
                
                case 'author':
                    var authorText = escapeHTML(config[key]);
                    if (config.authorURL) {
                        var authorLink = document.createElement('a');
                        authorLink.href = sanitizeURL(config['authorURL'], true);
                        if (config.targetBlank) {
                            authorLink.target = '_blank';
                            authorLink.rel = 'noopener';
                        }
                        authorLink.innerHTML = escapeHTML(config[key]);
                        authorText = authorLink.outerHTML;
                    }
                    infoDisplay.author.innerHTML = config.strings.bylineLabel.replace('%s', authorText);
                    infoDisplay.container.style.display = 'inline';
                    break;
                
                case 'hfov':
                    setHfov(Number(config[key]));
                    break;
                
                case 'autoLoad':
                    if (config[key] === true && renderer === undefined) {
                        // Show loading box
                        infoDisplay.load.box.style.display = 'inline';
                        // Hide load button
                        controls.load.style.display = 'none';
                        // Initialize
                        init();
                    }
                    break;
                
                case 'showZoomCtrl':
                    if (config[key] && config.showControls != false) {
                        // Show zoom controls
                        controls.zoom.style.display = 'block';
                    } else {
                        // Hide zoom controls
                        controls.zoom.style.display = 'none';
                    }
                    break;
    
                case 'showFullscreenCtrl':
                    if (config[key] && config.showControls != false && ('fullscreen' in document || 'mozFullScreen' in document ||
                        'webkitIsFullScreen' in document || 'msFullscreenElement' in document)) {
                        
                        // Show fullscreen control
                        controls.fullscreen.style.display = 'block';
                    } else {
                        // Hide fullscreen control
                        controls.fullscreen.style.display = 'none';
                    }
                    break;
    
                case 'hotSpotDebug':
                    if (config[key])
                        hotSpotDebugIndicator.style.display = 'block';
                    else
                        hotSpotDebugIndicator.style.display = 'none';
                    break;
    
                case 'showControls':
                    if (!config[key]) {
                        controls.orientation.style.display = 'none';
                        controls.zoom.style.display = 'none';
                        controls.fullscreen.style.display = 'none';
                    }
                    break;
    
                case 'orientationOnByDefault':
                    if (config[key])
                        startOrientation();
                    break;
            }
          }
        }
    
        if (isPreview) {
            // Restore original values if changed for preview
            if (title)
                config.title = title;
            else
                delete config.title;
            if (author)
                config.author = author;
            else
                delete config.author;
        }
    }
    
    /**
     * Toggles fullscreen mode.
     * @private
     */
    function toggleFullscreen() {
        if (loaded && !error) {
            if (!fullscreenActive) {
                try {
                    if (container.requestFullscreen) {
                        container.requestFullscreen();
                    } else if (container.mozRequestFullScreen) {
                        container.mozRequestFullScreen();
                    } else if (container.msRequestFullscreen) {
                        container.msRequestFullscreen();
                    } else {
                        container.webkitRequestFullScreen();
                    }
                } catch(event) {
                    // Fullscreen doesn't work
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitCancelFullScreen) {
                    document.webkitCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        }
    }
    
    /**
     * Event handler for fullscreen changes.
     * @private
     */
    function onFullScreenChange(resize) {
        if (document.fullscreenElement || document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen || document.msFullscreenElement) {
            controls.fullscreen.classList.add('pnlm-fullscreen-toggle-button-active');
            fullscreenActive = true;
        } else {
            controls.fullscreen.classList.remove('pnlm-fullscreen-toggle-button-active');
            fullscreenActive = false;
        }
        if (resize !== 'resize')
            fireEvent('fullscreenchange', fullscreenActive);
        // Resize renderer (deal with browser quirks and fixes #155)
        renderer.resize();
        setHfov(config.hfov);
        animateInit();
    }
    
    /**
     * Increases panorama zoom. For use with zoom button.
     * @private
     */
    function zoomIn() {
        if (loaded) {
            setHfov(config.hfov - 5);
            animateInit();
        }
    }
    
    /**
     * Decreases panorama zoom. For use with zoom button.
     * @private
     */
    function zoomOut() {
        if (loaded) {
            setHfov(config.hfov + 5);
            animateInit();
        }
    }
    
    /**
     * Clamps horizontal field of view to viewer's limits.
     * @private
     * @param {number} hfov - Input horizontal field of view (in degrees)
     * @return {number} - Clamped horizontal field of view (in degrees)
     */
    function constrainHfov(hfov) {
        // Keep field of view within bounds
        var minHfov = config.minHfov;
        if (config.type == 'multires' && renderer && !config.multiResMinHfov) {
            minHfov = Math.min(minHfov, renderer.getCanvas().width / (config.multiRes.cubeResolution / 90 * 0.9));
        }
        if (minHfov > config.maxHfov) {
            // Don't change view if bounds don't make sense
            console.log('HFOV bounds do not make sense (minHfov > maxHfov).');
            return config.hfov;
        }
        var newHfov = config.hfov;
        if (hfov < minHfov) {
            newHfov = minHfov;
        } else if (hfov > config.maxHfov) {
            newHfov = config.maxHfov;
        } else {
            newHfov = hfov;
        }
        // Optionally avoid showing background (empty space) on top or bottom by adapting newHfov
        if (config.avoidShowingBackground && renderer && !isNaN(config.maxPitch - config.minPitch)) {
            var canvas = renderer.getCanvas();
            newHfov = Math.min(newHfov,
                               Math.atan(Math.tan((config.maxPitch - config.minPitch) / 360 * Math.PI) /
                                         canvas.height * canvas.width) * 360 / Math.PI);
        }
        return newHfov;
    }
    
    /**
     * Sets viewer's horizontal field of view.
     * @private
     * @param {number} hfov - Desired horizontal field of view in degrees.
     */
    function setHfov(hfov) {
        config.hfov = constrainHfov(hfov);
        fireEvent('zoomchange', config.hfov);
    }
    
    /**
     * Stops auto rotation and animated moves.
     * @private
     */
    function stopAnimation() {
        animatedMove = {};
        autoRotateSpeed = config.autoRotate ? config.autoRotate : autoRotateSpeed;
        config.autoRotate = false;
    }
    
    /**
     * Loads panorama.
     * @private
     */
    function load() {
        // Since WebGL error handling is very general, first we clear any error box
        // since it is a new scene and the error from previous maybe because of lacking
        // memory etc and not because of a lack of WebGL support etc
        clearError();
        loaded = false;
    
        clearInteractionMessage();
        controls.load.style.display = 'none';
        infoDisplay.load.box.style.display = 'inline';
        init();
    }
    
    /**
     * Loads scene.
     * @private
     * @param {string} sceneId - Identifier of scene configuration to merge in.
     * @param {number} targetPitch - Pitch viewer should be centered on once scene loads.
     * @param {number} targetYaw - Yaw viewer should be centered on once scene loads.
     * @param {number} targetHfov - HFOV viewer should use once scene loads.
     * @param {boolean} [fadeDone] - If `true`, fade setup is skipped.
     */
    function loadScene(sceneId, targetPitch, targetYaw, targetHfov, fadeDone) {
        if (!loaded)
            fadeDone = true;    // Don't try to fade when there isn't a scene loaded
        loaded = false;
        animatedMove = {};
        
        // Set up fade if specified
        var fadeImg, workingPitch, workingYaw, workingHfov;
        if (config.sceneFadeDuration && !fadeDone) {
            var data = renderer.render(config.pitch * Math.PI / 180, config.yaw * Math.PI / 180, config.hfov * Math.PI / 180, {returnImage: 'ImageBitmap'});
            if (data !== undefined) {
                if (data.then)
                    fadeImg = document.createElement('canvas');
                else
                    fadeImg = new Image(); // ImageBitmap isn't supported
                fadeImg.className = 'pnlm-fade-img';
                fadeImg.style.transition = 'opacity ' + (config.sceneFadeDuration / 1000) + 's';
                fadeImg.style.width = '100%';
                fadeImg.style.height = '100%';
                if (data.then) {
                    data.then(function(img) {
                        fadeImg.width = img.width;
                        fadeImg.height = img.height;
                        fadeImg.getContext('2d').drawImage(img, 0, 0);
                        loadScene(sceneId, targetPitch, targetYaw, targetHfov, true);
                    });
                } else {
                    fadeImg.onload = function() {
                        loadScene(sceneId, targetPitch, targetYaw, targetHfov, true);
                    };
                    fadeImg.src = data;
                }
                renderContainer.appendChild(fadeImg);
                renderer.fadeImg = fadeImg;
                return;
            }
        }
        
        // Set new pointing
        if (targetPitch === 'same') {
            workingPitch = config.pitch;
        } else {
            workingPitch = targetPitch;
        }
        if (targetYaw === 'same') {
            workingYaw = config.yaw;
        } else if (targetYaw === 'sameAzimuth') {
            workingYaw = config.yaw + (config.northOffset || 0) - (initialConfig.scenes[sceneId].northOffset || 0);
        } else {
            workingYaw = targetYaw;
        }
        if (targetHfov === 'same') {
            workingHfov = config.hfov;
        } else {
            workingHfov = targetHfov;
        }
        
        // Destroy hot spots from previous scene
        destroyHotSpots();
        
        // Create the new config for the scene
        mergeConfig(sceneId);
    
        // Stop motion
        speed.yaw = speed.pitch = speed.hfov = 0;
    
        // Reload scene
        processOptions();
        if (workingPitch !== undefined) {
            config.pitch = workingPitch;
        }
        if (workingYaw !== undefined) {
            config.yaw = workingYaw;
        }
        if (workingHfov !== undefined) {
            config.hfov = workingHfov;
        }
        fireEvent('scenechange', sceneId);
        load();
    }
    
    /**
     * Stop using device orientation.
     * @private
     */
    function stopOrientation() {
        window.removeEventListener('deviceorientation', orientationListener);
        controls.orientation.classList.remove('pnlm-orientation-button-active');
        orientation = false;
    }
    
    /**
     * Start using device orientation.
     * @private
     */
    function startOrientation() {
        if (!orientationSupport)
            return;
        if (typeof DeviceMotionEvent !== 'undefined' &&
            typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission().then(function(response) {
                if (response == 'granted') {
                    orientation = 1;
                    window.addEventListener('deviceorientation', orientationListener);
                    controls.orientation.classList.add('pnlm-orientation-button-active');
                }
            });
        } else {
            orientation = 1;
            window.addEventListener('deviceorientation', orientationListener);
            controls.orientation.classList.add('pnlm-orientation-button-active');
        }
    }
    
    /**
     * Escapes HTML string (to mitigate possible DOM XSS attacks).
     * @private
     * @param {string} s - String to escape
     * @returns {string} Escaped string
     */
    function escapeHTML(s) {
        if (!initialConfig.escapeHTML)
            return String(s).split('\n').join('<br>');
        return String(s).split(/&/g).join('&amp;')
            .split('"').join('&quot;')
            .split("'").join('&#39;')
            .split('<').join('&lt;')
            .split('>').join('&gt;')
            .split('/').join('&#x2f;')
            .split('\n').join('<br>');  // Allow line breaks
    }
    
    /**
     * Removes possibility of XSS attacks with URLs.
     * The URL cannot be of protocol 'javascript'.
     * @private
     * @param {string} url - URL to sanitize
     * @param {boolean} href - True if URL is for link (blocks data URIs)
     * @returns {string} Sanitized URL
     */
    function sanitizeURL(url, href) {
        try {
            var decoded_url = decodeURIComponent(unescape(url)).replace(/[^\w:]/g, '').toLowerCase();
        } catch (e) {
            return 'about:blank';
        }
        if (decoded_url.indexOf('javascript:') === 0 ||
            decoded_url.indexOf('vbscript:') === 0) {
            console.log('Script URL removed.');
            return 'about:blank';
        }
        if (href && decoded_url.indexOf('data:') === 0) {
            console.log('Data URI removed from link.');
            return 'about:blank';
        }
        return url;
    }
    
    /**
     * Unescapes HTML entities.
     * Copied from Marked.js 0.7.0.
     * @private
     * @param {string} url - URL to sanitize
     * @param {boolean} href - True if URL is for link (blocks data URIs)
     * @returns {string} Sanitized URL
     */
    function unescape(html) {
        // Explicitly match decimal, hex, and named HTML entities
        return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, function(_, n) {
            n = n.toLowerCase();
            if (n === 'colon') return ':';
            if (n.charAt(0) === '#') {
                return n.charAt(1) === 'x'
                    ? String.fromCharCode(parseInt(n.substring(2), 16))
                    : String.fromCharCode(+n.substring(1));
            }
            return '';
        });
    }
    
    /**
     * Removes possibility of XSS attacks with URLs for CSS.
     * The URL will be sanitized with `sanitizeURL()` and single quotes
     * and double quotes escaped.
     * @private
     * @param {string} url - URL to sanitize
     * @returns {string} Sanitized URL
     */
    function sanitizeURLForCss(url) {
        return sanitizeURL(url)
            .replace(/"/g, '%22')
            .replace(/'/g, '%27');
    }
    
    /**
     * Checks whether or not a panorama is loaded.
     * @memberof Viewer
     * @instance
     * @returns {boolean} `true` if a panorama is loaded, else `false`
     */
    this.isLoaded = function() {
        return Boolean(loaded);
    };
    
    /**
     * Returns the pitch of the center of the view.
     * @memberof Viewer
     * @instance
     * @returns {number} Pitch in degrees
     */
    this.getPitch = function() {
        return config.pitch;
    };
    
    /**
     * Sets the pitch of the center of the view.
     * @memberof Viewer
     * @instance
     * @param {number} pitch - Pitch in degrees
     * @param {boolean|number} [animated=1000] - Animation duration in milliseconds or false for no animation
     * @param {function} [callback] - Function to call when animation finishes
     * @param {object} [callbackArgs] - Arguments to pass to callback function
     * @returns {Viewer} `this`
     */
    this.setPitch = function(pitch, animated, callback, callbackArgs) {
        latestInteraction = Date.now();
        if (Math.abs(pitch - config.pitch) <= eps) {
            if (typeof callback == 'function')
                callback(callbackArgs);
            return this;
        }
        animated = animated == undefined ? 1000: Number(animated);
        if (animated) {
            animatedMove.pitch = {
                'startTime': Date.now(),
                'startPosition': config.pitch,
                'endPosition': pitch,
                'duration': animated
            };
            if (typeof callback == 'function')
                setTimeout(function(){callback(callbackArgs);}, animated);
        } else {
            config.pitch = pitch;
        }
        animateInit();
        return this;
    };
    
    /**
     * Returns the minimum and maximum allowed pitches (in degrees).
     * @memberof Viewer
     * @instance
     * @returns {number[]} [minimum pitch, maximum pitch]
     */
    this.getPitchBounds = function() {
        return [config.minPitch, config.maxPitch];
    };
    
    /**
     * Set the minimum and maximum allowed pitches (in degrees).
     * @memberof Viewer
     * @instance
     * @param {number[]} bounds - [minimum pitch, maximum pitch]
     * @returns {Viewer} `this`
     */
    this.setPitchBounds = function(bounds) {
        config.minPitch = Math.max(-90, Math.min(bounds[0], 90));
        config.maxPitch = Math.max(-90, Math.min(bounds[1], 90));
        return this;
    };
    
    /**
     * Returns the yaw of the center of the view.
     * @memberof Viewer
     * @instance
     * @returns {number} Yaw in degrees
     */
    this.getYaw = function() {
        return (config.yaw + 540) % 360 - 180;
    };
    
    /**
     * Sets the yaw of the center of the view.
     * @memberof Viewer
     * @instance
     * @param {number} yaw - Yaw in degrees [-180, 180]
     * @param {boolean|number} [animated=1000] - Animation duration in milliseconds or false for no animation
     * @param {function} [callback] - Function to call when animation finishes
     * @param {object} [callbackArgs] - Arguments to pass to callback function
     * @returns {Viewer} `this`
     */
    this.setYaw = function(yaw, animated, callback, callbackArgs) {
        latestInteraction = Date.now();
        if (Math.abs(yaw - config.yaw) <= eps) {
            if (typeof callback == 'function')
                callback(callbackArgs);
            return this;
        }
        animated = animated == undefined ? 1000: Number(animated);
        yaw = ((yaw + 180) % 360) - 180; // Keep in bounds
        if (animated) {
            // Animate in shortest direction
            if (config.yaw - yaw > 180)
                yaw += 360;
            else if (yaw - config.yaw > 180)
                yaw -= 360;
    
            animatedMove.yaw = {
                'startTime': Date.now(),
                'startPosition': config.yaw,
                'endPosition': yaw,
                'duration': animated
            };
            if (typeof callback == 'function')
                setTimeout(function(){callback(callbackArgs);}, animated);
        } else {
            config.yaw = yaw;
        }
        animateInit();
        return this;
    };
    
    /**
     * Returns the minimum and maximum allowed pitches (in degrees).
     * @memberof Viewer
     * @instance
     * @returns {number[]} [yaw pitch, maximum yaw]
     */
    this.getYawBounds = function() {
        return [config.minYaw, config.maxYaw];
    };
    
    /**
     * Set the minimum and maximum allowed yaws (in degrees [-360, 360]).
     * @memberof Viewer
     * @instance
     * @param {number[]} bounds - [minimum yaw, maximum yaw]
     * @returns {Viewer} `this`
     */
    this.setYawBounds = function(bounds) {
        config.minYaw = Math.max(-360, Math.min(bounds[0], 360));
        config.maxYaw = Math.max(-360, Math.min(bounds[1], 360));
        return this;
    };
    
    /**
     * Returns the horizontal field of view.
     * @memberof Viewer
     * @instance
     * @returns {number} Horizontal field of view in degrees
     */
    this.getHfov = function() {
        return config.hfov;
    };
    
    /**
     * Sets the horizontal field of view.
     * @memberof Viewer
     * @instance
     * @param {number} hfov - Horizontal field of view in degrees
     * @param {boolean|number} [animated=1000] - Animation duration in milliseconds or false for no animation
     * @param {function} [callback] - Function to call when animation finishes
     * @param {object} [callbackArgs] - Arguments to pass to callback function
     * @returns {Viewer} `this`
     */
    this.setHfov = function(hfov, animated, callback, callbackArgs) {
        latestInteraction = Date.now();
        if (Math.abs(hfov - config.hfov) <= eps) {
            if (typeof callback == 'function')
                callback(callbackArgs);
            return this;
        }
        animated = animated == undefined ? 1000: Number(animated);
        if (animated) {
            animatedMove.hfov = {
                'startTime': Date.now(),
                'startPosition': config.hfov,
                'endPosition': constrainHfov(hfov),
                'duration': animated
            };
            if (typeof callback == 'function')
                setTimeout(function(){callback(callbackArgs);}, animated);
        } else {
            setHfov(hfov);
        }
        animateInit();
        return this;
    };
    
    /**
     * Returns the minimum and maximum allowed horizontal fields of view
     * (in degrees).
     * @memberof Viewer
     * @instance
     * @returns {number[]} [minimum HFOV, maximum HFOV]
     */
    this.getHfovBounds = function() {
        return [config.minHfov, config.maxHfov];
    };
    
    /**
     * Set the minimum and maximum allowed horizontal fields of view (in degrees).
     * @memberof Viewer
     * @instance
     * @param {number[]} bounds - [minimum HFOV, maximum HFOV]
     * @returns {Viewer} `this`
     */
    this.setHfovBounds = function(bounds) {
        config.minHfov = Math.max(0, bounds[0]);
        config.maxHfov = Math.max(0, bounds[1]);
        return this;
    };
    
    /**
     * Set a new view. Any parameters not specified remain the same.
     * @memberof Viewer
     * @instance
     * @param {number} [pitch] - Target pitch
     * @param {number} [yaw] - Target yaw
     * @param {number} [hfov] - Target HFOV
     * @param {boolean|number} [animated=1000] - Animation duration in milliseconds or false for no animation
     * @param {function} [callback] - Function to call when animation finishes
     * @param {object} [callbackArgs] - Arguments to pass to callback function
     * @returns {Viewer} `this`
     */
    this.lookAt = function(pitch, yaw, hfov, animated, callback, callbackArgs) {
        animated = animated == undefined ? 1000: Number(animated);
        if (pitch !== undefined && Math.abs(pitch - config.pitch) > eps) {
            this.setPitch(pitch, animated, callback, callbackArgs);
            callback = undefined;
        }
        if (yaw !== undefined && Math.abs(yaw - config.yaw) > eps) {
            this.setYaw(yaw, animated, callback, callbackArgs);
            callback = undefined;
        }
        if (hfov !== undefined && Math.abs(hfov - config.hfov) > eps) {
            this.setHfov(hfov, animated, callback, callbackArgs);
            callback = undefined;
        }
        if (typeof callback == 'function')
            callback(callbackArgs);
        return this;
    };
    
    /**
     * Returns the panorama's north offset.
     * @memberof Viewer
     * @instance
     * @returns {number} North offset in degrees
     */
    this.getNorthOffset = function() {
        return config.northOffset;
    };
    
    /**
     * Sets the panorama's north offset.
     * @memberof Viewer
     * @instance
     * @param {number} heading - North offset in degrees
     * @returns {Viewer} `this`
     */
    this.setNorthOffset = function(heading) {
        config.northOffset = Math.min(360, Math.max(0, heading));
        animateInit();
        return this;
    };
    
    /**
     * Returns the panorama's horizon roll.
     * @memberof Viewer
     * @instance
     * @returns {number} Horizon roll in degrees
     */
    this.getHorizonRoll = function() {
        return config.horizonRoll;
    };
    
    /**
     * Sets the panorama's horizon roll.
     * @memberof Viewer
     * @instance
     * @param {number} roll - Horizon roll in degrees [-90, 90]
     * @returns {Viewer} `this`
     */
    this.setHorizonRoll = function(roll) {
        config.horizonRoll = Math.min(90, Math.max(-90, roll));
        renderer.setPose(config.horizonPitch * Math.PI / 180, config.horizonRoll * Math.PI / 180);
        animateInit();
        return this;
    };
    
    /**
     * Returns the panorama's horizon pitch.
     * @memberof Viewer
     * @instance
     * @returns {number} Horizon pitch in degrees
     */
    this.getHorizonPitch = function() {
        return config.horizonPitch;
    };
    
    /**
     * Sets the panorama's horizon pitch.
     * @memberof Viewer
     * @instance
     * @param {number} pitch - Horizon pitch in degrees [-90, 90]
     * @returns {Viewer} `this`
     */
    this.setHorizonPitch = function(pitch) {
        config.horizonPitch = Math.min(90, Math.max(-90, pitch));
        renderer.setPose(config.horizonPitch * Math.PI / 180, config.horizonRoll * Math.PI / 180);
        animateInit();
        return this;
    };
    
    /**
     * Start auto rotation.
     *
     * Before starting rotation, the viewer is panned to `pitch`.
     * @memberof Viewer
     * @instance
     * @param {number} [speed] - Auto rotation speed / direction. If not specified, previous value is used.
     * @param {number} [pitch] - The pitch to rotate at. If not specified, initial pitch is used.
     * @param {number} [hfov] - The HFOV to rotate at. If not specified, initial HFOV is used.
     * @param {number} [inactivityDelay] - The delay, in milliseconds, after which
     *      to automatically restart auto rotation if it is interupted by the user.
     *      If not specified, auto rotation will not automatically restart after it
     *      is stopped.
     * @returns {Viewer} `this`
     */
    this.startAutoRotate = function(speed, pitch, hfov, inactivityDelay) {
        speed = speed || autoRotateSpeed || 1;
        pitch = pitch === undefined ? origPitch : pitch;
        hfov = hfov === undefined ? origHfov : hfov;
        config.autoRotate = speed;
        if (inactivityDelay !== undefined)
            config.autoRotateInactivityDelay = inactivityDelay;
        _this.lookAt(pitch, undefined, hfov, 3000);
        animateInit();
        return this;
    };
    
    /**
     * Stop auto rotation.
     * @memberof Viewer
     * @instance
     * @returns {Viewer} `this`
     */
    this.stopAutoRotate = function() {
        autoRotateSpeed = config.autoRotate ? config.autoRotate : autoRotateSpeed;
        config.autoRotate = false;
        config.autoRotateInactivityDelay = -1;
        return this;
    };
    
    /**
     * Stops all movement.
     * @memberof Viewer
     * @instance
     */
    this.stopMovement = function() {
        stopAnimation();
        speed = {'yaw': 0, 'pitch': 0, 'hfov': 0};
    };
    
    /**
     * Returns the panorama renderer.
     * @memberof Viewer
     * @instance
     * @returns {Renderer}
     */
    this.getRenderer = function() {
        return renderer;
    };
    
    /**
     * Sets update flag for dynamic content.
     * @memberof Viewer
     * @instance
     * @param {boolean} bool - Whether or not viewer should update even when still
     * @returns {Viewer} `this`
     */
    this.setUpdate = function(bool) {
        update = bool === true;
        if (update) {
            updateOnce = false;
            if (renderer === undefined)
                onImageLoad();
            else
                animateInit();
        }
        return this;
    };
    
    /**
     * Sets update flag for dynamic content for one frame.
     * @memberof Viewer
     * @instance
     * @returns {Viewer} `this`
     */
    this.updateOnce = function() {
        update = updateOnce = true;
        if (renderer === undefined)
            onImageLoad();
        else
            animateInit();
        return this;
    };
    
    /**
     * Calculate panorama pitch and yaw from location of mouse event.
     * @memberof Viewer
     * @instance
     * @param {MouseEvent} event - Document mouse down event.
     * @returns {number[]} [pitch, yaw]
     */
    this.mouseEventToCoords = function(event) {
        return mouseEventToCoords(event);
    };
    
    /**
     * Change scene being viewed.
     * @memberof Viewer
     * @instance
     * @param {string} sceneId - Identifier of scene to switch to.
     * @param {number} [pitch] - Pitch to use with new scene
     * @param {number} [yaw] - Yaw to use with new scene
     * @param {number} [hfov] - HFOV to use with new scene
     * @returns {Viewer} `this`
     */
    this.loadScene = function(sceneId, pitch, yaw, hfov) {
        if (loaded !== false)
            loadScene(sceneId, pitch, yaw, hfov);
        return this;
    };
    
    /**
     * Get ID of current scene.
     * @memberof Viewer
     * @instance
     * @returns {string} ID of current scene
     */
    this.getScene = function() {
        return config.scene;
    };
    
    /**
     * Add a new scene.
     * @memberof Viewer
     * @instance
     * @param {string} sceneId - The ID of the new scene
     * @param {Object} config - The configuration of the new scene
     * @returns {Viewer} `this`
     */
    this.addScene = function(sceneId, config) {
        initialConfig.scenes[sceneId] = config;
        return this;
    };
    
    /**
     * Remove a scene.
     * @memberof Viewer
     * @instance
     * @param {string} sceneId - The ID of the scene
     * @returns {boolean} False if the scene is the current scene or if the scene doesn't exists, else true
     */
    this.removeScene = function(sceneId) {
        if (config.scene == sceneId || !initialConfig.scenes.hasOwnProperty(sceneId))
            return false;
        delete initialConfig.scenes[sceneId];
        return true;
    };
    
    /**
     * Toggle fullscreen.
     * @memberof Viewer
     * @instance
     * @returns {Viewer} `this`
     */
    this.toggleFullscreen = function() {
        toggleFullscreen();
        return this;
    };
    
    /**
     * Get configuration of current scene.
     * @memberof Viewer
     * @instance
     * @returns {Object} Configuration of current scene
     */
    this.getConfig = function() {
        return config;
    };
    
    /**
     * Get viewer's container element.
     * @memberof Viewer
     * @instance
     * @returns {HTMLElement} Container `div` element
     */
    this.getContainer = function() {
        return container;
    };
    
    /**
     * Add a new hot spot.
     * @memberof Viewer
     * @instance
     * @param {Object} hs - The configuration for the hot spot
     * @param {string} [sceneId] - Adds hot spot to specified scene if provided, else to current scene
     * @returns {Viewer} `this`
     * @throws Throws an error if the scene ID is provided but invalid
     */
    this.addHotSpot = function(hs, sceneId) {
        if (sceneId === undefined && config.scene === undefined) {
            // Not a tour
            config.hotSpots.push(hs);
        } else {
            // Tour
            var id = sceneId !== undefined ? sceneId : config.scene;
            if (initialConfig.scenes.hasOwnProperty(id)) {
                if (!initialConfig.scenes[id].hasOwnProperty('hotSpots')) {
                    initialConfig.scenes[id].hotSpots = []; // Create hot spots array if needed
                    if (id == config.scene)
                        config.hotSpots = initialConfig.scenes[id].hotSpots;    // Link to current config
                }
                initialConfig.scenes[id].hotSpots.push(hs); // Add hot spot to config
            } else {
                throw 'Invalid scene ID!';
            }
        }
        if (sceneId === undefined || config.scene == sceneId) {
            // Add to current scene
            createHotSpot(hs);
            if (loaded)
                renderHotSpot(hs);
        }
        return this;
    };
    
    /**
     * Remove a hot spot.
     * @memberof Viewer
     * @instance
     * @param {string} hotSpotId - The ID of the hot spot
     * @param {string} [sceneId] - Removes hot spot from specified scene if provided, else from current scene
     * @returns {boolean} True if deletion is successful, else false
     */
    this.removeHotSpot = function(hotSpotId, sceneId) {
        if (sceneId === undefined || config.scene == sceneId) {
            if (!config.hotSpots)
                return false;
            for (var i = 0; i < config.hotSpots.length; i++) {
                if (config.hotSpots[i].hasOwnProperty('id') &&
                    config.hotSpots[i].id == hotSpotId) {
                    // Delete hot spot DOM elements
                    var current = config.hotSpots[i].div;
                    while (current.parentNode != uiContainer)
                        current = current.parentNode;
                    uiContainer.removeChild(current);
                    delete config.hotSpots[i].div;
                    // Remove hot spot from configuration
                    config.hotSpots.splice(i, 1);
                    return true;
                }
            }
        } else {
            if (initialConfig.scenes.hasOwnProperty(sceneId)) {
                if (!initialConfig.scenes[sceneId].hasOwnProperty('hotSpots'))
                    return false;
                for (var j = 0; j < initialConfig.scenes[sceneId].hotSpots.length; j++) {
                    if (initialConfig.scenes[sceneId].hotSpots[j].hasOwnProperty('id') &&
                        initialConfig.scenes[sceneId].hotSpots[j].id == hotSpotId) {
                        // Remove hot spot from configuration
                        initialConfig.scenes[sceneId].hotSpots.splice(j, 1);
                        return true;
                    }
                }
            } else {
                return false;
            }
        }
    };
    
    /**
     * This method should be called if the viewer's container is resized.
     * @memberof Viewer
     * @instance
     */
    this.resize = function() {
        if (renderer)
            onDocumentResize();
    };
    
    /**
     * Check if device orientation control is supported.
     * @memberof Viewer
     * @instance
     * @returns {boolean} True if supported, else false
     */
    this.isOrientationSupported = function() {
        return orientationSupport || false;
    };
    
    /**
     * Stop using device orientation.
     * @memberof Viewer
     * @instance
     */
    this.stopOrientation = function() {
        stopOrientation();
    };
    
    /**
     * Start using device orientation (does nothing if not supported).
     * @memberof Viewer
     * @instance
     */
    this.startOrientation = function() {
        startOrientation();
    };
    
    /**
     * Check if device orientation control is currently activated.
     * @memberof Viewer
     * @instance
     * @returns {boolean} True if active, else false
     */
    this.isOrientationActive = function() {
        return Boolean(orientation);
    };
    
    /**
     * Subscribe listener to specified event.
     * @memberof Viewer
     * @instance
     * @param {string} type - Type of event to subscribe to.
     * @param {Function} listener - Listener function to subscribe to event.
     * @returns {Viewer} `this`
     */
    this.on = function(type, listener) {
        externalEventListeners[type] = externalEventListeners[type] || [];
        externalEventListeners[type].push(listener);
        return this;
    };
    
    /**
     * Remove an event listener (or listeners).
     * @memberof Viewer
     * @param {string} [type] - Type of event to remove listeners from. If not specified, all listeners are removed.
     * @param {Function} [listener] - Listener function to remove. If not specified, all listeners of specified type are removed.
     * @returns {Viewer} `this`
     */
    this.off = function(type, listener) {
        if (!type) {
            // Remove all listeners if type isn't specified
            externalEventListeners = {};
            return this;
        }
        if (listener) {
            var i = externalEventListeners[type].indexOf(listener);
            if (i >= 0) {
                // Remove listener if found
                externalEventListeners[type].splice(i, 1);
            }
            if (externalEventListeners[type].length == 0) {
                // Remove category if empty
                delete externalEventListeners[type];
            }
        } else {
            // Remove category of listeners if listener isn't specified
            delete externalEventListeners[type];
        }
        return this;
    };
    
    /**
     * Fire listeners attached to specified event.
     * @private
     * @param {string} [type] - Type of event to fire listeners for.
     */
    function fireEvent(type) {
        if (type in externalEventListeners) {
            // Reverse iteration is useful, if event listener is removed inside its definition
            for (var i = externalEventListeners[type].length; i > 0; i--) {
                externalEventListeners[type][externalEventListeners[type].length - i].apply(null, [].slice.call(arguments, 1));
            }
        }
    }
    
    /**
     * Destructor.
     * @instance
     * @memberof Viewer
     */
    this.destroy = function() {
        destroyed = true;
        clearTimeout(autoRotateStart);
    
        if (xhr)
            xhr.abort();
        if (Array.isArray(panoImage)) {
            for (var i = 0; i < 6; i++)
                panoImage[i].src = '';
        }
        if (renderer)
            renderer.destroy();
        if (listenersAdded) {
            document.removeEventListener('mousemove', onDocumentMouseMove, false);
            document.removeEventListener('mouseup', onDocumentMouseUp, false);
            container.removeEventListener('mozfullscreenchange', onFullScreenChange, false);
            container.removeEventListener('webkitfullscreenchange', onFullScreenChange, false);
            container.removeEventListener('msfullscreenchange', onFullScreenChange, false);
            container.removeEventListener('fullscreenchange', onFullScreenChange, false);
            if (resizeObserver) {
                resizeObserver.disconnect();
            } else {
                window.removeEventListener('resize', onDocumentResize, false);
                window.removeEventListener('orientationchange', onDocumentResize, false);
            }
            container.removeEventListener('keydown', onDocumentKeyPress, false);
            container.removeEventListener('keyup', onDocumentKeyUp, false);
            container.removeEventListener('blur', clearKeys, false);
            document.removeEventListener('mouseleave', onDocumentMouseUp, false);
        }
        container.innerHTML = '';
        container.classList.remove('pnlm-container');
    };

    /** ==================== Hydro Custom code start ==================== */

    function hyParseArgs(defaults, options) {
        options = options || {};

        for (let key in options) {
            if (options.hasOwnProperty(key)) {
                if ( key === 'hy_isDefault' && options[key] ) {
                    config.default.firstScene = config.scene;

                    for ( let scene in config.scenes ) {
                        if ( scene !== config.scene ) {
                            config.scenes[scene][key] = false;
                        }
                    }
                }

                if ( key === 'hy_isActive' && options[key] ) {
                    // config.default.hy_isActive = options[key];

                    for ( let scene in config.scenes ) {
                        if ( scene !== config.scene ) {
                            config.scenes[scene][key] = false;
                        }
                    }
                }

                defaults[key] = options[key];
            }
        }
        return defaults;
    }

    this.getHuiStatus = function () {
        return this.huiStatus;
    };

    this.setHuiStatus = function ( status ) {
        if ( status === 'editor' || status === 'view' ) {
            this.huiStatus = status;
        }else {
            this.huiStatus = 'view';
        }
    };

    /**
     * Update a hot spot.
     * @memberof Viewer
     * @instance
     * @param {Object} hs - The configuration for the hot spot
     * @param {string} [sceneId] - Adds hot spot to specified scene if provided, else to current scene
     * @returns {Viewer} `this`
     * @throws Throws an error if the scene ID is provided but invalid
     * Author: Hydro
     * Title: Custom Update Hotspot
     */
        this.hyUpdateHotSpot = function(hotSpotId, sceneId, hs) {
            if (config.huiStatus === 'view' ) return;

            if (sceneId === undefined || config.scene == sceneId) {
                if (!config.hotSpots)
                    return false;
                for (var i = 0; i < config.hotSpots.length; i++) {
                    if (config.hotSpots[i].hasOwnProperty('id') &&
                        config.hotSpots[i].id == hotSpotId) {
                        // Update hot spot DOM elements
                        var div = config.hotSpots[i].div;


                        /**
                         * Title: Create border for hotspot
                         * Position: function hyUpdateHotSpot
                         * Date Created: 2024/02/05
                         * Author: Hydro
                         */

                        if (hs.hy_opacity) {
                            config.hotSpots[i].hy_opacity = hs.hy_opacity;
                            div.style.opacity = hs.hy_opacity;
                        }
                        if (hs.hy_dimension) {
                            config.hotSpots[i].hy_dimension = hs.hy_dimension;
                            div.style.height = hs.hy_dimension + 'px';
                            div.style.width = hs.hy_dimension + 'px';
                        }
                        if (hs.targetPitch) {
                            config.hotSpots[i].targetPitch = hs.targetPitch;
                        }

                        if (hs.targetYaw) {
                            config.hotSpots[i].targetYaw = hs.targetYaw;
                        }

                        var span = div.querySelector('span') ?? document.createElement('span');

                        if (typeof hs.text === "string") {
                            config.hotSpots[i].text = hs.text;
                            span.innerHTML = escapeHTML(hs.text);
                            if (!hs.text) {
                                span.remove();
                            }
                        }

                        if (config.hotSpots[i].text) {

                            if (hs.text) {
                                div.classList.add('pnlm-tooltip');
                                div.appendChild(span);
                            }

                            span.style.minWidth = span.scrollWidth - 20 + 'px';
                            span.style.marginLeft = -(span.scrollWidth - div.offsetWidth) / 2 + 'px';
                            span.style.marginTop = -span.scrollHeight - 12 + 'px';
                        }



                    }
                }
            }
        }

        this.hyUpdateScene = function ( sceneId, data = {} ) {
            if ( !initialConfig.scenes.hasOwnProperty(sceneId))
                return false;
            initialConfig.scenes[sceneId] = hyParseArgs( initialConfig.scenes[sceneId], data );
            if (config.scene === sceneId)
                this.loadScene(sceneId, initialConfig.scenes[sceneId].pitch, initialConfig.scenes[sceneId].yaw, initialConfig.scenes[sceneId].hfov);
        };

        this.hySetScene = function ( id ) {
            config.scene = id;
        };

        this.hyGetHotspot = function ( hotspotId ) {
            let hotspots = config.scenes[config?.scene].hotSpots;
            for (const hsKey in hotspots) {
                if ( hotspots[hsKey].id === hotspotId ) return hotspots[hsKey];
            }
        };

        this.hySetSceneIdToHotspot = function ( hotspotId, sceneId ) {
            let hotspot = this.hyGetHotspot( hotspotId );
            hotspot.sceneId = sceneId;
        }
    
    }

    /** ==================== Hydro Custom code end ==================== */
    
    return {
        viewer: function(container, config) {
            return new Viewer(container, config);
        }
    };
    
    })(window, document);