/**
 * @schema 2.11
 * @input ink: color = #cacace
 * @input angle: number = 0
 *
 * Static pen.dev outline of Spinner's 24-unit SVG: center 12, radius 10,
 * stroke 3, track opacity .24, arc 26% with round caps.
 */
const point = (r, angle) => [12 + r * Math.cos(angle), 12 + r * Math.sin(angle)];
const pair = p => p.map(v => Number(v.toFixed(7))).join(" ");
const circle = (x, y, r) => `M${x+r} ${y} A${r} ${r} 0 1 1 ${x-r} ${y} A${r} ${r} 0 1 1 ${x+r} ${y} Z`;
const start = pencil.input.angle * Math.PI / 180;
const end = start + .26 * Math.PI * 2;
const cap0 = point(10, start), cap1 = point(10, end);
const arc = `M${pair(point(11.5,start))} A11.5 11.5 0 0 1 ${pair(point(11.5,end))} L${pair(point(8.5,end))} A8.5 8.5 0 0 0 ${pair(point(8.5,start))} Z ` + circle(cap0[0],cap0[1],1.5) + " " + circle(cap1[0],cap1[1],1.5);
const path = (name, geometry, opacity, fillRule) => ({type:"path",name,x:0,y:0,width:pencil.width,height:pencil.height,viewBox:[0,0,24,24],geometry,fill:pencil.input.ink,opacity,fillRule});
return [path("Track",circle(12,12,11.5)+" "+circle(12,12,8.5),.24,"evenodd"),path("Arc",arc,1,"nonzero")];
