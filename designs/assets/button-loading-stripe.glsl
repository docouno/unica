precision highp float;

/** @resolution */
uniform vec2 u_resolution;

/**
 * @label Stripe colour
 * @color
 * @default #ffffff38
 */
uniform vec4 u_stripeColor;

void main() {
  float yFromTop = u_resolution.y - gl_FragCoord.y;
  float phase = mod((gl_FragCoord.x - yFromTop) / 1.4142135623730951, 20.0);
  float stripe = step(10.0, phase);
  float alpha = u_stripeColor.a * stripe;
  gl_FragColor = vec4(u_stripeColor.rgb * alpha, alpha);
}
