const cube_frag = `
#ifdef GL_ES 
precision highp float;
#endif

// specific lights
uniform vec3 uLightPosition;

// lights config
uniform float ulightOuterValue;

// common
uniform sampler2D uSampler0;
uniform vec3 uColor;
uniform vec3 uAmbientLightColor;
uniform vec3 uDiffuseLightColor;
uniform vec3 uSpecularLightColor;
uniform float uAmbientCoeff;
uniform float uc1;
uniform float uc2;
uniform vec2 uTextSize;

varying vec2 v_text;
varying vec3 v_norm;
varying vec3 v_surfacePos;

void main() { 
  vec4 colTex = texture2D(uSampler0, v_text);

  vec4 rp = texture2D(uSampler0, v_text + vec2(1.0 / uTextSize[0], 0));
  vec4 lp = texture2D(uSampler0, v_text - vec2(1.0 / uTextSize[0], 0));
  vec4 up = texture2D(uSampler0, v_text + vec2(0, 1.0 / uTextSize[1]));
  vec4 bp = texture2D(uSampler0, v_text - vec2(0, 1.0 / uTextSize[1]));

  vec4 xGrad =  lp - rp;
  vec4 yGrad =  bp - up;

  vec3 norm = normalize(v_norm);
  //vec3 normal = vec3(norm.x + v_text.x*xGrad.x, norm.y + v_text.y*yGrad.y, norm.z);
  vec3 normal = vec3(norm.x + xGrad.x, norm.y + yGrad.y, norm.z);

  float d = distance(uLightPosition, v_surfacePos);
  vec3 dirToLight = normalize(uLightPosition - v_surfacePos); // l
  vec3 reflVec = normalize(reflect(-dirToLight, normal)); // r
  vec3 dirToView = normalize(0.0 - v_surfacePos); // v

  float diffLightDot = max(dot(normal,dirToLight),0.0);
  float specLightDot = max(dot(reflVec,dirToView),0.0);
  float specLightParam = pow(specLightDot, 16.0);

  vec3 LightWeighting =  uAmbientCoeff * uAmbientLightColor + 
    1.0 / (1.0 + uc1*d + uc2*pow(d,2.0)) * 
    (uDiffuseLightColor * diffLightDot + uSpecularLightColor * specLightParam)
      * ulightOuterValue; 
    
  gl_FragColor = vec4(LightWeighting * uColor, 1.0);
}`;

export default cube_frag;