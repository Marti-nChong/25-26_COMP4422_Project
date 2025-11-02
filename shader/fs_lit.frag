precision mediump float;
varying vec3 vVertexNormal;
varying vec2 vTextureCoord;
varying vec3 vTangent;
varying vec3 vBitangent;
uniform sampler2D uSampler; // base/albedo
uniform sampler2D uNormalSampler; // normal map
void main(void) {
    vec4 albedoColor = texture2D(uSampler, vTextureCoord);
    vec4 normalColor = texture2D(uNormalSampler, vTextureCoord);

    // Normal map in tangent space
    vec3 normalMap = normalize(normalColor.xyz * 2.0 - 1.0);

    // TBN matrix
    mat3 tbn = mat3(vTangent, vBitangent, vVertexNormal);

    // Transform to world space
    vec3 normal = normalize(tbn * normalMap);

    vec3 lightDir = normalize(vec3(1.0, 0.0, 0.0));
    float lightIntensity = max(dot(normal, lightDir), 0.0);
    gl_FragColor = vec4(albedoColor.rgb * lightIntensity, albedoColor.a);
}