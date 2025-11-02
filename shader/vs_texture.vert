attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uLWMatrix;
varying vec2 vTextureCoord;
void main(void) {
	gl_Position = uPMatrix * uVMatrix * uLWMatrix * vec4(aVertexPosition, 1.0);
	vTextureCoord = aTextureCoord;
}