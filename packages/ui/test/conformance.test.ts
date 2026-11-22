// @vitest-environment node
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { transform as lightningTransform } from 'lightningcss';
import postcss from 'postcss';
import type { AtRule, Declaration, Rule } from 'postcss';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const PKG_ROOT = resolve(import.meta.dirname, '..');
const SRC_ROOT = resolve(PKG_ROOT, 'src');
const COMPONENTS_ROOT = resolve(SRC_ROOT, 'components');
const INTERNAL_ROOT = resolve(SRC_ROOT, 'internal');

const PROTOCOL_DATA_ATTRS = new Set([
  'data-theme',
  'data-surface',
  'data-text-scale',
  'data-side',
  'data-align',
]);

const EXTERNAL_CSS_HOOKS = new Set([
  '--anchor-width',
  '--overlay-available-height',
  '--overlay-available-width',
  '--badge-max-width',
  '--element-radius',
  '--kbd-bg',
  '--kbd-border',
  '--kbd-fg',
  '--kbd-forced-fg',
  '--kbd-shadow',
]);

const SERVER_RUNTIME_EXPORTS = ['THEME_PRESETS', 'defineGlyph', 'getUnicaRootProps'] as const;

async function collectFiles(dirPath: string, exts: readonly string[]): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const full = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectFiles(full, exts)));
    } else if (entry.isFile() && exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results.sort();
}

function loadSourceProgram(): {
  program: ts.Program;
  checker: ts.TypeChecker;
  options: ts.CompilerOptions;
} {
  const configPath = resolve(PKG_ROOT, 'tsconfig.json');
  const configFile = ts.readConfigFile(configPath, (file) => ts.sys.readFile(file));
  if (configFile.error) {
    throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
  }
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, PKG_ROOT);
  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
  });
  return { program, checker: program.getTypeChecker(), options: parsed.options };
}

function typeCheckVirtualFiles(
  baseProgram: ts.Program,
  options: ts.CompilerOptions,
  files: Readonly<Record<string, string>>,
): Map<string, readonly ts.Diagnostic[]> {
  const virtualMap = new Map<string, string>();
  const rootNames: string[] = [];
  for (const [name, source] of Object.entries(files)) {
    const full = resolve(PKG_ROOT, 'test', name);
    virtualMap.set(full, source);
    rootNames.push(full);
  }
  const checkOptions: ts.CompilerOptions = {
    ...options,
    noEmit: true,
    isolatedDeclarations: false,
    exactOptionalPropertyTypes: true,
    strict: true,
  };
  const baseHost = ts.createCompilerHost(checkOptions);
  const host: ts.CompilerHost = {
    ...baseHost,
    fileExists(path) {
      return virtualMap.has(resolve(path)) || baseHost.fileExists(path);
    },
    readFile(path) {
      const content = virtualMap.get(resolve(path));
      return content !== undefined ? content : baseHost.readFile(path);
    },
    getSourceFile(path, languageVersion, onError, shouldCreate) {
      const resolved = resolve(path);
      const content = virtualMap.get(resolved);
      if (content !== undefined) {
        return ts.createSourceFile(path, content, languageVersion);
      }
      return (
        baseProgram.getSourceFile(path) ??
        baseHost.getSourceFile(path, languageVersion, onError, shouldCreate)
      );
    },
  };
  const checkProgram = ts.createProgram({
    rootNames,
    options: checkOptions,
    host,
    oldProgram: baseProgram,
  });
  const results = new Map<string, readonly ts.Diagnostic[]>();
  for (const [name] of Object.entries(files)) {
    const full = resolve(PKG_ROOT, 'test', name);
    const sf = checkProgram.getSourceFile(full);
    if (!sf) {
      throw new Error(`Failed to load virtual source file ${full}`);
    }
    results.set(name, [
      ...checkProgram.getSyntacticDiagnostics(sf),
      ...checkProgram.getSemanticDiagnostics(sf),
    ]);
  }
  return results;
}

function resolveAliasedSymbol(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  return (symbol.flags & ts.SymbolFlags.Alias) !== 0 ? checker.getAliasedSymbol(symbol) : symbol;
}

function exportsByKind(
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
): { types: Set<string>; values: Set<string> } {
  const modSym = checker.getSymbolAtLocation(sourceFile);
  if (!modSym) {
    throw new Error(`Missing module symbol for ${sourceFile.fileName}`);
  }
  const types = new Set<string>();
  const values = new Set<string>();
  for (const sym of checker.getExportsOfModule(modSym)) {
    const target = resolveAliasedSymbol(checker, sym);
    if ((target.flags & ts.SymbolFlags.Type) !== 0) {
      types.add(sym.name);
    }
    if ((target.flags & ts.SymbolFlags.Value) !== 0) {
      values.add(sym.name);
    }
  }
  return { types, values };
}

function isUndefinedAllowed(type: ts.Type): boolean {
  if ((type.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0) {
    return true;
  }
  if (type.isUnion()) {
    return type.types.some(isUndefinedAllowed);
  }
  return false;
}

function isNeverType(type: ts.Type): boolean {
  if ((type.flags & ts.TypeFlags.Never) !== 0) {
    return true;
  }
  if (type.isUnion()) {
    const nonUndef = type.types.filter((part) => (part.flags & ts.TypeFlags.Undefined) === 0);
    return nonUndef.length === 0 || nonUndef.every(isNeverType);
  }
  return false;
}

function hasReadonlyModifier(decl: ts.Declaration): boolean {
  if (ts.isPropertySignature(decl) || ts.isPropertyDeclaration(decl)) {
    return Boolean(
      ts.canHaveModifiers(decl) &&
      ts.getModifiers(decl)?.some((mod) => mod.kind === ts.SyntaxKind.ReadonlyKeyword),
    );
  }
  return true;
}

function inOwnSource(decl: ts.Declaration): boolean {
  const file = resolve(decl.getSourceFile().fileName);
  return file.startsWith(SRC_ROOT + '/');
}

function isInsideForcedColors(node: postcss.Node): boolean {
  let parent = node.parent;
  while (parent) {
    if (parent.type === 'atrule') {
      const at = parent as AtRule;
      if (at.name === 'media' && /forced-colors\s*:\s*active/i.test(at.params)) {
        return true;
      }
    }
    parent = parent.parent;
  }
  return false;
}

describe('Unica package conformance gate', () => {
  const { program, checker, options } = loadSourceProgram();
  const indexSf = program.getSourceFile(resolve(SRC_ROOT, 'index.ts'))!;
  const serverSf = program.getSourceFile(resolve(SRC_ROOT, 'server.ts'))!;

  it('maintains 1:1 exported types between index.ts and server.ts with exact server runtime exports', async () => {
    const indexExports = exportsByKind(checker, indexSf);
    const serverExports = exportsByKind(checker, serverSf);

    expect([...serverExports.types].sort()).toEqual([...indexExports.types].sort());
    expect([...serverExports.values].sort()).toEqual([...SERVER_RUNTIME_EXPORTS]);

    const serverModule = (await import('../src/server.js')) as Record<string, unknown>;
    expect(Object.keys(serverModule).sort()).toEqual([...SERVER_RUNTIME_EXPORTS]);

    // server.ts must not import any CSS files or components runtime
    for (const stmt of serverSf.statements) {
      if (
        (ts.isImportDeclaration(stmt) || ts.isExportDeclaration(stmt)) &&
        stmt.moduleSpecifier &&
        ts.isStringLiteral(stmt.moduleSpecifier)
      ) {
        expect(stmt.moduleSpecifier.text).not.toMatch(/\.css$/);
      }
    }

    // All component imports/exports in src/index.ts must pass through ./components/<Family>/index.js
    for (const stmt of indexSf.statements) {
      if (
        (ts.isImportDeclaration(stmt) || ts.isExportDeclaration(stmt)) &&
        stmt.moduleSpecifier &&
        ts.isStringLiteral(stmt.moduleSpecifier) &&
        stmt.moduleSpecifier.text.startsWith('./components/')
      ) {
        expect(stmt.moduleSpecifier.text).toMatch(/^\.\/components\/[A-Za-z0-9]+\/index\.js$/);
      }
    }
  });

  it('validates UnicaComponentDefaults axes against component props and explicit named exports', () => {
    const indexExports = exportsByKind(checker, indexSf);
    const serverExports = exportsByKind(checker, serverSf);
    const indexModSym = checker.getSymbolAtLocation(indexSf)!;
    const exportsMap = new Map(checker.getExportsOfModule(indexModSym).map((s) => [s.name, s]));

    const defaultsSym = exportsMap.get('UnicaComponentDefaults');
    expect(defaultsSym).toBeDefined();
    const defaultsType = checker.getDeclaredTypeOfSymbol(
      resolveAliasedSymbol(checker, defaultsSym!),
    );

    const familyProps = defaultsType.getProperties();
    expect(familyProps.length).toBeGreaterThanOrEqual(2);

    for (const familyProp of familyProps) {
      const familyName = familyProp.name;
      const componentSym = exportsMap.get(familyName);
      expect(componentSym, `Defaultable family ${familyName} must be exported`).toBeDefined();
      const propsTypeSym = exportsMap.get(`${familyName}Props`);
      expect(propsTypeSym, `${familyName}Props must be exported`).toBeDefined();
      const componentPropsType = checker.getDeclaredTypeOfSymbol(
        resolveAliasedSymbol(checker, propsTypeSym!),
      );

      const familyDefaultsType = checker.getNonNullableType(
        checker.getTypeOfSymbolAtLocation(familyProp, indexSf),
      );
      for (const axisProp of familyDefaultsType.getProperties()) {
        const axisName = axisProp.name;
        const axisTypeName = `${familyName}${axisName[0]!.toUpperCase()}${axisName.slice(1)}`;
        expect(
          indexExports.types.has(axisTypeName),
          `${axisTypeName} must be explicitly exported from src/index.ts`,
        ).toBe(true);
        expect(
          serverExports.types.has(axisTypeName),
          `${axisTypeName} must be explicitly exported from src/server.ts`,
        ).toBe(true);

        const targetProp = componentPropsType.getProperty(axisName);
        expect(
          targetProp,
          `${familyName}Props must expose defaultable axis "${axisName}"`,
        ).toBeDefined();
        expect(
          (targetProp!.flags & ts.SymbolFlags.Optional) !== 0,
          `${familyName}Props.${axisName} must be optional`,
        ).toBe(true);
      }
    }
  });

  it('compiles positive consumer contracts and rejects invalid usages under exactOptionalPropertyTypes', () => {
    const positiveMain = `
      import {
        Badge,
        Blockquote,
        Box,
        Code,
        Container,
        Divider,
        Flex,
        Grid,
        GridItem,
        Progress,
        ProgressCircle,
        Stack,
        VisuallyHidden,
      } from '../src/index.js';
      import type {
        BlockquoteStatus,
        CodeStatus,
        IconSize,
        LinkSize,
        Spacing,
        UnicaRootAttributes,
        VisuallyHiddenProps,
      } from '../src/index.js';

      const s0: Spacing = 0;
      const s12: Spacing = 12;
      const s64: Spacing = 64;
      const bStatus: BlockquoteStatus = 'warning';
      const cStatus: CodeStatus = 'danger';
      const iSize: IconSize = 'm';
      const lSize: LinkSize = 'body-s';
      const rootAttrs: UnicaRootAttributes = { 'data-theme': 'soft-dark' };
      const vhProps: VisuallyHiddenProps<'div'> = { as: 'div', children: 'Hidden' };

      export const view = (
        <div {...rootAttrs} data-i={iSize} data-l={lSize}>
          <Box padding={s0} margin={{ tablet: s12, desktop: s64 }}>
            <Container size="m" centered={false} gutter={16}>
              <Flex gap={12}>
                <Stack gap={8}>
                  <Grid columns={2} gap={16}>
                    <GridItem span={1}>
                      <Badge style={{ '--badge-max-width': undefined }}>Ok</Badge>
                      <Blockquote status={bStatus}>Quote</Blockquote>
                      <Code status={cStatus} plate={false}>code</Code>
                      <Divider data-owner={true} />
                      <Progress value={50} label="Task" aria-label="Fallback" aria-labelledby="id" />
                      <Progress value={50} aria-hidden />
                      <Progress value={50} aria-hidden="true" />
                      <ProgressCircle value={50} aria-label="Task" aria-labelledby="id" />
                      <ProgressCircle value={50} aria-hidden />
                      <ProgressCircle value={50} aria-hidden="true" />
                      <VisuallyHidden {...vhProps} />
                    </GridItem>
                  </Grid>
                </Stack>
              </Flex>
            </Container>
          </Box>
        </div>
      );
    `;
    const positiveServer = `
      import { THEME_PRESETS, defineGlyph, getUnicaRootProps } from '../src/server.js';
      import type {
        BlockquoteStatus,
        CodeStatus,
        IconSize,
        LinkSize,
        Spacing,
        UnicaRootAttributes,
        VisuallyHiddenProps,
      } from '../src/server.js';

      export const check = {
        count: THEME_PRESETS.length,
        glyph: defineGlyph(() => null),
        attrs: getUnicaRootProps({ theme: 'frost-dark' }) satisfies UnicaRootAttributes,
        spacing: 12 satisfies Spacing,
        b: 'info' satisfies BlockquoteStatus,
        c: 'success' satisfies CodeStatus,
        i: 's' satisfies IconSize,
        l: 'inherit' satisfies LinkSize,
        vh: { as: 'span' } satisfies VisuallyHiddenProps,
      };
    `;

    const negativeCases: readonly [string, string, string][] = [
      [
        '__virtual_neg_server_vh.ts',
        'VisuallyHidden runtime import from server.ts',
        `import { VisuallyHidden } from '../src/server.js'; export const x = VisuallyHidden;`,
      ],
      [
        '__virtual_neg_spacing_num.ts',
        'Spacing rejects off-scale number 10',
        `import type { Spacing } from '../src/index.js'; export const s: Spacing = 10;`,
      ],
      [
        '__virtual_neg_spacing_str.ts',
        'Spacing rejects string "12"',
        `import type { Spacing } from '../src/index.js'; export const s: Spacing = '12';`,
      ],
      [
        '__virtual_neg_bq_tone.tsx',
        'Blockquote rejects legacy tone prop',
        `import { Blockquote } from '../src/index.js'; export const x = <Blockquote tone="warning">Q</Blockquote>;`,
      ],
      [
        '__virtual_neg_code_tone.tsx',
        'Code rejects legacy tone prop',
        `import { Code } from '../src/index.js'; export const x = <Code tone="danger">C</Code>;`,
      ],
      [
        '__virtual_neg_progress_unnamed.tsx',
        'Progress rejects unnamed usage',
        `import { Progress } from '../src/index.js'; export const x = <Progress value={50} />;`,
      ],
      [
        '__virtual_neg_circle_unnamed.tsx',
        'ProgressCircle rejects unnamed usage',
        `import { ProgressCircle } from '../src/index.js'; export const x = <ProgressCircle value={50} />;`,
      ],
      [
        '__virtual_neg_circle_label.tsx',
        'ProgressCircle rejects label prop',
        `import { ProgressCircle } from '../src/index.js'; export const x = <ProgressCircle value={50} label="Nope" />;`,
      ],
    ];

    const virtualFiles: Record<string, string> = {
      '__virtual_main.tsx': positiveMain,
      '__virtual_server.ts': positiveServer,
    };
    for (const [file, , snippet] of negativeCases) {
      virtualFiles[file] = snippet;
    }

    const diagnosticsByFile = typeCheckVirtualFiles(program, options, virtualFiles);

    expect(
      (diagnosticsByFile.get('__virtual_main.tsx') ?? []).map((d) =>
        ts.flattenDiagnosticMessageText(d.messageText, '\n'),
      ),
    ).toEqual([]);
    expect(
      (diagnosticsByFile.get('__virtual_server.ts') ?? []).map((d) =>
        ts.flattenDiagnosticMessageText(d.messageText, '\n'),
      ),
    ).toEqual([]);

    for (const [file, label] of negativeCases) {
      expect(
        (diagnosticsByFile.get(file) ?? []).length,
        `Expected type error for: ${label}`,
      ).toBeGreaterThan(0);
    }
  });

  it('enforces Anatomy v2 folder structure, zero displayName assignments, and JSDoc on components', async () => {
    const families = (await readdir(COMPONENTS_ROOT, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(families.length).toBeGreaterThanOrEqual(13);

    const violations: string[] = [];

    for (const family of families) {
      const dir = join(COMPONENTS_ROOT, family);
      const files = await readdir(dir);

      if (!files.includes('index.ts')) {
        violations.push(`${family}: missing index.ts barrel`);
      } else {
        const sf = program.getSourceFile(join(dir, 'index.ts'));
        if (!sf) {
          violations.push(`${family}/index.ts: not included in TS program`);
        } else {
          for (const stmt of sf.statements) {
            if (!ts.isExportDeclaration(stmt)) {
              violations.push(`${family}/index.ts: barrel must contain only export declarations`);
            } else if (
              stmt.moduleSpecifier &&
              ts.isStringLiteral(stmt.moduleSpecifier) &&
              stmt.moduleSpecifier.text.endsWith('.css')
            ) {
              violations.push(`${family}/index.ts: barrel must not import CSS`);
            }
          }
        }
      }

      if (!files.some((name) => name.endsWith('.css'))) {
        violations.push(`${family}: missing colocated family stylesheet`);
      }

      if (files.includes('types.ts')) {
        const sf = program.getSourceFile(join(dir, 'types.ts'))!;
        const { values } = exportsByKind(checker, sf);
        if (values.size > 0) {
          violations.push(
            `${family}/types.ts: must be type-only, found runtime exports: ${[...values].join(', ')}`,
          );
        }
      }

      if (files.includes('consts.ts')) {
        const sf = program.getSourceFile(join(dir, 'consts.ts'))!;
        const { values } = exportsByKind(checker, sf);
        if (values.size === 0) {
          violations.push(`${family}/consts.ts: must not be empty`);
        }
        for (const stmt of sf.statements) {
          if (
            ts.isImportDeclaration(stmt) &&
            ts.isStringLiteral(stmt.moduleSpecifier) &&
            !/^(\.\.\/\.\.\/(consts|types)\.js|\.\/.+\.js)$/.test(stmt.moduleSpecifier.text)
          ) {
            violations.push(
              `${family}/consts.ts: disallowed import "${stmt.moduleSpecifier.text}"`,
            );
          }
        }
      }

      // Check TSX/TS files in family for .displayName assignments
      for (const file of files.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))) {
        const sf = program.getSourceFile(join(dir, file));
        if (!sf) {
          continue;
        }
        const visit = (node: ts.Node): void => {
          if (
            ts.isBinaryExpression(node) &&
            node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
            ts.isPropertyAccessExpression(node.left) &&
            node.left.name.text === 'displayName'
          ) {
            violations.push(`${family}/${file}: forbidden .displayName assignment (TS9023)`);
          }
          ts.forEachChild(node, visit);
        };
        visit(sf);
      }
    }

    // Every publicly exported component function from src/index.ts must have leading JSDoc
    const indexModSym = checker.getSymbolAtLocation(indexSf)!;
    for (const sym of checker.getExportsOfModule(indexModSym)) {
      if (!/^[A-Z]/.test(sym.name)) {
        continue;
      }
      const target = resolveAliasedSymbol(checker, sym);
      if ((target.flags & ts.SymbolFlags.Function) === 0) {
        continue;
      }
      const decls = target.getDeclarations() ?? [];
      const firstDecl = decls[0];
      if (!firstDecl || !inOwnSource(firstDecl)) {
        continue;
      }
      const text = firstDecl.getSourceFile().getFullText();
      const leading = ts.getLeadingCommentRanges(text, firstDecl.pos) ?? [];
      const hasJsDoc = leading.some((range) => text.slice(range.pos, range.end).startsWith('/**'));
      if (!hasJsDoc) {
        violations.push(`${sym.name}: exported component is missing leading JSDoc`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('enforces readonly and explicit undefined on own optional input props (excluding contravariant GlyphSvgProps)', () => {
    const indexModSym = checker.getSymbolAtLocation(indexSf)!;
    const violations: string[] = [];

    for (const sym of checker.getExportsOfModule(indexModSym)) {
      if (!sym.name.endsWith('Props') || sym.name === 'GlyphSvgProps') {
        continue;
      }
      const target = resolveAliasedSymbol(checker, sym);
      if ((target.flags & ts.SymbolFlags.Type) === 0) {
        continue;
      }
      const declaredType = checker.getDeclaredTypeOfSymbol(target);
      const branches = declaredType.isUnion() ? declaredType.types : [declaredType];

      for (const branch of branches) {
        for (const prop of branch.getProperties()) {
          if ((prop.flags & ts.SymbolFlags.Optional) === 0) {
            continue;
          }
          const decls = prop.getDeclarations() ?? [];
          const ownDecls = decls.filter(inOwnSource);
          if (ownDecls.length === 0) {
            continue;
          }
          const propType = checker.getTypeOfSymbolAtLocation(prop, ownDecls[0]!);
          if (isNeverType(propType)) {
            continue;
          }
          if (!isUndefinedAllowed(propType)) {
            violations.push(`${sym.name}.${prop.name}: optional own prop must allow undefined`);
          }
          for (const decl of ownDecls) {
            if (!hasReadonlyModifier(decl)) {
              violations.push(`${sym.name}.${prop.name}: optional own prop must be readonly`);
            }
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('forbids raw useLayoutEffect outside src/core/useIsoLayoutEffect.ts', () => {
    const allowedFile = resolve(SRC_ROOT, 'core/useIsoLayoutEffect.ts');
    const violations: string[] = [];

    for (const sf of program.getSourceFiles()) {
      const file = resolve(sf.fileName);
      if (!file.startsWith(SRC_ROOT + '/') || file === allowedFile) {
        continue;
      }
      const visit = (node: ts.Node): void => {
        if (ts.isImportSpecifier(node) && node.name.text === 'useLayoutEffect') {
          violations.push(`${relative(PKG_ROOT, file)}: raw useLayoutEffect import`);
        } else if (ts.isPropertyAccessExpression(node) && node.name.text === 'useLayoutEffect') {
          violations.push(`${relative(PKG_ROOT, file)}: raw .useLayoutEffect access`);
        } else if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === 'useLayoutEffect'
        ) {
          violations.push(`${relative(PKG_ROOT, file)}: raw useLayoutEffect() call`);
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
    }

    expect(violations).toEqual([]);
  });

  it('enforces data-unica-* ownership and empty-string boolean flags in TSX', () => {
    const violations: string[] = [];

    const checkFlagValueType = (file: string, attrName: string, expr: ts.Expression): void => {
      const t = checker.getTypeAtLocation(expr);
      const parts = t.isUnion() ? t.types : [t];
      for (const part of parts) {
        if (
          (part.flags & ts.TypeFlags.BooleanLiteral) !== 0 ||
          (part.flags & ts.TypeFlags.Boolean) !== 0
        ) {
          violations.push(`${file}: ${attrName} must use '' | undefined (dataFlag), not boolean`);
          return;
        }
        if (part.isStringLiteral() && (part.value === 'true' || part.value === 'false')) {
          violations.push(
            `${file}: ${attrName} must use '' | undefined (dataFlag), not "${part.value}"`,
          );
          return;
        }
      }
    };

    for (const sf of program.getSourceFiles()) {
      const file = resolve(sf.fileName);
      if (!file.startsWith(COMPONENTS_ROOT + '/') && !file.startsWith(INTERNAL_ROOT + '/')) {
        continue;
      }
      const rel = relative(PKG_ROOT, file);

      const visit = (node: ts.Node): void => {
        if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name)) {
          const name = node.name.text;
          if (name.startsWith('data-')) {
            if (!PROTOCOL_DATA_ATTRS.has(name) && !name.startsWith('data-unica-')) {
              violations.push(`${rel}: unprefixed own attribute ${name}`);
            }
            if (name.startsWith('data-unica-') && node.initializer) {
              if (ts.isStringLiteral(node.initializer)) {
                if (node.initializer.text === 'true' || node.initializer.text === 'false') {
                  violations.push(`${rel}: ${name}="${node.initializer.text}" must use dataFlag`);
                }
              } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
                checkFlagValueType(rel, name, node.initializer.expression);
              }
            }
          }
        } else if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name)) {
          const name = node.name.text;
          if (name.startsWith('data-') && !name.endsWith('-')) {
            if (!PROTOCOL_DATA_ATTRS.has(name) && !name.startsWith('data-unica-')) {
              violations.push(`${rel}: unprefixed own data key "${name}"`);
            }
            if (name.startsWith('data-unica-')) {
              checkFlagValueType(rel, name, node.initializer);
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
    }

    expect(violations).toEqual([]);
  });

  it('enforces the CSS contract gate across all component and internal stylesheets', async () => {
    const stylesCssRaw = await readFile(resolve(SRC_ROOT, 'styles.css'), 'utf8');
    const stylesRoot = postcss.parse(stylesCssRaw, { from: resolve(SRC_ROOT, 'styles.css') });
    const stylesVars = new Set<string>();
    stylesRoot.walkDecls((decl) => {
      if (decl.prop.startsWith('--')) {
        stylesVars.add(decl.prop);
      }
    });

    const cssFiles = [
      ...(await collectFiles(COMPONENTS_ROOT, ['.css'])),
      ...(await collectFiles(INTERNAL_ROOT, ['.css'])),
    ];
    expect(cssFiles.length).toBeGreaterThanOrEqual(14);

    // Pre-scan colocated TS/TSX files per directory for TS-injected private '--_*' custom properties
    const dirTsPrivateVars = new Map<string, Set<string>>();
    for (const cssFile of cssFiles) {
      const dir = dirname(cssFile);
      if (dirTsPrivateVars.has(dir)) {
        continue;
      }
      const written = new Set<string>();
      const tsFiles = await collectFiles(dir, ['.ts', '.tsx']);
      for (const tsFile of tsFiles) {
        const text = await readFile(tsFile, 'utf8');
        for (const match of text.matchAll(/['"](--_[a-z0-9-]+)['"]/g)) {
          written.add(match[1]!);
        }
      }
      dirTsPrivateVars.set(dir, written);
    }

    const violations: string[] = [];

    for (const cssFile of cssFiles) {
      const rel = relative(PKG_ROOT, cssFile);
      const raw = await readFile(cssFile, 'utf8');

      // Verify Lightning CSS parses the stylesheet cleanly without errors
      lightningTransform({
        filename: cssFile,
        code: Buffer.from(raw),
        minify: false,
      });

      const root = postcss.parse(raw, { from: cssFile });

      // 100% of top-level rules must live inside @layer unica.components
      for (const node of root.nodes) {
        if (node.type === 'comment') {
          continue;
        }
        if (
          node.type !== 'atrule' ||
          node.name !== 'layer' ||
          node.params.trim() !== 'unica.components'
        ) {
          violations.push(`${rel}: top-level node outside @layer unica.components`);
        }
      }

      // Collect local --_* declarations in this CSS file
      const localDeclared = new Set<string>();
      root.walkDecls((decl) => {
        if (decl.prop.startsWith('--_')) {
          localDeclared.add(decl.prop);
        }
      });
      const tsWritten = dirTsPrivateVars.get(dirname(cssFile)) ?? new Set<string>();

      root.walkAtRules((atRule) => {
        if (atRule.name === 'keyframes') {
          if (!atRule.params.trim().startsWith('unica-')) {
            violations.push(`${rel}: @keyframes "${atRule.params}" must start with unica-`);
          }
        } else if (atRule.name === 'container') {
          const name = atRule.params.trim().split(/\s+/)[0] ?? '';
          if (name && !name.startsWith('(') && !name.startsWith('unica-')) {
            violations.push(`${rel}: @container "${name}" must start with unica-`);
          }
        }
      });

      root.walkRules((rule: Rule) => {
        // Skip keyframe stop selectors (0%, 100%, from, to)
        if (rule.parent?.type === 'atrule' && (rule.parent as AtRule).name === 'keyframes') {
          return;
        }
        for (const selector of rule.selectors) {
          if (/\[data-theme\b/.test(selector)) {
            violations.push(`${rel}: forbidden [data-theme] selector "${selector}"`);
          }
          if (/:root\b/.test(selector)) {
            violations.push(`${rel}: forbidden bare :root selector "${selector}"`);
          }
          if (
            (/\[dir\s*=/.test(selector) || /\[data-surface\b/.test(selector)) &&
            !/\.unica-/.test(selector)
          ) {
            violations.push(
              `${rel}: bare global selector "${selector}" must be scoped to .unica-*`,
            );
          }
          const bemMatch = selector.match(/\.unica-[a-z0-9-]+(?:__|--)[a-z0-9-]+/);
          if (bemMatch) {
            violations.push(`${rel}: BEM component class "${bemMatch[0]}" must use single hyphens`);
          }
          for (const attrMatch of selector.matchAll(/\[(data-[a-z0-9-]+)/g)) {
            const attr = attrMatch[1]!;
            if (!PROTOCOL_DATA_ATTRS.has(attr) && !attr.startsWith('data-unica-')) {
              violations.push(`${rel}: unprefixed data attribute selector [${attr}]`);
            }
          }
        }
      });

      root.walkDecls((decl: Declaration) => {
        // !important check (only Skeleton [hidden]:not([hidden='until-found' i]) allowed)
        if (decl.important) {
          const parentRule = decl.parent?.type === 'rule' ? decl.parent : null;
          const isSkeletonHidden =
            rel.endsWith('Skeleton/skeleton.css') &&
            parentRule !== null &&
            parentRule.selector.includes("[hidden]:not([hidden='until-found' i])");
          if (!isSkeletonHidden) {
            violations.push(`${rel}: forbidden !important on ${decl.prop}: ${decl.value}`);
          }
        }

        // Raw color literal check outside @media (forced-colors: active)
        if (!isInsideForcedColors(decl)) {
          const valWithoutUrls = decl.value.replace(/url\([^)]*\)/g, '');
          if (
            /(^|[^a-zA-Z0-9_-])#[0-9a-fA-F]{3,8}\b/.test(valWithoutUrls) ||
            /\b(?:rgba?|hsla?|oklch)\s*\(/i.test(valWithoutUrls)
          ) {
            violations.push(`${rel}: raw color literal in ${decl.prop}: ${decl.value}`);
          }
        }

        // Exact var(--*) resolution check
        for (const match of decl.value.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)/g)) {
          const varName = match[1]!;
          const resolved =
            stylesVars.has(varName) ||
            localDeclared.has(varName) ||
            tsWritten.has(varName) ||
            EXTERNAL_CSS_HOOKS.has(varName);
          if (!resolved) {
            violations.push(`${rel}: unresolved CSS variable ${varName} in ${decl.prop}`);
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });
});
