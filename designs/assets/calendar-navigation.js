/**
 * @schema 2.11
 * @input glyph: string = "CaretLeft"
 * @input ink: color = #b0b0b7
 * Phosphor 2.1.10 regular paths, MIT; licenses/phosphor-icons.txt.
 */
const paths = {
  "CaretLeft": "M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z",
  "CaretRight": "M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"
};
return [{type:"path",name:pencil.input.glyph,geometry:paths[pencil.input.glyph]||paths.CaretLeft,viewBox:[0,0,256,256],x:0,y:0,width:pencil.width,height:pencil.height,fill:pencil.input.ink}];
