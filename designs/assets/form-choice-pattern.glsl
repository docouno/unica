precision highp float;
/** @resolution */
uniform vec2 u_resolution;
void main() {
  vec2 p=vec2(gl_FragCoord.x,u_resolution.y-gl_FragCoord.y);
  float axis=dot(p,vec2(0.573576436,-0.819152044))+u_resolution.y*0.819152044;
  float stripe=step(32.0,mod(axis,64.0));
  gl_FragColor=mix(vec4(0.08627451,0.20784314,0.28235294,1.0),vec4(0.27058824,0.14117647,0.23137255,1.0),stripe);
}
