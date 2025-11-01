/*
 * Lightweight compatibility wrapper for the page.
 * This file exposes a global `my3DObject` class that the HTML app can
 * instantiate. It expects the page to load `gl-matrix-min.js` (providing
 * a global `mat4`) and `webgl-obj-loader.js` (providing a global `OBJ`) first.
 */

(function () {
    'use strict';

    // Ensure required globals exist when this script runs.
    if (typeof mat4 === 'undefined') {
        console.error('transformation.js: global `mat4` is missing. Make sure gl-matrix is loaded first.');
    }
    if (typeof OBJ === 'undefined') {
        console.error('transformation.js: global `OBJ` is missing. Make sure webgl-obj-loader.js is loaded before this file.');
    }

    // Expose the class as a global so the inline script in the HTML can use it
    // with `new my3DObject(...)`.
    window.my3DObject = class my3DObject {
        constructor(objText) {
            // OBJ.Mesh must be called with `new` to create the mesh instance.
            this.OBJ = new OBJ.Mesh(objText);
            this.mat = mat4.create();
            this.program = null;
            this.texture = null;
        }

        toOrigin(){
            mat4.identity(this.mat);
        }

        translate(x, y, z) {
            mat4.translate(this.mat, [x, y, z]);
        }

        rotate(angle, axis) {
            mat4.rotate(this.mat, angle, axis, this.mat);
        }

        scale(sx, sy, sz) {
            mat4.scale(this.mat, [sx, sy, sz]);
        }

        getMatrix() {
            return this.mat;
        }

        setProgram(program) {
            this.program = program;
        }

        getProgram() {
            return this.program;
        }
    };

})();