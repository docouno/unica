import { Fragment, cloneElement, createElement, isValidElement } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

const phrasingElements = /* @__PURE__ */ new Set([
  'abbr',
  'b',
  'bdi',
  'bdo',
  'cite',
  'code',
  'data',
  'em',
  'i',
  'kbd',
  'mark',
  'q',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'var',
]);

interface TerminalRun {
  readonly content: ReactNode;
  readonly end: 'text' | 'opaque' | 'empty';
}

export function markTerminalText(label: ReactNode): TerminalRun {
  if (typeof label === 'string' || typeof label === 'number' || typeof label === 'bigint') {
    const original = String(label);
    const text = original.trimEnd();
    const terminal = /\S+$/u.exec(text);
    const spaces = original.slice(text.length);
    return {
      content: (
        <>
          {terminal && (
            <>
              {text.slice(0, terminal.index)}
              <span className="unica-link-terminal-text">{terminal[0]}</span>
            </>
          )}
          {spaces && <span className="unica-link-terminal-space">{spaces}</span>}
        </>
      ),
      end: terminal ? 'text' : 'empty',
    };
  }

  if (Array.isArray(label)) {
    const children = [...(label as readonly ReactNode[])];
    let end: TerminalRun['end'] = 'empty';
    for (let index = children.length - 1; index >= 0 && end === 'empty'; index -= 1) {
      const result = markTerminalText(children[index]);
      children[index] = result.content;
      end = result.end;
    }
    // Static sibling positions keep the caller's explicit and implicit keys.
    return { content: createElement(Fragment, null, ...children), end };
  }

  if (isValidElement<HTMLAttributes<HTMLElement>>(label)) {
    const { props, type } = label;
    if (props.hidden || props.style?.display === 'none' || props.style?.visibility === 'hidden') {
      return { content: label, end: 'empty' };
    }
    // Preserve authored inline markup and direction. Opaque output owns its
    // layout and forms the boundary of the static search.
    if (type === Fragment || (typeof type === 'string' && phrasingElements.has(type))) {
      const result = markTerminalText(props.children);
      return {
        content:
          result.content === props.children
            ? label
            : cloneElement(label, undefined, result.content),
        end: result.end,
      };
    }
  }

  return {
    content: label,
    end: label === null || label === undefined || typeof label === 'boolean' ? 'empty' : 'opaque',
  };
}
