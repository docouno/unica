import type { ReactElement, ReactNode } from 'react';
import { Text } from '../text/text.proto.js';
import './combobox.examples.css';

export function Study({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="suggestion-study-proto">
      <Text size="caption-l" color="secondary">
        {title}
      </Text>
      <div inert>{children}</div>
    </div>
  );
}
