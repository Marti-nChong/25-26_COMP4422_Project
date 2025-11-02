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

    // Provide a generateTangents function that doesn't rely on Vector3
    window.myGenerateTangents = function(vertices, normals, texCoords, indices) {
        let tangents = new Float32Array(vertices.length);

        let count = indices.length;
        for (let i = 0; i < count; i += 3) {
            // edge vectors
            let vi1 = indices[i] * 3;
            let vi2 = indices[i + 1] * 3;
            let vi3 = indices[i + 2] * 3;
            let e1 = [vertices[vi2] - vertices[vi1], vertices[vi2 + 1] - vertices[vi1 + 1], vertices[vi2 + 2] - vertices[vi1 + 2]];
            let e2 = [vertices[vi3] - vertices[vi1], vertices[vi3 + 1] - vertices[vi1 + 1], vertices[vi3 + 2] - vertices[vi1 + 2]];

            // delta texcoords vectors
            let ti1 = indices[i] * 2;
            let ti2 = indices[i + 1] * 2;
            let ti3 = indices[i + 2] * 2;
            let d1 = [texCoords[ti2] - texCoords[ti1], texCoords[ti2 + 1] - texCoords[ti1 + 1]];
            let d2 = [texCoords[ti3] - texCoords[ti1], texCoords[ti3 + 1] - texCoords[ti1 + 1]];

            let id = 1 / (d1[0] * d2[1] - d1[1] * d2[0]);   // inverse determinant

            let t = [id * (d2[1] * e1[0] - d1[1] * e2[0]), id * (d2[1] * e1[1] - d1[1] * e2[1]), id * (d2[1] * e1[2] - d1[1] * e2[2])];

            // normalize t
            let len = Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]);
            if (len > 0) {
                t[0] /= len;
                t[1] /= len;
                t[2] /= len;
            }

            // make perpendicular to vertex normal: T - (T.N) * N
            let n1 = [normals[vi1], normals[vi1 + 1], normals[vi1 + 2]];
            let n2 = [normals[vi2], normals[vi2 + 1], normals[vi2 + 2]];
            let n3 = [normals[vi3], normals[vi3 + 1], normals[vi3 + 2]];

            let dot1 = t[0] * n1[0] + t[1] * n1[1] + t[2] * n1[2];
            let t1 = [t[0] - n1[0] * dot1, t[1] - n1[1] * dot1, t[2] - n1[2] * dot1];
            len = Math.sqrt(t1[0] * t1[0] + t1[1] * t1[1] + t1[2] * t1[2]);
            if (len > 0) {
                t1[0] /= len;
                t1[1] /= len;
                t1[2] /= len;
            }

            let dot2 = t[0] * n2[0] + t[1] * n2[1] + t[2] * n2[2];
            let t2 = [t[0] - n2[0] * dot2, t[1] - n2[1] * dot2, t[2] - n2[2] * dot2];
            len = Math.sqrt(t2[0] * t2[0] + t2[1] * t2[1] + t2[2] * t2[2]);
            if (len > 0) {
                t2[0] /= len;
                t2[1] /= len;
                t2[2] /= len;
            }

            let dot3 = t[0] * n3[0] + t[1] * n3[1] + t[2] * n3[2];
            let t3 = [t[0] - n3[0] * dot3, t[1] - n3[1] * dot3, t[2] - n3[2] * dot3];
            len = Math.sqrt(t3[0] * t3[0] + t3[1] * t3[1] + t3[2] * t3[2]);
            if (len > 0) {
                t3[0] /= len;
                t3[1] /= len;
                t3[2] /= len;
            }

            // copy
            tangents[vi1] = t1[0];
            tangents[vi1 + 1] = t1[1];
            tangents[vi1 + 2] = t1[2];
            tangents[vi2] = t2[0];
            tangents[vi2 + 1] = t2[1];
            tangents[vi2 + 2] = t2[2];
            tangents[vi3] = t3[0];
            tangents[vi3 + 1] = t3[1];
            tangents[vi3 + 2] = t3[2];
        }

        return tangents;
    };

})();