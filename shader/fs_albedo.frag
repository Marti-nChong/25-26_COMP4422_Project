precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler; // base/albedo
void main(void) {
    // Show normal map colors directly for debugging/visualisation.
    // Samples come in [0,1] and represent tangent-space normals encoded
    // as RGB; we simply output the sampled color.
    vec4 albedoColor = texture2D(uSampler, vTextureCoord);
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // Placeholder
    gl_FragColor = albedoColor;
}