precision highp float;

/** @resolution */
uniform vec2 u_resolution;
/** @label Plate fill @color */
uniform vec4 u_fill;
/** @label Reserved material edge @color */
uniform vec4 u_edge;
/** @label Independent inset focus @color */
uniform vec4 u_focus;
/** @label Plate corner radius */
uniform float u_radius;

float roundBox(vec2 point, vec2 size, float radius) {
  float r = clamp(radius, 0.0, min(size.x, size.y) * 0.5);
  vec2 q = abs(point - size * 0.5) - size * 0.5 + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float coverage(vec2 point, vec2 size, float radius) {
  return 1.0 - smoothstep(-0.5, 0.5, roundBox(point, size, radius));
}

vec4 composite(vec4 tone, float area, vec4 below) {
  float alpha = tone.a * area;
  return vec4(tone.rgb * alpha, alpha) + below * (1.0 - alpha);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  float outer = coverage(p, u_resolution, u_radius);
  float inner = coverage(p - vec2(1.0), u_resolution - vec2(2.0), max(0.0, u_radius - 1.0));
  vec4 paint = composite(u_fill, outer, vec4(0.0));
  paint = composite(u_edge, max(0.0, outer - inner), paint);
  float focusOuter = coverage(p - vec2(2.0), u_resolution - vec2(4.0), max(0.0, u_radius - 2.0));
  float focusInner = coverage(p - vec2(4.0), u_resolution - vec2(8.0), max(0.0, u_radius - 4.0));
  gl_FragColor = composite(u_focus, max(0.0, focusOuter - focusInner) * outer, paint);
}
