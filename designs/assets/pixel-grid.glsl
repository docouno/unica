precision highp float;

/** @resolution */
uniform vec2 u_resolution;
/** @label Minor 24px dot-matrix tone @color */
uniform vec4 u_dotColor;
/** @label Major 96px crosshair tone @color */
uniform vec4 u_crossColor;

vec4 composite(vec4 tone, float area, vec4 below) {
  float alpha = clamp(tone.a * area, 0.0, 1.0);
  return vec4(tone.rgb * alpha, alpha) + below * (1.0 - alpha);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);

  // Minor 24px pixel dot-matrix (`·`)
  vec2 minorCell = mod(p + vec2(12.0), 24.0) - vec2(12.0);
  float dotMask = (1.0 - smoothstep(0.65, 1.35, length(minorCell)));

  // Major 96px ASCII coordinate crosshair (`+`)
  vec2 majorCell = mod(p + vec2(48.0), 96.0) - vec2(48.0);
  float armH = (1.0 - smoothstep(0.45, 0.95, abs(majorCell.y))) *
               (1.0 - smoothstep(3.4, 4.0, abs(majorCell.x)));
  float armV = (1.0 - smoothstep(0.45, 0.95, abs(majorCell.x))) *
               (1.0 - smoothstep(3.4, 4.0, abs(majorCell.y)));
  float crossMask = clamp(max(armH, armV), 0.0, 1.0);

  // Suppress minor dot where major `+` crosshair sits
  float cleanDot = dotMask * (1.0 - step(0.05, crossMask));
  vec4 paint = composite(u_dotColor, cleanDot, vec4(0.0));
  gl_FragColor = composite(u_crossColor, crossMask, paint);
}
