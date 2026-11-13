/**
 * @schema 2.11
 * @input lower: number = 0
 * @input upper: number = 0
 * @input range: boolean = false
 * @input vertical: boolean = false
 * @input rtl: boolean = false
 * @input track: number = 6
 * @input longSide: number = 16
 * @input shortSide: number = 8
 * @input target: number = 40
 * @input radius: number = 2
 * @input railInk: color = #141414
 * @input fillInk: color = #3f2aba
 * @input capBase: color = #4931d1
 * @input capHigh: color = #5f4ad7
 * @input capLow: color = #3f2aba
 * @input alphaBase: color = #2c2b6a80
 * @input alphaHigh: color = #303074bf
 * @input alphaHighest: color = #373682e6
 * @input alphaLow: color = #2c2b6a40
 * @input focusInk: color = #9982ef
 * @input phase: string = "rest"
 * @input focus: number = -1
 * @input appearance: string = "solid"
 * @input availability: string = "editable"
 * @input marks: string = ""
 * @input markLabels: string = ""
 * @input textFont: number = 14
 * @input textLine: number = 20
 * @input textFamily: string = "Roboto"
 * @input textInk: color = #cacace
 * @input textOpacity: number = 1
 * @input singleStop: boolean = false
 *
 * Finite static projection of Slider's native graphic. Values are normalized
 * application data. Numeric helpers come from the named source size/settings
 * profile. Material ingredients remain semantic inputs; no sampled palette.
 */
const a = {...pencil.input, track:Math.max(1,pencil.input.track), longSide:Math.max(8,pencil.input.longSide), shortSide:Math.max(4,pencil.input.shortSide)};
const vertical = a.vertical;
const target = Math.max(a.target, Math.max(a.longSide, a.shortSide) + 8, a.track + 4);
const fullExtent = Math.max(0, vertical ? pencil.height : pencil.width);
const origin = Math.min(fullExtent / 2, a.shortSide / 2);
const length = Math.max(0, fullExtent - origin * 2);
const cross = vertical ? (a.markLabels ? (a.rtl?pencil.width-target/2:target/2) : pencil.width/2) : target/2;
const pos = ratio => origin + length * (vertical || a.rtl ? 1 - ratio : ratio);
const edgePos = ratio => ratio <= 0 ? (vertical || a.rtl ? fullExtent : 0) : ratio >= 1 ? (vertical || a.rtl ? 0 : fullExtent) : pos(ratio);
const lower = a.range ? a.lower : 0;
const upper = a.upper;
const sharp = a.radius <= 0;
const trackR = sharp ? 0 : a.track / 2;
const nodes = [];
const rect = (name, x, y, width, height, fill, extra = {}) => ({
  type: "rectangle", name, x, y, width, height, fill, ...extra,
});
nodes.push(vertical
  ? rect("Continuous free rail", cross-a.track/2, 0, a.track, fullExtent, a.railInk, {cornerRadius:trackR})
  : rect("Continuous free rail", 0, cross-a.track/2, fullExtent, a.track, a.railInk, {cornerRadius:trackR}));
for (const value of a.marks.split(",").filter(Boolean).map(Number)) {
  nodes.push(vertical
    ? rect("Annotation tick "+value,cross-(a.track+4)/2,pos(value)-.5,a.track+4,1,a.railInk)
    : rect("Annotation tick "+value,pos(value)-.5,cross-(a.track+4)/2,1,a.track+4,a.railInk));
}
if (a.markLabels) {
  const values=a.marks.split(",").filter(Boolean).map(Number);
  const labels=a.markLabels.split("|");
  for (let i=0;i<values.length;i++) {
    const value=values[i],content=labels[i]||"";
    const allocation=vertical?Math.max(0,pencil.width-target-8):Math.min(fullExtent/2,target*3);
    const lines=content.split("\n").length;
    const coordinate=pos(value);
    const edge=value===0?"min":value===1?"max":"middle";
    const x=vertical?(a.rtl?0:target+8):edge==="middle"?coordinate-allocation/2:(edge==="min")!==a.rtl?0:fullExtent-allocation;
    const y=vertical?coordinate-lines*a.textLine/2:target+4;
    const textAlign=vertical?(a.rtl?"right":"left"):edge==="middle"?"center":(edge==="min")!==a.rtl?"left":"right";
    nodes.push({type:"text",name:"Annotation label "+value,x,y,width:allocation,textGrowth:"fixed-width",content,fontFamily:a.textFamily,fontSize:a.textFont,lineHeight:a.textLine/a.textFont,fill:a.textInk,opacity:a.textOpacity,textAlign});
  }
}
if (upper > lower) {
  const c0=edgePos(lower),c1=edgePos(upper);
  const start=Math.min(c0,c1),span=Math.abs(c1-c0);
  nodes.push(vertical
    ? rect("Opaque selected extent",cross-a.track/2,start,a.track,span,a.fillInk,{cornerRadius:trackR})
    : rect("Opaque selected extent",start,cross-a.track/2,span,a.track,a.fillInk,{cornerRadius:trackR}));
}
const channels = color => {
  const h=color.replace("#","");
  return [0,2,4,6].map((n,i)=>i===3&&h.length<8?255:parseInt(h.slice(n,n+2),16));
};
const mix = (x,y) => {
  const p=channels(x),q=channels(y),alpha=(p[3]+q[3])/2;
  return "#"+[0,1,2].map(i=>Math.round((p[i]*p[3]+q[i]*q[3])/(p[3]+q[3])).toString(16).padStart(2,"0")).join("")+Math.round(alpha).toString(16).padStart(2,"0");
};
const points=a.range?[[0,lower],[1,upper]]:[[1,upper]];
if (a.phase.startsWith("lower-") && a.availability==="editable") points.reverse();
const focusNodes=[];
for (const [index,value] of points) {
  const label=index===0?"Lower":"Upper";
  const phase=a.availability==="editable"&&!a.singleStop?(a.phase.startsWith(index===0?"lower-":"upper-")?a.phase.split("-")[1]:"rest"):"rest";
  const disabled=a.availability==="disabled";
  const glass=a.appearance==="glass";
  const width=vertical?a.longSide:a.shortSide,height=vertical?a.shortSide:a.longSide;
  const x=vertical?cross-width/2:pos(value)-width/2;
  const y=vertical?pos(value)-height/2:cross-height/2;
  const ink=glass?(disabled?a.alphaLow:phase==="hover"?mix(a.alphaHigh,a.alphaHighest):a.alphaHigh):(disabled?a.capLow:phase==="hover"?a.capHigh:phase==="active"?a.capLow:a.capBase);
  const edge=glass?(disabled?a.alphaLow:phase==="rest"?a.alphaBase:a.alphaHigh):"#00000000";
  const effect=glass?[
    {type:"background_blur",radius:10},
    {type:"shadow",shadowType:"outer",offset:{x:0,y:1},blur:0,color:disabled?a.alphaLow:a.alphaHighest},
    {type:"shadow",shadowType:"inner",offset:{x:0,y:-1},blur:0,color:"#0000000a"},
  ]:sharp?[
    {type:"shadow",shadowType:"outer",offset:{x:1,y:1},blur:0,color:"#00000066"},
  ]:[
    {type:"shadow",shadowType:"outer",offset:{x:0,y:0},blur:2,color:"#0000003d"},
    {type:"shadow",shadowType:"outer",offset:{x:0,y:2},blur:4,color:"#00000047"},
  ];
  nodes.push(rect(label+" grip cap",x,y,width,height,glass?[
    ink,{type:"image",url:"assets/button-glass-noise.png",mode:"stretch"},
  ]:ink,{cornerRadius:a.radius,stroke:edge,strokeWidth:glass?1:0,strokeAlignment:"inner",effect}));
  if (a.focus===index && !disabled) focusNodes.push(rect(label+" keyboard focus contour",x-4,y-4,width+8,height+8,"#00000000",{
    cornerRadius:sharp?0:a.radius+4,stroke:a.focusInk,strokeWidth:2,strokeAlignment:"inner",
  }));
}
return [...nodes,...focusNodes];
