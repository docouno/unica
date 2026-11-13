/**
 * @schema 2.11
 * @input glyph: string = "CalendarBlank"
 * @input ink: color = #b0b0b7
 * Phosphor 2.1.10 regular paths, MIT; licenses/phosphor-icons.txt.
 */
const paths={
CalendarBlank:'M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z',
X:'M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z'};
if(!paths[pencil.input.glyph])throw new Error('Unknown picker glyph');
return [{type:'path',name:pencil.input.glyph,geometry:paths[pencil.input.glyph],viewBox:[0,0,256,256],x:0,y:0,width:pencil.width,height:pencil.height,fill:pencil.input.ink}];
