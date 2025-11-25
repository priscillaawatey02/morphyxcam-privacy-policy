"use strict";

//// Box 1 Variables ////
const width = 320; // We will scale the photo width to this
var height = 0; // This will be computed based on the input stream
var streaming = false;

var video;
var canvas1;
var photo;
var startCapture;
var allowCapture;
var clearCapture;
var sldrDiv;
var imgHeightSldr;
var imgHeightSldrTxt;
var imgWidthSldr;
var imgWidthSldrTxt;
var imghgt = 0;
var imgwid = 0;


//// Box 2 Variables ////
var canvas2;
var gl1;
var program1;

var vColor1;
var vPosition1;
var vTexCoord1;

var numVertices = 36;

var texSize = 64;
var imgSize = 64;
var numChecks = 4;

var checkerImage = new Uint8Array(4 * imgSize * imgSize);

var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];

var vertexColors = [
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 1.0, 1.0, 1.0),  // white
    vec4(1.0, 0.0, 0.0, 1.0),   // red
];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var theta = [45.0, 45.0, 45.0];
var thetaLoc;

var rotateOn = false;

//// Box 3 Variables ////
var canvas3;
var gl2;
var program2;

var vPosition2;
var vTexCoord2;

var latitudeBands = 30;
var longitudeBands = 30;
var radius = 2;

var pointsArray2 = [];
var texCoordsArray2 = [];

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var up = vec3(0.0, 1.0, 0.0);
var at = vec3(0.0, 0.0, 0.0);
var eye = vec3(0.0, 0.0, 1.0);

var theta2 = 0.0;
var phi2 = 0.0;

var near = -10;
var far = 10;
var left = -3.0;
var right = 3.0;
var ytop = 3.0;
var bottom = -3.0;

var useBlackLoc;
var hasTextureLoc;
var hasTexture = false;

//// Box 3 Variables ////
// ... existing variables ...

// Mouse control variables for Box 3
var trackingMouseBox3 = false;
var lastMouseXBox3 = 0;
var lastMouseYBox3 = 0;
var mouseSensitivityBox3 = 0.02; // Adjust this value to control rotation speed

// ---------------- HELPER FUNCTIONS ----------------

function updatePhotoFromCanvas() {
    const data = canvas1.toDataURL("image/png");
    photo.setAttribute("src", data);
}

function updateTexturesFromCanvas() {
    // Update cube texture (Box 2)
    if (gl1 && program1) {
        configureTexture(canvas1, false);
    }

    // Update sphere texture (Box 3)
    if (gl2 && program2) {
        if (!hasTexture) {
            hasTexture = true;
            gl2.uniform1i(hasTextureLoc, true);
        }
        configureTexture2(canvas1);
    }
}

// Generic helper to apply a filter and sync image + textures
function applyFilter(filterFn, ...extraArgs) {
    if (!canvas1 || !canvas1.width || !canvas1.height) return;

    const ctx = canvas1.getContext("2d");
    const w = canvas1.width;
    const h = canvas1.height;

    if (window.originalImageData) {
        ctx.putImageData(window.originalImageData, 0, 0);
    };

    filterFn(ctx, w, h, ...extraArgs);
    updatePhotoFromCanvas();
    updateTexturesFromCanvas();
}


window.onload = function init() {
    ///// Box 1 //////
    video = document.getElementById("video");
    canvas1 = document.getElementById("canvas1");
    photo = document.getElementById("photo");
    startCapture = document.getElementById("startcapture");
    allowCapture = document.getElementById("allowcapture");
    clearCapture = document.getElementById("clearcapture");
    sldrDiv = document.getElementById("sldrdiv");
    imgHeightSldr = document.getElementById("imgheightsldr");
    imgWidthSldr = document.getElementById("imgwidthsldr");
    imgHeightSldrTxt = document.getElementById("imgheighttxt");
    imgWidthSldrTxt = document.getElementById("imgwidthtxt");

    startCapture.onclick =
        function (event) {
            takePicture();
            event.preventDefault();
        };

    clearCapture.onclick =
        function () {
            clrCapture();
        };

    allowCapture.addEventListener("click",
        function (event) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                .then((stream) => {
                    video.srcObject = stream;
                    video.play();
                })
                .catch((err) => {
                    console.error(`An error occurred: ${err}`);
                });
        });

    video.addEventListener("canplay",
        function (event) {
            if (!streaming) {
                height = video.videoHeight / (video.videoWidth / width);
                video.setAttribute("width", width);
                video.setAttribute("height", height);
                canvas1.setAttribute("width", width);
                canvas1.setAttribute("height", height);
                streaming = true;
            }
        });

    document.getElementById("imgheightsldr").oninput =
        function (event) {
            if (imgHeightSldr.max > 0) {
                let rect = sldrDiv.getBoundingClientRect();
                let topPos = rect.top;
                let leftPos = rect.left;
                photo.height = imghgt = Number(event.target.value);
                photo.style.left = (leftPos + 1 + (width - imgwid) / 2) + "px";
                photo.style.top = (window.scrollY + topPos + 1 + (height - imghgt) / 2) + "px";
            }
        };

    document.getElementById("imgwidthsldr").oninput =
        function (event) {
            if (imgWidthSldr.max > 0) {
                let rect = sldrDiv.getBoundingClientRect();
                let topPos = rect.top;
                let leftPos = rect.left;
                photo.width = imgwid = Number(event.target.value);
                photo.style.left = (leftPos + 1 + (width - imgwid) / 2) + "px";
                photo.style.top = (window.scrollY + topPos + 1 + (height - imghgt) / 2) + "px";
            }
        };

    clearPhoto();


    ///// Box 2 //////
    canvas2 = document.getElementById("canvas2");
    gl1 = canvas2.getContext('webgl2', {});
    if (!gl1) { alert("WebGL2 is unavailable"); }

    // viewport = rectangular area of display window
    gl1.viewport(0, 0, canvas2.width, canvas2.height);
    // clear area of display for rendering at each frame
    gl1.clearColor(1.0, 1.0, 1.0, 1.0);

    gl1.enable(gl1.DEPTH_TEST);

    // --------------- Load shaders and initialize attribute buffers

    program1 = initShaders(gl1, "vertex-shader1", "fragment-shader1");
    gl1.useProgram(program1);

    for (let i = 0; i < imgSize; i++) {
        for (let j = 0; j < imgSize; j++) {
            let patchx = Math.floor(i / (imgSize / numChecks));
            let patchy = Math.floor(j / (imgSize / numChecks));
            let c;
            c = (patchx % 2 ^ patchy % 2) ? 255 : 0;
            checkerImage[4 * i * imgSize + 4 * j] = c;
            checkerImage[4 * i * imgSize + 4 * j + 1] = c;
            checkerImage[4 * i * imgSize + 4 * j + 2] = c;
            checkerImage[4 * i * imgSize + 4 * j + 3] = 255;
        }
    }

    colorCube();

    let cBuffer = gl1.createBuffer();
    gl1.bindBuffer(gl1.ARRAY_BUFFER, cBuffer);
    gl1.bufferData(gl1.ARRAY_BUFFER, flatten(colorsArray), gl1.STATIC_DRAW);
    vColor1 = gl1.getAttribLocation(program1, "vColor");
    gl1.vertexAttribPointer(vColor1, 4, gl1.FLOAT, false, 0, 0);
    gl1.enableVertexAttribArray(vColor1);

    let vBuffer = gl1.createBuffer();
    gl1.bindBuffer(gl1.ARRAY_BUFFER, vBuffer);
    gl1.bufferData(gl1.ARRAY_BUFFER, flatten(pointsArray), gl1.STATIC_DRAW);
    vPosition1 = gl1.getAttribLocation(program1, "vPosition");
    gl1.vertexAttribPointer(vPosition1, 4, gl1.FLOAT, false, 0, 0);
    gl1.enableVertexAttribArray(vPosition1);

    let tBuffer = gl1.createBuffer();
    gl1.bindBuffer(gl1.ARRAY_BUFFER, tBuffer);
    gl1.bufferData(gl1.ARRAY_BUFFER, flatten(texCoordsArray), gl1.STATIC_DRAW);
    vTexCoord1 = gl1.getAttribLocation(program1, "vTexCoord");
    gl1.vertexAttribPointer(vTexCoord1, 2, gl1.FLOAT, false, 0, 0);
    gl1.enableVertexAttribArray(vTexCoord1);

    configureTexture(checkerImage, true);

    thetaLoc = gl1.getUniformLocation(program1, "theta");
    gl1.uniform3fv(thetaLoc, theta);

    document.getElementById("rotatex").onclick =
        function () {
            axis = xAxis;
        };

    document.getElementById("rotatey").onclick =
        function () {
            axis = yAxis;
        };

    document.getElementById("rotatez").onclick =
        function () {
            axis = zAxis;
        };

    document.getElementById("togglerot").onclick =
        function () {
            rotateOn = !rotateOn;
        };


    ///// Box 3 //////
    canvas3 = document.getElementById("canvas3");
    gl2 = canvas3.getContext('webgl2', {});
    if (!gl2) { alert("WebGL2 is unavailable"); }

    // viewport = rectangular area of display window
    gl2.viewport(0, 0, canvas3.width, canvas3.height);
    // clear area of display for rendering at each frame
    gl2.clearColor(1.0, 1.0, 1.0, 1.0);

    gl2.enable(gl2.DEPTH_TEST);

    // --------------- Load shaders and initialize attribute buffers

    program2 = initShaders(gl2, "vertex-shader2", "fragment-shader2");
    gl2.useProgram(program2);

    createSphereMap();

    // Create vertex buffer and vPosition attribute
    vBuffer = gl2.createBuffer();
    gl2.bindBuffer(gl2.ARRAY_BUFFER, vBuffer);
    gl2.bufferData(gl2.ARRAY_BUFFER, flatten(pointsArray2), gl2.STATIC_DRAW);
    vPosition2 = gl2.getAttribLocation(program2, "vPosition");
    gl2.vertexAttribPointer(vPosition2, 4, gl2.FLOAT, false, 0, 0);
    gl2.enableVertexAttribArray(vPosition2);

    // Create texture buffer and vTexCoord attribute
    tBuffer = gl2.createBuffer();
    gl2.bindBuffer(gl2.ARRAY_BUFFER, tBuffer);
    gl2.bufferData(gl2.ARRAY_BUFFER, flatten(texCoordsArray2), gl2.STATIC_DRAW);
    vTexCoord2 = gl2.getAttribLocation(program2, "vTexCoord");
    gl2.vertexAttribPointer(vTexCoord2, 2, gl2.FLOAT, false, 0, 0);
    gl2.enableVertexAttribArray(vTexCoord2);

    // Get buffer locations for the following shader variables
    projectionMatrixLoc = gl2.getUniformLocation(program2, "projectionMatrix");
    modelViewMatrixLoc = gl2.getUniformLocation(program2, "modelViewMatrix");

    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    gl2.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    useBlackLoc = gl2.getUniformLocation(program2, "useBlack");
    gl2.uniform1i(useBlackLoc, false);
    hasTextureLoc = gl2.getUniformLocation(program2, "hasTexture");
    gl2.uniform1i(hasTextureLoc, false);

    ///// Box 3 Mouse Controls /////
    canvas3.addEventListener("mousedown", function (event) {
        let rect = canvas3.getBoundingClientRect();
        let x = 2 * (event.clientX - rect.left) / canvas3.width - 1;
        let y = 2 * (canvas3.height - (event.clientY - rect.top)) / canvas3.height - 1;
        startMotionBox3(x, y);
    });

    canvas3.addEventListener("mouseup", function (event) {
        let rect = canvas3.getBoundingClientRect();
        let x = 2 * (event.clientX - rect.left) / canvas3.width - 1;
        let y = 2 * (canvas3.height - (event.clientY - rect.top)) / canvas3.height - 1;
        stopMotionBox3(x, y);
    });

    canvas3.addEventListener("mousemove", function (event) {
        let rect = canvas3.getBoundingClientRect();
        let x = 2 * (event.clientX - rect.left) / canvas3.width - 1;
        let y = 2 * (canvas3.height - (event.clientY - rect.top)) / canvas3.height - 1;
        mouseMotionBox3(x, y);
    });

    document.addEventListener("keydown",
        function (event) {
            let keyCode = 0;
            if (event.key != null && event.key.length > 0) {
                switch (event.key) {
                    case "ArrowLeft": keyCode = 37; break;
                    case "ArrowUp": keyCode = 38; break;
                    case "ArrowRight": keyCode = 39; break;
                    case "ArrowDown": keyCode = 40; break;
                    case "PageUp": keyCode = 33; break;
                    case "PageDown": keyCode = 34; break;
                    default:
                        keyCode = (event.key.length > 1) ? 0 :
                            event.key.toUpperCase().charCodeAt(0);
                }
            }

            if (keyCode == 65 || keyCode == 37) {   // A or Left
                theta2 += 0.1;
            }

            if (keyCode == 68 || keyCode == 39) {   // D or Right
                theta2 -= 0.1;
            }

            if (keyCode == 87 || keyCode == 38) {   // W or Up
                phi2 += 0.1;
            }

            if (keyCode == 83 || keyCode == 40) {   // S or Down
                phi2 -= 0.1;
            }

        }, false);

    const normalBtn = document.getElementById("normalBtn");
    const grayscaleBtn = document.getElementById("grayscaleBtn");
    const brightenBtn = document.getElementById("brightenBtn");
    const sepiaBtn = document.getElementById("sepiaBtn");
    const invertBtn = document.getElementById("invertBtn");
    const cartoonBtn = document.getElementById("cartoonBtn");
    const emojiOverlayBtn = document.getElementById("emojiOverlayBtn");

    normalBtn.onclick = () => {
        const ctx = canvas1.getContext("2d");
        const w = canvas1.width;
        const h = canvas1.height;

        // Restore the captured original
        resetToOriginal(ctx, w, h);

        updatePhotoFromCanvas();
        updateTexturesFromCanvas();  // updates cube + sphere too
    };



    if (grayscaleBtn) {
        grayscaleBtn.onclick = () => applyFilter(FilterManager.applyGrayscale);
    }
    if (brightenBtn) {
        brightenBtn.onclick = () => applyFilter(FilterManager.applyBrighten, 40);
    }
    if (sepiaBtn) {
        sepiaBtn.onclick = () => applyFilter(FilterManager.applySepia);
    }
    if (invertBtn) {
        invertBtn.onclick = () => applyFilter(FilterManager.applyInvert);
    }
    if (cartoonBtn) {
        cartoonBtn.onclick = () => applyFilter(FilterManager.applyCartoon);

    }
    if (emojiOverlayBtn) {
        emojiOverlayBtn.onclick = () => applyFilter(FilterManager.applyEmojiOverlay);
    }

    // ---------------- END FILTER SECTION ----------------

    render();
}

function startMotionBox3(x, y) {
    trackingMouseBox3 = true;
    lastMouseXBox3 = x;
    lastMouseYBox3 = y;
}

function stopMotionBox3(x, y) {
    trackingMouseBox3 = false;
}

function mouseMotionBox3(x, y) {
    if (trackingMouseBox3) {
        // Calculate mouse movement delta (in pixels for more consistent movement)
        var deltaX = (x - lastMouseXBox3) * 100; // Multiply to increase sensitivity
        var deltaY = (y - lastMouseYBox3) * 100;

        // Apply rotation to multiple axes for more natural 3D rotation
        // Horizontal movement primarily rotates around Y-axis
        theta2 += deltaX * mouseSensitivityBox3;
        // Vertical movement primarily rotates around X-axis  
        phi2 += deltaY * mouseSensitivityBox3;

        // Also add some Z-axis rotation for more natural feel
        // This creates a more organic 3D rotation
        var deltaZ = (deltaX + deltaY) * 0.3 * mouseSensitivityBox3;

        // Update last mouse position
        lastMouseXBox3 = x;
        lastMouseYBox3 = y;

        // Keep angles within reasonable bounds
        theta2 = theta2 % (2 * Math.PI);
        phi2 = Math.max(-Math.PI, Math.min(Math.PI, phi2));

        console.log("Rotation - Theta:", theta2, "Phi:", phi2, "DeltaX:", deltaX, "DeltaY:", deltaY);
    }
}

function clearPhoto() {
    const context = canvas1.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas1.width, canvas1.height);
    const data = canvas1.toDataURL("image/png");
    photo.setAttribute("src", data);

    sldrDiv.style.height = (video.offsetHeight - 2) + "px";
}

function takePicture() {
    const context = canvas1.getContext("2d");
    if (width && height) {
        canvas1.width = width;
        canvas1.height = height;
        context.drawImage(video, 0, 0, width, height);
        const data = canvas1.toDataURL("image/png");
        photo.setAttribute("src", data);

        //Save original image data for filter resets
        window.originalImageData = context.getImageData(0, 0, width, height);

        updatePhotoFromCanvas();

        imgHeightSldr.max = height;
        imgHeightSldr.value = height;
        imgHeightSldrTxt.innerText = height.toString();
        imgWidthSldr.max = width;
        imgWidthSldr.value = width;
        imgWidthSldrTxt.innerText = width.toString();

        imghgt = height;
        imgwid = width;
        photo.height = height;
        photo.width = width;
        sldrDiv.style.height = height + "px";

        configureTexture(video, false);

        hasTexture = true;
        gl2.uniform1i(hasTextureLoc, true);
        configureTexture2(video);
    } else {
        clrCapture();
    }
}

function clrCapture() {
    clearPhoto();

    imgHeightSldr.max = 0;
    imgHeightSldr.value = 0;
    imgHeightSldrTxt.innerText = "0";
    imgWidthSldr.max = 0;
    imgWidthSldr.value = 0;
    imgWidthSldrTxt.innerText = "0";
    imghgt = 0;
    imgwid = 0;

    configureTexture(checkerImage, true);

    hasTexture = false;
    gl2.uniform1i(hasTextureLoc, false);
}

function configureTexture(image, isBitMap) {
    let texture = gl1.createTexture();
    gl1.bindTexture(gl1.TEXTURE_2D, texture);
    gl1.pixelStorei(gl1.UNPACK_FLIP_Y_WEBGL, true);
    if (isBitMap) {
        gl1.texImage2D(gl1.TEXTURE_2D, 0, gl1.RGBA, texSize, texSize, 0,
            gl1.RGBA, gl1.UNSIGNED_BYTE, image);
    } else {
        gl1.texImage2D(gl1.TEXTURE_2D, 0, gl1.RGBA,
            gl1.RGBA, gl1.UNSIGNED_BYTE, image);
    }
    gl1.generateMipmap(gl1.TEXTURE_2D);
    gl1.texParameteri(gl1.TEXTURE_2D, gl1.TEXTURE_MIN_FILTER,
        gl1.NEAREST_MIPMAP_LINEAR);
    gl1.texParameteri(gl1.TEXTURE_2D, gl1.TEXTURE_MAG_FILTER, gl1.NEAREST);

    let textureLoc = gl1.getUniformLocation(program1, "sampTexture");
    gl1.activeTexture(gl1.TEXTURE0);
    gl1.uniform1i(textureLoc, 0);
}

function configureTexture2(image) {
    let texture = gl2.createTexture();
    gl2.bindTexture(gl2.TEXTURE_2D, texture);
    gl2.pixelStorei(gl2.UNPACK_FLIP_Y_WEBGL, true);
    gl2.texImage2D(gl2.TEXTURE_2D, 0, gl2.RGBA,
        gl2.RGBA, gl2.UNSIGNED_BYTE, image);
    gl2.generateMipmap(gl2.TEXTURE_2D);
    gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MIN_FILTER,
        gl2.NEAREST_MIPMAP_LINEAR);
    gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MAG_FILTER, gl2.NEAREST);

    let textureLoc = gl2.getUniformLocation(program2, "sampTexture");
    gl2.activeTexture(gl2.TEXTURE0);
    gl2.uniform1i(textureLoc, 0);
}

function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(5, 1, 2, 6);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function quad(a, b, c, d) {
    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[c]);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[b]);
    colorsArray.push(vertexColors[c]);
    texCoordsArray.push(texCoord[1]);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[c]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[a]);
    colorsArray.push(vertexColors[c]);
    texCoordsArray.push(texCoord[0]);

    pointsArray.push(vertices[c]);
    colorsArray.push(vertexColors[c]);
    texCoordsArray.push(texCoord[2]);

    pointsArray.push(vertices[d]);
    colorsArray.push(vertexColors[c]);
    texCoordsArray.push(texCoord[3]);
}

// Create SphereMap by filling pointsArray, normalsArray and texCoordsArray
function createSphereMap() {
    pointsArray2 = [];
    texCoordsArray2 = [];

    let phi1, phi2, sinPhi1, sinPhi2, cosPhi1, cosPhi2;
    let theta1, theta2, sinTheta1, sinTheta2, cosTheta1, cosTheta2;
    let p1, p2, p3, p4, u1, u2, v1, v2, uv1, uv2, uv3, uv4;
    let r = radius;

    // For each latitudinal band determine phi's value
    for (let latNumber = 1; latNumber <= latitudeBands; latNumber++) {
        phi1 = Math.PI * (latNumber - 1) / latitudeBands;
        sinPhi1 = Math.sin(phi1);
        cosPhi1 = Math.cos(phi1);

        phi2 = Math.PI * latNumber / latitudeBands;
        sinPhi2 = Math.sin(phi2);
        cosPhi2 = Math.cos(phi2);

        // For each longitudinal band determine theta's value and other calculations
        for (let longNumber = 1; longNumber <= longitudeBands; longNumber++) {
            theta1 = 2 * Math.PI * (longNumber - 1) / longitudeBands;
            sinTheta1 = Math.sin(theta1);
            cosTheta1 = Math.cos(theta1);

            theta2 = 2 * Math.PI * longNumber / longitudeBands;
            sinTheta2 = Math.sin(theta2);
            cosTheta2 = Math.cos(theta2);

            p1 = vec4(cosTheta1 * sinPhi1 * r, cosPhi1 * r, sinTheta1 * sinPhi1 * r, 1.0);
            p2 = vec4(cosTheta2 * sinPhi1 * r, cosPhi1 * r, sinTheta2 * sinPhi1 * r, 1.0);
            p3 = vec4(cosTheta1 * sinPhi2 * r, cosPhi2 * r, sinTheta1 * sinPhi2 * r, 1.0);
            p4 = vec4(cosTheta2 * sinPhi2 * r, cosPhi2 * r, sinTheta2 * sinPhi2 * r, 1.0);

            pointsArray2.push(p1);
            pointsArray2.push(p2);
            pointsArray2.push(p3);
            pointsArray2.push(p2);
            pointsArray2.push(p4);
            pointsArray2.push(p3);

            u1 = 1 - ((longNumber - 1) / longitudeBands);
            u2 = 1 - (longNumber / longitudeBands);
            v1 = 1 - ((latNumber - 1) / latitudeBands);
            v2 = 1 - (latNumber / latitudeBands);

            uv1 = vec2(u1, v1);
            uv2 = vec2(u2, v1);
            uv3 = vec2(u1, v2);
            uv4 = vec2(u2, v2);

            texCoordsArray2.push(uv1);
            texCoordsArray2.push(uv2);
            texCoordsArray2.push(uv3);
            texCoordsArray2.push(uv2);
            texCoordsArray2.push(uv4);
            texCoordsArray2.push(uv3);
        }
    }
}

function render() {
    ///////////////// Draw Box 2 /////////////////
    gl1.useProgram(program1);
    gl1.enableVertexAttribArray(vPosition1);
    gl1.enableVertexAttribArray(vColor1);
    gl1.enableVertexAttribArray(vTexCoord1);
    gl1.clear(gl1.COLOR_BUFFER_BIT | gl1.DEPTH_BUFFER_BIT);

    if (rotateOn) {
        theta[axis] += 2.0;
        gl1.uniform3fv(thetaLoc, theta);
    }
    gl1.drawArrays(gl1.TRIANGLES, 0, pointsArray.length);

    ///////////////// Draw Box 3 /////////////////
    gl2.useProgram(program2);
    gl2.enableVertexAttribArray(vPosition2);
    gl2.enableVertexAttribArray(vTexCoord2);
    gl2.clear(gl2.COLOR_BUFFER_BIT | gl2.DEPTH_BUFFER_BIT);

    if (theta2 > 2 * Math.PI)
        theta2 -= 2 * Math.PI;
    if (theta2 < 0)
        theta2 += 2 * Math.PI;

    if (phi2 > 2 * Math.PI)
        phi2 -= 2 * Math.PI;
    if (phi2 < 0)
        phi2 += 2 * Math.PI;

    if (phi2 >= Math.PI / 2 && phi2 < 3 * Math.PI / 2) {
        up = vec3(0.0, -1.0, 0.0);
    }
    else {
        up = vec3(0.0, 1.0, 0.0);
    }

    eye = vec3(radius * Math.sin(theta2) * Math.cos(phi2),
        radius * Math.sin(phi2),
        radius * Math.cos(theta2) * Math.cos(phi2));

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    gl2.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl2.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    gl2.uniform1i(useBlackLoc, false);
    gl2.drawArrays(gl2.TRIANGLES, 0, pointsArray2.length);

    if (!hasTexture) {
        gl2.uniform1i(useBlackLoc, true);
        for (let i = 0; i < pointsArray2.length; i += 3)
            gl2.drawArrays(gl2.LINE_LOOP, i, 3);
    }

    requestAnimFrame(render);
}