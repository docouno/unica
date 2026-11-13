precision highp float;

/** @resolution */
uniform vec2 u_resolution;
/** @label Corner registration bracket tone @color */
uniform vec4 u_tickColor;

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  vec2 dEdge = min(p, u_resolution - p);

  float armLen = 8.0;
  float strokeW = 1.5;

  float inCornerX = 1.0 - smoothstep(armLen - 0.5, armLen + 0.5, dEdge.x);
  float inCornerY = 1.0 - smoothstep(armLen - 0.5, armLen + 0.5, dEdge.y);

  float onEdgeX = 1.0 - smoothstep(strokeW - 0.35, strokeW + 0.35, dEdge.x);
  float onEdgeY = 1.0 - smoothstep(strokeW - 0.35, strokeW + 0.35, dEdge.y);

  float bracketMask = clamp(max(onEdgeX * inCornerY, onEdgeY * inCornerX), 0.0, 1.0);
  float alpha = clamp(u_tickColor.a * bracketMask, 0.0, 1.0);
  gl_FragColor = vec4(u_tickColor.rgb * alpha, alpha);
}
