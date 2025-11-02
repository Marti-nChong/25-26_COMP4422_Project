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

    window.myCamera = class myCamera {
        constructor() {
            this.matView = mat4.create();
            this.matProjection = mat4.create();
        }

        setViewMatrix(matView) {
            this.matView = matView;
        }

        getViewMatrix() {
            return this.matView;
        }

        setProjectionMatrix(matProjection) {
            this.matProjection = matProjection;
        }

        getProjectionMatrix() {
            return this.matProjection;
        }
    };

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

        init(vs_source, fs_source)
        {
            this.initBuffers();
            this.initShaders(vs_source, fs_source);
        }

        loadTexture(src)
	    {
	        this.texture = gl.createTexture();
	        this.texture.image = new Image();
	        this.texture.image.onload = () => {
				gl.bindTexture(gl.TEXTURE_2D, this.texture);
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.texture.image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
				gl.bindTexture(gl.TEXTURE_2D, null);
	        }
	        this.texture.image.src = src;
	    }

        loadNormalTexture(src)
		{
	        this.normalTexture = gl.createTexture();
	        this.normalTexture.image = new Image();

			this.normalTexture.image.onload = () => {
				gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.normalTexture.image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
				gl.bindTexture(gl.TEXTURE_2D, null);
			}
	        this.normalTexture.image.src = src;
		}

        initBuffers()
		{
            let myObject = this;
			// initialize WebGL buffers for the mesh (positions, indices, normals)
			OBJ.initMeshBuffers(gl, myObject.OBJ);
			console.log('initBuffers: mesh vertices=', myObject.OBJ.vertices ? myObject.OBJ.vertices.length : 0,
				'indices=', myObject.OBJ.indices ? myObject.OBJ.indices.length : 0,
				'vertexBuffer=', !!myObject.OBJ.vertexBuffer, 'indexBuffer=', !!myObject.OBJ.indexBuffer);
			// Compute tangents if textures and normals are present
			if (myObject.OBJ.textures && myObject.OBJ.vertexNormals) {
				let tangents = myGenerateTangents(myObject.OBJ.vertices, myObject.OBJ.vertexNormals, myObject.OBJ.textures, myObject.OBJ.indices);
				myObject.OBJ.tangentBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, myObject.OBJ.tangentBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, tangents, gl.STATIC_DRAW);
				myObject.OBJ.tangentBuffer.itemSize = 3;
				myObject.OBJ.tangentBuffer.numItems = tangents.length / 3;
			}
        }

        initShaders(vs_source, fs_source)
		{

            
            let makeShader = function(src, type)
            {
                //compile the vertex shader
                let shader = gl.createShader(type);
                gl.shaderSource(shader, src);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    alert("Error compiling shader: " + gl.getShaderInfoLog(shader));
                }
                return shader;
            }
                
			//compile shaders
			// makeShader(code, type)
			let vertexShader = makeShader(vs_source, gl.VERTEX_SHADER);
			let fragmentShader = makeShader(fs_source, gl.FRAGMENT_SHADER);

			// create, attach and link program
			let myglProgram = gl.createProgram();
			gl.attachShader(myglProgram, vertexShader);
			gl.attachShader(myglProgram, fragmentShader);
			gl.linkProgram(myglProgram);
			// support multiple common attribute names
			
			let posLoc = gl.getAttribLocation(myglProgram, "aVertexPosition");
			myglProgram.vertexPositionAttribute = posLoc;

			myglProgram.vertexNormalAttribute = gl.getAttribLocation(myglProgram, "aVertexNormal");
			myglProgram.textureCoordAttribute = gl.getAttribLocation(myglProgram, "aTextureCoord");
			myglProgram.vertexTangentAttribute = gl.getAttribLocation(myglProgram, "aVertexTangent");
			this.setProgram(myglProgram);

			if (!gl.getProgramParameter(myglProgram, gl.LINK_STATUS)) {
				alert("Unable to initialize the shader program (program 1).\n" + gl.getProgramInfoLog(myglProgram));
			}

            myglProgram.pMatrixUniform = gl.getUniformLocation(myglProgram, "uPMatrix");
			myglProgram.vMatrixUniform = gl.getUniformLocation(myglProgram, "uVMatrix");
			myglProgram.lwMatrixUniform = gl.getUniformLocation(myglProgram, "uLWMatrix");
		}

        draw(camera)
        {
            let Myprogram = this.getProgram();
            let lwMatrix = this.getMatrix();
            let vMatrix = camera.getViewMatrix();
            let pMatrix = camera.getProjectionMatrix();

            // Activate program first
            gl.useProgram(Myprogram);;

            if (Myprogram.pMatrixUniform)
				gl.uniformMatrix4fv(Myprogram.pMatrixUniform, false, pMatrix);
			if (Myprogram.vMatrixUniform)
				gl.uniformMatrix4fv(Myprogram.vMatrixUniform, false, vMatrix);
            if (Myprogram.lwMatrixUniform)
                gl.uniformMatrix4fv(Myprogram.lwMatrixUniform, false, lwMatrix );

            // Position attribute (only enable if valid)
            if (Myprogram.vertexPositionAttribute >= 0) {
                gl.enableVertexAttribArray(Myprogram.vertexPositionAttribute);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.OBJ.vertexBuffer);
                var itemSize = this.OBJ.vertexBuffer.itemSize || 3;
                gl.vertexAttribPointer(Myprogram.vertexPositionAttribute, itemSize, gl.FLOAT, false, 0, 0);
            }


            // For Textured objects:
            // Bind textures and set sampler uniforms (albedo -> unit 0, normal -> unit 1)
            let samplerLoc = gl.getUniformLocation(Myprogram, "uSampler");
            let normalSamplerLoc = gl.getUniformLocation(Myprogram, "uNormalSampler");
            let uniformLightDirLoc = gl.getUniformLocation(Myprogram, "uLightDirection");
            if (samplerLoc) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
                gl.uniform1i(samplerLoc, 0);
                // Object 2 not arriving 
            }
            if (normalSamplerLoc) {
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);
                gl.uniform1i(normalSamplerLoc, 1);
            }
            if (uniformLightDirLoc) {
                gl.uniform3fv(uniformLightDirLoc, mainDirectionLight);
                console.log("Uploaded light direction: " + mainDirectionLight);
            }

            if (Myprogram.textureCoordAttribute >= 0 && this.OBJ.textures.length) {
                gl.enableVertexAttribArray(Myprogram.textureCoordAttribute);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.OBJ.textureBuffer);
                gl.vertexAttribPointer(Myprogram.textureCoordAttribute, this.OBJ.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
            } else if (Myprogram.textureCoordAttribute >= 0) {
                gl.disableVertexAttribArray(Myprogram.textureCoordAttribute);
            }

            // Texture coords if present in shader and mesh
            if (Myprogram.vertexNormalAttribute >= 0 && this.OBJ.vertexNormals.length) {

                gl.enableVertexAttribArray(Myprogram.vertexNormalAttribute);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.OBJ.normalBuffer);
                
                var itemSize = this.OBJ.normalBuffer.itemSize || 3;
                gl.vertexAttribPointer(Myprogram.vertexNormalAttribute, itemSize, gl.FLOAT, false, 0, 0);
            } else if (Myprogram.vertexNormalAttribute >= 0) {
                gl.disableVertexAttribArray(Myprogram.vertexNormalAttribute);
            }

            if (Myprogram.vertexTangentAttribute >= 0 && this.OBJ.tangentBuffer) {
                gl.enableVertexAttribArray(Myprogram.vertexTangentAttribute);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.OBJ.tangentBuffer);
                gl.vertexAttribPointer(Myprogram.vertexTangentAttribute, 3, gl.FLOAT, false, 0, 0);
            } else if (Myprogram.vertexTangentAttribute >= 0) {
                gl.disableVertexAttribArray(Myprogram.vertexTangentAttribute);
            }

            // Binding the triangle index buffer and drawing
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.OBJ.indexBuffer);
            gl.drawElements(gl.TRIANGLES, this.OBJ.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);	
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