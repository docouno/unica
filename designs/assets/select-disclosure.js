/**
 * @schema 2.11
 * @input glyph: string = "CaretDown"
 * @input ink: color = #b0b0b7
 * Phosphor 2.1.10 regular paths, MIT; licenses/phosphor-icons.txt.
 */
const paths = {
  "CaretDown": "M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z",
  "CaretUp": "M213.66,165.66a8,8,0,0,1-11.32,0L128,91.31,53.66,165.66a8,8,0,0,1-11.32-11.32l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,213.66,165.66Z"
};
return [{type:"path",name:pencil.input.glyph,geometry:paths[pencil.input.glyph]||paths.CaretDown,viewBox:[0,0,256,256],x:0,y:0,width:pencil.width,height:pencil.height,fill:pencil.input.ink}];
