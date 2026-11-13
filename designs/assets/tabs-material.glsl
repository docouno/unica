precision highp float;

/** @resolution */
uniform vec2 u_resolution;
/** @label Paint layer: 0 material, 1 exterior focus */
uniform float u_layer;
/**
 * @label Material fill
 * @color
 */
uniform vec4 u_fill;
/**
 * @label Recipe edge
 * @color
 */
uniform vec4 u_edge;
/**
 * @label Current foreground and selected marker
 * @color
 */
uniform vec4 u_ink;
/**
 * @label Focus contour
 * @color
 */
uniform vec4 u_focus;
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

float distanceToRoundBox(vec2 p, vec2 box, vec4 radii) {
  float r = p.y < box.y * 0.5
    ? (p.x < box.x * 0.5 ? radii.x : radii.y)
    : (p.x < box.x * 0.5 ? radii.w : radii.z);
  r = clamp(r, 0.0, min(box.x, box.y) * 0.5);
  vec2 q = abs(p - box * 0.5) - box * 0.5 + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float boxCoverage(vec2 p, vec2 lo, vec2 hi) {
  return smoothstep(lo.x - 0.5, lo.x + 0.5, p.x)
    * (1.0 - smoothstep(hi.x - 0.5, hi.x + 0.5, p.x))
    * smoothstep(lo.y - 0.5, lo.y + 0.5, p.y)
    * (1.0 - smoothstep(hi.y - 0.5, hi.y + 0.5, p.y));
}

vec4 over(vec4 upper, vec4 lower) {
  return vec4(upper.rgb * upper.a + lower.rgb * lower.a * (1.0 - upper.a),
    upper.a + lower.a * (1.0 - upper.a));
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  vec4 radii = vec4(u_tl, u_tr, u_br, u_bl);
  if (u_layer > 0.5) {
    float d = distanceToRoundBox(p, u_resolution, radii + vec4(4.0));
    float ring = smoothstep(-2.5, -1.5, d) * (1.0 - smoothstep(-0.5, 0.5, d));
    float alpha = ring * u_focus.a;
    gl_FragColor = vec4(u_focus.rgb * alpha, alpha);
    return;
  }
  float outside = 1.0 - smoothstep(-0.5, 0.5,
    distanceToRoundBox(p, u_resolution, radii));
  vec2 origin = vec2(u_bw, u_bt);
  vec2 inner = u_resolution - origin - vec2(u_brw, u_bb);
  vec4 innerRadii = max(vec4(0.0), radii - vec4(
    max(u_bw, u_bt), max(u_brw, u_bt), max(u_brw, u_bb), max(u_bw, u_bb)));
  float inside = 1.0 - smoothstep(-0.5, 0.5,
    distanceToRoundBox(p - origin, inner, innerRadii));
  float border = max(0.0, outside - inside);
  vec4 paint = vec4(u_fill.rgb * u_fill.a * outside, u_fill.a * outside);
  float edgeAlpha = border * u_edge.a;
  paint = vec4(u_edge.rgb * edgeAlpha, edgeAlpha) + paint * (1.0 - edgeAlpha);
  vec2 lo = vec2(0.0);
  vec2 hi = u_resolution;
  if (u_axis < 0.5) lo.y = hi.y - 2.0;
  else if (u_axis < 1.5) hi.x = lo.x + 2.0;
  else lo.x = hi.x - 2.0;
  float isUnderline = step(1.5, max(u_bb, max(u_bw, u_brw)));
  float marker = boxCoverage(p, lo, hi) * outside * u_selected * isUnderline * u_ink.a;
  gl_FragColor = vec4(u_ink.rgb * marker, marker) + paint * (1.0 - marker);
}
