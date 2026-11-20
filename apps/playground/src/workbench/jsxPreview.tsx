import babel from 'prettier/plugins/babel';
import estree from 'prettier/plugins/estree';
import { format } from 'prettier/standalone';
import type { ReactNode } from 'react';
import { refractor } from 'refractor/core';
import jsx from 'refractor/jsx';

refractor.register(jsx);

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

export async function renderJsxPreview(source: string): Promise<ReactNode> {
  const formatted = await format(source, {
    parser: 'babel',
    plugins: [babel, estree],
    printWidth: 72,
    singleQuote: true,
    semi: false,
  }).catch(() => source);

  // An isolated JSX expression has no preceding statement to guard against ASI.
  const snippet = formatted.replace(/^;(?=<)/, '').trimEnd();
  return renderTokens(refractor.highlight(snippet, 'jsx').children);
}
