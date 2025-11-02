attribute vec3 aVertexPosition;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uLWMatrix;
varying highp vec4 vColor;
void main(void) {
	gl_Position = uPMatrix * uVMatrix * uLWMatrix * vec4(aVertexPosition, 1.0);
	vColor = vec4(1.0, 1.0, 1.0, 1.0);
}