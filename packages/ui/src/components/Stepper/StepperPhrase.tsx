import { Fragment } from 'react';
import type { ReactElement } from 'react';
import { isolateAuthorText } from './messages.js';

interface StepperPhraseProps {
  readonly phrase: string;
  readonly author: string;
  readonly lang: string | undefined;
  readonly dir: string | undefined;
}

export function StepperPhrase({ phrase, author, lang, dir }: StepperPhraseProps): ReactElement {
  // Explicit isolate marks identify every authored insertion, even if the same
  // text also appears elsewhere in a custom phrase.
  const marked = phrase.split(isolateAuthorText(author));
  const parts = marked.length > 1 ? marked : phrase.split(author);
  if (marked.length === 1 && parts.length !== 2) {
    return <bdi>{phrase}</bdi>;
  }

  return (
    <bdi>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <bdi lang={lang} dir={dir}>
              {author}
            </bdi>
          )}
          {part}
        </Fragment>
      ))}
    </bdi>
  );
}
