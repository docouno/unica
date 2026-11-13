precision highp float;

/** @resolution */
uniform vec2 u_resolution;
/** @label Button content */
uniform sampler2D u_content;
/**
 * @label Focus colour
 * @color
 */
uniform vec4 u_focusColor;
/** @label Top focus radius */
uniform float u_topRadius;
/** @label Bottom focus radius */
uniform float u_bottomRadius;

void main() {
  vec2 p = gl_FragCoord.xy;
  vec4 content = texture2D(u_content, p / u_resolution);
  float radius = p.y >= u_resolution.y * 0.5 ? u_topRadius : u_bottomRadius;
  radius = clamp(radius, 0.0, min(u_resolution.x, u_resolution.y) * 0.5);
  vec2 q = abs(p - u_resolution * 0.5) - u_resolution * 0.5 + radius;
  float distance = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  float ring = smoothstep(-2.5, -1.5, distance) * (1.0 - smoothstep(-0.5, 0.5, distance));
  float alpha = ring * u_focusColor.a;
  gl_FragColor = vec4(u_focusColor.rgb * alpha, alpha) + content * (1.0 - alpha);
}
