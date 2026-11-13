precision highp float;
/** @resolution */
uniform vec2 u_resolution;
/**
 * @label Semantic neutral alpha
 * @color
 * @default #ffffff1a
 */
uniform vec4 u_ink;
/**
 * @label Static CSS translate phase
 * @default 0.5
 * @min 0
 * @max 1
 */
uniform float u_phase;
void main() {
  float x = gl_FragCoord.x / u_resolution.x - (2.0 * u_phase - 1.0);
  float gradient = max(0.0, 1.0 - abs(2.0*x - 1.0));
  float alpha = u_ink.a * gradient;
  gl_FragColor = vec4(u_ink.rgb * alpha, alpha);
}
