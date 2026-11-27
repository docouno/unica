import { defineGlyph } from '../../core/glyph.js';
import type { GlyphDefinition } from '../../core/glyph.js';
import {
  CloseGlyph,
  FieldDangerGlyph,
  FieldSuccessGlyph,
  FileGlyph,
} from '../../internal/glyphs/index.js';

export const fileGlyph: GlyphDefinition = /* @__PURE__ */ defineGlyph(FileGlyph, 'native');
export const removeGlyph: GlyphDefinition = /* @__PURE__ */ defineGlyph(CloseGlyph, 'native');
export const rejectionGlyph: GlyphDefinition = /* @__PURE__ */ defineGlyph(
  FieldDangerGlyph,
  'native',
);
export const successGlyph: GlyphDefinition = /* @__PURE__ */ defineGlyph(
  FieldSuccessGlyph,
  'native',
);
