/**
 * @schema 2.11
 * @input glyph: string = "FileText"
 * @input weight: string = "regular"
 * @input ink: color = #cacace
 *
 * Phosphor 2.1.10 reference drawing, MIT.
 * License: licenses/phosphor-icons.txt. pen.dev authoring content only.
 */
const paths = {
  FileText: "M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-32-80a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,136Zm0,32a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,168Z",
};
if (pencil.input.weight !== "regular" || !paths[pencil.input.glyph]) {
  throw new Error("Unsupported List drawing: " + pencil.input.glyph + "/" + pencil.input.weight);
}
return [{
  type: "path",
  name: "Phosphor " + pencil.input.glyph + " / regular",
  x: 0,
  y: 0,
  width: pencil.width,
  height: pencil.height,
  geometry: paths[pencil.input.glyph],
  viewBox: [0, 0, 256, 256],
  fill: pencil.input.ink,
}];
