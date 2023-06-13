const cube_vert = `
attribute vec3 a_pos;
attribute vec3 a_norm;
attribute vec2 a_text;

uniform mat4 u_model;
uniform mat4 u_proj;
uniform mat3 uNMatrix;

varying vec2 v_text;
varying vec3 v_norm;
varying vec3 v_surfacePos;

void main() {
  vec4 surfacePos = u_model * vec4(a_pos, 1.0);
  v_surfacePos = surfacePos.xyz / surfacePos.w;
  v_norm = normalize(uNMatrix * a_norm);
  v_text = a_text;

  gl_Position = u_proj * surfacePos;
}`;

export default cube_vert;