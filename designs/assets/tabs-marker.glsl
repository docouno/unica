precision highp float;

/** @resolution */
uniform vec2 u_resolution;
/** @label Clipped material content */
uniform sampler2D u_content;
/**
 * @label Current foreground and selected marker
 * @color
 */
uniform vec4 u_ink;
/** @label Top left radius */
uniform float u_tl;
/** @label Top right radius */
uniform float u_tr;
/** @label Bottom right radius */
uniform float u_br;
/** @label Bottom left radius */
uniform float u_bl;
/** @label Top recipe border */
uniform float u_bt;
/** @label Right recipe border */
uniform float u_brw;
/** @label Bottom recipe border */
uniform float u_bb;
/** @label Left recipe border */
uniform float u_bw;
/** @label Selected marker enabled */
uniform float u_selected;
/** @label Marker axis: 0 bottom, 1 left, 2 right */
uniform float u_axis;

float roundedCoverage(vec2 p) {
  float r = p.y < u_resolution.y * 0.5
    ? (p.x < u_resolution.x * 0.5 ? u_tl : u_tr)
    : (p.x < u_resolution.x * 0.5 ? u_bl : u_br);
  r = clamp(r, 0.0, min(u_resolution.x, u_resolution.y) * 0.5);
  vec2 q = abs(p - u_resolution * 0.5) - u_resolution * 0.5 + r;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  return 1.0 - smoothstep(-0.5, 0.5, d);
}

float bandCoverage(vec2 p, vec2 lo, vec2 hi) {
  return smoothstep(lo.x - 0.5, lo.x + 0.5, p.x)
    * (1.0 - smoothstep(hi.x - 0.5, hi.x + 0.5, p.x))
    * smoothstep(lo.y - 0.5, lo.y + 0.5, p.y)
    * (1.0 - smoothstep(hi.y - 0.5, hi.y + 0.5, p.y));
}

void main() {
  vec4 content = texture2D(u_content, gl_FragCoord.xy / u_resolution);
  vec2 p = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  vec2 lo = vec2(0.0);
  vec2 hi = u_resolution;
  if (u_axis < 0.5) lo.y = hi.y - 2.0;
  else if (u_axis < 1.5) hi.x = lo.x + 2.0;
  else lo.x = hi.x - 2.0;
  float isUnderline = step(1.5, max(u_bb, max(u_bw, u_brw)));
  float alpha = bandCoverage(p, lo, hi) * roundedCoverage(p)
    * u_selected * isUnderline * u_ink.a;
  gl_FragColor = vec4(u_ink.rgb * alpha, alpha) + content * (1.0 - alpha);
}
