precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler; // base/albedo
uniform sampler2D uNormalSampler; // normal map (displayed directly)
void main(void) {
    // Show normal map colors directly for debugging/visualisation.
    // Samples come in [0,1] and represent tangent-space normals encoded
    // as RGB; we simply output the sampled color.
    vec4 albedoColor = texture2D(uSampler, vTextureCoord);
    vec4 normalColor = texture2D(uNormalSampler, vTextureCoord);
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // Placeholder
    gl_FragColor = albedoColor;
}