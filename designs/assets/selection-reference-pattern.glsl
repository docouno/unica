precision highp float;
/** @resolution */
uniform vec2 u_resolution;
/**
 * @label Canonical alpha-primary stripe
 * @color
 */
uniform vec4 u_stripe;
/** @label Local pattern phase; exact captured environment phase is not established */
uniform float u_phase;
void main(){
 float cssY=u_resolution.y-gl_FragCoord.y;
 float phase=mod((gl_FragCoord.x+cssY)*0.7071067811865476+u_phase,64.0);
 float mask=step(32.0,phase);
 float alpha=u_stripe.a*mask;
 gl_FragColor=vec4(u_stripe.rgb*alpha,alpha);
}
