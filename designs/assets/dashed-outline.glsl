precision highp float;
/** @resolution */
uniform vec2 u_resolution;
/**
 * @label Dash colour
 * @color
 */
uniform vec4 u_ink;
/** @label Corner radius */
uniform float u_radius;
/** @label Stroke width */
uniform float u_width;

void main() {
  vec2 p = gl_FragCoord.xy;
  vec2 b = u_resolution * 0.5;
  float r = clamp(u_radius, 0.0, min(b.x, b.y));
  float w = max(1.25, u_width);
  vec2 h = max(b - r, vec2(0.0));
  vec2 c = p - b;
  vec2 q = abs(c) - h;
  float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;

  float ring = smoothstep(-w - 0.35, -w + 0.35, dist) * (1.0 - smoothstep(-0.35, 0.35, dist));

  float arc = 1.57079632679 * r;
  float perim = 4.0 * (h.x + h.y + arc);
  float nDashes = max(4.0, floor(perim / 10.0 + 0.5));
  float period = perim / nDashes;

  float s = 0.0;
  if (c.y >= h.y && abs(c.x) <= h.x) {
    s = c.x + h.x;
  } else if (c.x > h.x && c.y > h.y) {
    s = 2.0 * h.x + atan(c.x - h.x, c.y - h.y) * r;
  } else if (c.x >= h.x && abs(c.y) <= h.y) {
    s = 2.0 * h.x + arc + (h.y - c.y);
  } else if (c.x > h.x && c.y < -h.y) {
    s = 2.0 * h.x + arc + 2.0 * h.y + atan(-h.y - c.y, c.x - h.x) * r;
  } else if (c.y <= -h.y && abs(c.x) <= h.x) {
    s = 2.0 * h.x + 2.0 * arc + 2.0 * h.y + (h.x - c.x);
  } else if (c.x < -h.x && c.y < -h.y) {
    s = 4.0 * h.x + 2.0 * arc + 2.0 * h.y + atan(-h.x - c.x, -h.y - c.y) * r;
  } else if (c.x <= -h.x && abs(c.y) <= h.y) {
    s = 4.0 * h.x + 3.0 * arc + 2.0 * h.y + (c.y + h.y);
  } else {
    s = 4.0 * h.x + 3.0 * arc + 4.0 * h.y + atan(c.y - h.y, -h.x - c.x) * r;
  }

  float phase = mod(s, period);
  float dashLen = period * 0.58;
  float dash = smoothstep(0.0, 0.65, phase) * (1.0 - smoothstep(dashLen - 0.65, dashLen, phase));

  float alpha = ring * dash * u_ink.a;
  gl_FragColor = vec4(u_ink.rgb * alpha, alpha);
}
