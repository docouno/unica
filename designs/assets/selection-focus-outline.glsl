precision highp float;
/** @resolution */
uniform vec2 u_resolution;
/**
 * @label Focus colour
 * @color
 */
uniform vec4 u_ink;
/** @label Native corner radius */
uniform float u_radius;
void main() {
 vec2 p=gl_FragCoord.xy;
 float radius=clamp(u_radius,0.0,min(u_resolution.x,u_resolution.y)*0.5);
 vec2 q=abs(p-u_resolution*0.5)-u_resolution*0.5+radius;
 float distance=length(max(q,0.0))+min(max(q.x,q.y),0.0)-radius;
 float ring=smoothstep(1.5,2.5,distance)*(1.0-smoothstep(3.5,4.5,distance));
 float alpha=ring*u_ink.a;
 gl_FragColor=vec4(u_ink.rgb*alpha,alpha);
}
