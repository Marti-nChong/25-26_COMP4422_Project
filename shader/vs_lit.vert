attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;
attribute vec3 aVertexTangent;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uLWMatrix;
varying vec2 vTextureCoord;
varying vec3 vVertexNormal;
varying vec3 vTangent;
varying vec3 vBitangent;

void main(void) {
	gl_Position = uPMatrix * uVMatrix * uLWMatrix * vec4(aVertexPosition, 1.0);
	vTextureCoord = aTextureCoord;
	vVertexNormal = normalize(mat3(uLWMatrix) * aVertexNormal);
	vTangent = aVertexTangent;
}