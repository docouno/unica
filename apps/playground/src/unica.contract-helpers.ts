import ts from 'typescript';

export function exampleIssues(
  file: string,
  source: string,
  kind: 'source' | 'composition' = 'source',
): string[] {
  const issues: string[] = [];
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest);
  const report = (node: ts.Node, issue: string): void => {
    const { line } = ast.getLineAndCharacterOfPosition(node.getStart(ast));
    issues.push(`${file}:${line + 1} ${issue}`);
  };
  let hasJsx = false;
  function visit(node: ts.Node): void {
    hasJsx ||= ts.isJsxFragment(node);
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      hasJsx = true;
      const tag = node.tagName.getText(ast);
      if (tag === 'select') {
        report(node, 'native select');
      }
      if (tag === 'input') {
        for (const attr of node.attributes.properties) {
          if (!ts.isJsxAttribute(attr) || attr.name.getText(ast) !== 'type') {
            continue;
          }
          const value = attr.initializer;
          let literal = value && ts.isJsxExpression(value) ? value.expression : value;
          while (literal && ts.isParenthesizedExpression(literal)) {
            literal = literal.expression;
          }
          if (
            literal &&
            ts.isStringLiteralLike(literal) &&
            literal.text.toLowerCase() === 'range'
          ) {
            report(attr, 'native range input');
          }
        }
      }
    }
    if (
      ts.isBinaryExpression(node) &&
      [
        ts.SyntaxKind.EqualsEqualsToken,
        ts.SyntaxKind.EqualsEqualsEqualsToken,
        ts.SyntaxKind.ExclamationEqualsToken,
        ts.SyntaxKind.ExclamationEqualsEqualsToken,
      ].includes(node.operatorToken.kind) &&
      ((isContextTab(node.left) && isLegacyTab(node.right)) ||
        (isContextTab(node.right) && isLegacyTab(node.left)))
    ) {
      report(node, 'legacy tab comparison');
    }
    if (ts.isSwitchStatement(node) && isContextTab(node.expression)) {
      for (const clause of node.caseBlock.clauses) {
        if (ts.isCaseClause(clause) && isLegacyTab(clause.expression)) {
          report(clause, 'legacy tab case');
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (kind === 'composition' && !hasJsx) {
    issues.push(`${file} contains no JSX`);
  }
  return issues;
}

function isContextTab(node: ts.Node): boolean {
  if (!(ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))) {
    return false;
  }
  if (!ts.isIdentifier(node.expression) || node.expression.text !== 'ctx') {
    return false;
  }
  return ts.isPropertyAccessExpression(node)
    ? node.name.text === 'tab'
    : ts.isStringLiteralLike(node.argumentExpression) && node.argumentExpression.text === 'tab';
}

function isLegacyTab(node: ts.Node): boolean {
  return ts.isStringLiteralLike(node) && (node.text === 'matrix' || node.text === 'cases');
}

export function unboundJsxTags(source: ts.SourceFile): string[] {
  const tagStarts = new Set<number>();
  function visit(node: ts.Node): void {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      tagStarts.add(node.tagName.getStart(source));
    }
    ts.forEachChild(node, visit);
  }
  visit(source);

  // Resolve the example's own value bindings without letting DOM globals supply components.
  const options: ts.CompilerOptions = {
    jsx: ts.JsxEmit.Preserve,
    noLib: true,
    noResolve: true,
    types: [],
  };
  const host = ts.createCompilerHost(options);
  host.getSourceFile = (name) => (name === source.fileName ? source : undefined);
  const program = ts.createProgram([source.fileName], options, host);
  return program.getSemanticDiagnostics(source).flatMap(({ code, start, messageText }) => {
    // The tag name is unresolved (2304/2552) or refers only to a type (1361/1362/2693).
    if (
      start !== undefined &&
      tagStarts.has(start) &&
      [2304, 2552, 1361, 1362, 2693].includes(code)
    ) {
      return [ts.flattenDiagnosticMessageText(messageText, ' ')];
    }
    return [];
  });
}
