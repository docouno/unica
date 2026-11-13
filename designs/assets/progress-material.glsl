precision highp float;
/** @resolution */
uniform vec2 u_resolution;
/**
 * @label Mixed base
 * @color
 * @default #6750dfff
 */ uniform vec4 u_base;
/**
 * @label Mixed high
 * @color
 * @default #6750dfff
 */ uniform vec4 u_high;
/**
 * @label Mixed low
 * @color
 * @default #6750dfff
 */ uniform vec4 u_low;
/**
 * @label Stripe ink
 * @color
 * @default #6750dfff
 */ uniform vec4 u_stripe;
/**
 * @label Lamp
 * @default 0
 */ uniform float u_lamp;
/**
 * @label Unknown
 * @default 0
 */ uniform float u_unknown;
/**
 * @label Logical RTL
 * @default 0
 */ uniform float u_rtl;
void main(){
 vec2 p=vec2(gl_FragCoord.x,u_resolution.y-gl_FragCoord.y);
 // CSS radial illumination and stripe angle stay in physical coordinates.
 // Only the measured-end light follows the writing direction.
 float logicalX=u_rtl>.5?u_resolution.x-p.x:p.x;
 vec4 c=u_base;
 if(u_lamp>.5&&u_unknown<.5){
   float d=length((p-vec2(u_resolution.x*.2,0.0))/vec2(u_resolution.x,u_resolution.y*1.7));
   c=d<.55?mix(u_high,u_base,clamp(d/.55,0.0,1.0)):mix(u_base,u_low,clamp((d-.55)/.45,0.0,1.0));
   float capSpan=min(u_resolution.x,4.0*u_resolution.y);
   float a=clamp(1.0-(u_resolution.x-logicalX)/capSpan,0.0,1.0)*u_high.a;
   c=vec4(mix(c.rgb,u_high.rgb,a),1.0);
 }
 if(u_unknown>.5){
   float phase=mod((p.x+p.y)/1.4142135623730951,20.0);
   float a=step(10.0,phase)*u_stripe.a;
   c=vec4(mix(c.rgb,u_stripe.rgb,a),1.0);
 }
 gl_FragColor=vec4(c.rgb*c.a,c.a);
}
