import babel from 'prettier/plugins/babel';
import estree from 'prettier/plugins/estree';
import { format } from 'prettier/standalone';
import type { ReactNode } from 'react';
import { refractor } from 'refractor/core';
import bash from 'refractor/bash';
import css from 'refractor/css';
import json from 'refractor/json';
import jsx from 'refractor/jsx';
import tsx from 'refractor/tsx';
import typescript from 'refractor/typescript';

refractor.register(jsx);
refractor.register(tsx);
refractor.register(typescript);
refractor.register(css);
refractor.register(bash);
refractor.register(json);

const languageAliases: Readonly<Record<string, string>> = {
  jsx: 'jsx',
  js: 'jsx',
  javascript: 'jsx',
  tsx: 'tsx',
  ts: 'typescript',
  typescript: 'typescript',
  css: 'css',
  sh: 'bash',
  shell: 'bash',
  bash: 'bash',
  json: 'json',
};

function renderTokens(nodes: ReturnType<typeof refractor.highlight>['children']): ReactNode {
  return nodes.map((node, index) => {
    if (node.type === 'text') {
      return node.value;
    }
    if (node.type === 'element') {
      const classes = node.properties.className;
      return (
        <span key={index} className={Array.isArray(classes) ? classes.join(' ') : undefined}>
          {renderTokens(node.children)}
        </span>
      );
    }
    return null;
  });
}

export function highlightCode(source: string, language?: string): ReactNode {
  const key = language ? languageAliases[language.trim().toLowerCase()] : undefined;
  if (!key) {
    return source;
  }
  try {
    return renderTokens(refractor.highlight(source, key).children);
  } catch {
    return source;
  }
}

export async function renderJsxPreview(
  source: string,
  language = 'jsx',
  formatCode = true,
): Promise<{ readonly formatted: string; readonly content: ReactNode }> {
  let snippet = source;
  if (formatCode && (language === 'jsx' || language === 'tsx')) {
    const hasImports = /^\s*import\b/m.test(source);
    const parser = language === 'tsx' ? 'babel-ts' : 'babel';
    const formatted = await format(source, {
      parser,
      plugins: [babel, estree],
      printWidth: 72,
      singleQuote: true,
      semi: hasImports,
    }).catch(() => source);
    // An isolated JSX expression has no preceding statement to guard against ASI.
    snippet = formatted
      .replace(/^;(?=<)/, '')
      .replace(/\n;(?=<)/g, '\n')
      .trimEnd();
  }
  return { formatted: snippet, content: highlightCode(snippet, language) };
}
