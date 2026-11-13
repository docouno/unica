/** @schema 2.11
 * @input rtl: boolean = false
 * @input ink: color = #6750df73
 */
// Static projection of Progress's measured-end mask. Blur belongs to its host.
const w=pencil.width,h=pencil.height;
//45% near light, rounded once to an8-bit alpha; graph base is opaque.
const ink=pencil.input.ink.slice(0,7)+'73';
let d='M0 50C18 50 24 40 44 24C68 7 83 4 92 9C98 10 100 27 100 50C100 73 98 90 92 91C83 96 68 93 44 76C24 60 18 50 0 50Z';
if(pencil.input.rtl){let x=true;d=d.replace(/-?\d+(?:\.\d+)?/g,n=>{const v=x?100-Number(n):Number(n);x=!x;return String(v)});}
return [{type:'path',geometry:d,x:0,y:0,viewBox:[0,0,100,100],width:w,height:h,fill:{type:'gradient',gradientType:'linear',rotation:pencil.input.rtl?90:-90,colors:[{color:'#00000000',position:0},{color:ink,position:1}]}}];
