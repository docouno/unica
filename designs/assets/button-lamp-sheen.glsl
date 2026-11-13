precision highp float;

/** @resolution */
uniform vec2 u_resolution;
/** @label Overhead lamp dome glow @color */
uniform vec4 u_dome;
/** @label Cursor-reactive backlight hotspot @color */
uniform vec4 u_hotspot;
/** @label Directional top specular crest @color */
uniform vec4 u_topRim;
/** @label Internal bottom grounding shade @color */
uniform vec4 u_bottomShade;
/** @label Button corner radius */
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
  float alpha = clamp(tone.a * area, 0.0, 1.0);
  return vec4(tone.rgb * alpha, alpha) + below * (1.0 - alpha);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  float outer = coverage(p, u_resolution, u_radius);
  float inner = coverage(
    p - vec2(1.0),
    max(vec2(0.0), u_resolution - vec2(2.0)),
    max(0.0, u_radius - 1.0)
  );

  // 1. Overhead elliptical lamp dome across the upper silhouette
  vec2 domeCenter = vec2(u_resolution.x * 0.52, -u_resolution.y * 0.06);
  vec2 domeRadii = vec2(max(1.0, u_resolution.x * 0.78), max(1.0, u_resolution.y * 0.94));
  float domeDist = length((p - domeCenter) / domeRadii);
  float domeArea = pow(clamp(1.0 - domeDist, 0.0, 1.0), 1.6) * outer;
  vec4 paint = composite(u_dome, domeArea, vec4(0.0));

  // 2. Asymmetric cursor-reactive backlight hotspot (upper-left focal glow)
  vec2 spotCenter = vec2(u_resolution.x * 0.29, u_resolution.y * 0.14);
  vec2 spotRadii = vec2(max(1.0, u_resolution.x * 0.46), max(1.0, u_resolution.y * 0.92));
  float spotDist = length((p - spotCenter) / spotRadii);
  float spotArea = pow(clamp(1.0 - spotDist, 0.0, 1.0), 1.85) * outer;
  paint = composite(u_hotspot, spotArea, paint);

  // 3. Internal bottom cushion shade above the tactile 3D keycap base ledge
  float bottomT = clamp(
    (p.y - u_resolution.y * 0.70) / max(1.0, u_resolution.y * 0.30),
    0.0,
    1.0
  );
  paint = composite(u_bottomShade, pow(bottomT, 1.65) * outer, paint);

  // 4. Directional 1px top specular crest boosted toward the backlight hotspot
  float rimBand = max(0.0, outer - inner);
  float topWeight = pow(
    clamp(1.0 - p.y / max(1.0, u_resolution.y * 0.64), 0.0, 1.0),
    1.4
  );
  float spotRimBoost = 0.70 + 0.30 * exp(-pow((p.x / max(1.0, u_resolution.x) - 0.30) / 0.34, 2.0));
  gl_FragColor = composite(u_topRim, rimBand * topWeight * spotRimBoost, paint);
}
