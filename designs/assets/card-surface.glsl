precision highp float;
/** @resolution */
uniform vec2 u_resolution;
/** @label Existing connected surface */
uniform sampler2D u_content;
/** @label Material radius */
uniform float u_radius;
/** @label Bottom material radius */
uniform float u_bottomRadius;
/** @label Lamp material active */
uniform float u_lamp;
/** @label Glass material active */
uniform float u_glass;
/** @label Paint phase rest0 hover1 selected2 active3 disabled4 */
uniform float u_phase;
/** @label Exterior focus active */
uniform float u_focus;
/** @label Native primary horizontal inset */
uniform float u_focusInsetX;
/** @label Native primary top inset */
uniform float u_focusInsetTop;
/** @label Native primary bottom inset */
uniform float u_focusInsetBottom;
/** @color @label Exterior focus tone */
uniform vec4 u_focusInk;
/** @color @label Lamp solid */
uniform vec4 u_solid;
/** @color @label Lamp high solid */
uniform vec4 u_solidHigh;
/** @color @label Lamp lowest solid */
uniform vec4 u_solidLowest;
/** @color @label Lamp offset ink */
uniform vec4 u_offsetInk;
/** @color @label Glass contour ink */
uniform vec4 u_glowInk;
/** @label Cursor effect active */
uniform float u_glow;
/** @label Finite cursor fraction X */
uniform float u_cursorX;
/** @label Finite cursor fraction Y */
uniform float u_cursorY;
/** @label Provider strength: lamp opacity or glass opacity divided by 0.6 */
uniform float u_near;
// Gaussian CDF approximation used by the finite shadow quadrature.
float normalCDF(float x) {
  float a=abs(x), t=1.0/(1.0+.2316419*a);
  float c=.39894228*exp(-.5*a*a)*t*(.31938153+t*(-.35656378+t*(1.78147794+t*(-1.82125598+t*1.33027443))));
  return x>=0.0?1.0-c:c;
}
float roundedDistance(vec2 p, vec2 size, float radius) {
  float r=clamp(radius, 0.0, min(size.x, size.y)*.5);
  vec2 q=abs(p-size*.5)-size*.5+r;
  return length(max(q, 0.0))+min(max(q.x, q.y), 0.0)-r;
}
// Box-shadow blur is modelled with sigma = blur / 2, then integrated over
// the rounded spread shape with 48 ordinate samples. Native CSS uses its own
// raster filter: named-source errors are measured, rather than claiming equality.
float blurredBox(vec2 p, vec2 size, float radius, float blur, float spread) {
  vec2 s=size+2.0*spread;
  p+=spread;
  float r=clamp(radius+spread, 0.0, min(s.x, s.y)*.5);
  if(blur<.1)return 1.0-smoothstep(-.5, .5, roundedDistance(p, s, r));
  float sigma=blur*.5;
  float lo=max(0.0, p.y-3.5*sigma), hi=min(s.y, p.y+3.5*sigma);
  if(hi<=lo)return 0.0;
  float stepY=(hi-lo)/48.0, sum=0.0;
  for(int i=0;i<48;i++) {
    float y=lo+(float(i)+.5)*stepY;
    float edge=max(0.0, r-min(y, s.y-y));
    float inset=r-sqrt(max(0.0, r*r-edge*edge));
    float xcov=normalCDF((s.x-inset-p.x)/sigma)-normalCDF((inset-p.x)/sigma);
    float dy=(y-p.y)/sigma;
    sum+=xcov*.39894228*exp(-.5*dy*dy)*stepY/sigma;
  }
  return sum;
}
vec4 over(vec4 dst, vec4 ink, float opacity) {
  float a=clamp(ink.a*opacity, 0.0, 1.0);
  return vec4(ink.rgb*a, a)+dst*(1.0-a);
}
// The unblurred 72px radial source; the main pass applies CSS filter blur(10px)
// as sigma 10, using a normalized 9 by 9 kernel over the finite three-sigma range.
vec4 spot(vec2 p, vec2 size, float radius, vec2 cursor) {
  float mask=1.0-smoothstep(-.5, .5, roundedDistance(p, size, radius));
  float t=length(p-cursor)/72.0;
  if(t>=.68)return vec4(0.0);
  vec4 c=t<=.35?mix(u_solidHigh, u_solid, t/.35):mix(u_solid, vec4(u_solid.rgb, 0.0), (t-.35)/.33);
  return vec4(c.rgb*c.a, c.a)*mask;
}
// The connected master reserves 4px around the material for the 2px outline
// at offset 2. Transparent native shadow bounds retain the outer halo.
void main() {
  vec2 raw=gl_FragCoord.xy, p=vec2(raw.x, u_resolution.y-raw.y)-4.0, size=u_resolution-8.0;
  vec4 content=texture2D(u_content, raw/u_resolution);
  float radius=p.y<size.y*.5?u_radius:u_bottomRadius;
  float d=roundedDistance(p, size, radius);
  vec4 paint=vec4(0.0);
  // Opaque interior pixels already cover every underlying light layer.
  // Keep the original object elsewhere, including authored overflow.
  if(u_lamp>.5&&d<-.5&&content.a>.999) {
    gl_FragColor=content;
    return;
  }
  if(u_lamp>.5) {
    if(u_phase<2.5) {
      bool strong=u_phase>.5;
      paint=over(paint, u_solid, (strong?.35:.22)*blurredBox(p, size, radius, strong?56.0:44.0, strong?6.0:4.0));
      paint=over(paint, strong?u_solidHigh:u_solid, (strong?.65:.45)*blurredBox(p, size, radius, strong?26.0:20.0, strong?3.0:2.0));
      paint=over(paint, u_offsetInk, blurredBox(p-vec2(2.0, 3.0), size, radius, 0.0, 0.0));
    } else if(u_phase<3.5)paint=over(paint, u_solidLowest, blurredBox(p-vec2(1.0), size, radius, 0.0, 0.0));
    if(u_glow>.5&&u_phase<2.5) {
      vec4 glow=vec4(0.0);
      float total=0.0;
      for(int j=-4;j<=4;j++)for(int i=-4;i<=4;i++) {
        vec2 delta=vec2(float(i), float(j))*7.5;
        float weight=exp(-dot(delta, delta)/200.0);
        glow+=spot(p+delta, size, radius, size*vec2(u_cursorX, u_cursorY))*weight;
        total+=weight;
      }
      glow*=u_near/max(.0001, total);
      paint=glow+paint*(1.0-glow.a);
    }
    paint=content+paint*(1.0-content.a);
  }
  else paint=content;
  // A glass Card has a 1px border. The pseudo-element is positioned against
  // its padding box: inset -1 returns to the root border box. Its outer radius
  // is R + 1; its 1px content-box cut has radius R and origin (1, 1).
  if(u_glass>.5&&u_glow>.5&&u_phase<3.5) {
    float outerD=roundedDistance(p, size, radius+1.0);
    float innerD=roundedDistance(p-1.0, size-2.0, radius);
    float ring=max(0.0, (1.0-smoothstep(-.5, .5, outerD))-(1.0-smoothstep(-.5, .5, innerD)));
    float radial=max(0.0, 1.0-length(p-size*vec2(u_cursorX, u_cursorY))/108.0);
    paint=over(paint, u_glowInk, ring*radial*.6*u_near);
  }
  if(u_focus>.5) {
    // A service primary uses the root padding box; a native root uses zero
    // insets. Keep its own physical contour instead of outlining the material.
    vec2 focusP=p-vec2(u_focusInsetX, u_focusInsetTop);
    vec2 focusSize=size-vec2(2.0*u_focusInsetX, u_focusInsetTop+u_focusInsetBottom);
    float focusRadius=focusP.y<focusSize.y*.5?u_radius:u_bottomRadius;
    float focusDistance=roundedDistance(focusP, focusSize, focusRadius);
    float ring=smoothstep(1.5, 2.5, focusDistance)*(1.0-smoothstep(3.5, 4.5, focusDistance));
    paint=over(paint, u_focusInk, ring);
  }
  gl_FragColor=paint;
}
