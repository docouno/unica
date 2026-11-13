precision highp float;
/** @color @label Semantic source colour */
uniform vec4 u_ink;
/** @label Native background alpha */
uniform float u_alpha;
void main() {
  float alpha=u_ink.a*clamp(u_alpha,0.0,1.0);
  gl_FragColor=vec4(u_ink.rgb*alpha,alpha);
}
