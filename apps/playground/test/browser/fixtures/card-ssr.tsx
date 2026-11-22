import { ArrowRightIcon } from '@phosphor-icons/react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle, Icon } from '@docouno/unica';
import { useId } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';

type AdapterProps = Omit<ComponentPropsWithRef<'a'>, 'href'> & { readonly to: string };
function Adapter({ to, ...props }: AdapterProps): ReactElement {
  return <a {...props} href={to} />;
}

function connected(node: HTMLElement | null): void {
  if (node) {
    node.dataset.hydrated = 'true';
  }
}

export default function CardServerFixture(): ReactElement {
  const first = useId();
  const second = useId();
  return (
    <>
      <Card asChild aria-labelledby={first} ref={connected}>
        <a href="#guide">
          <CardHeader>
            <CardTitle id={first}>First guide</CardTitle>
            <CardDescription>Release notes</CardDescription>
          </CardHeader>
          <CardFooter>
            Read the guide <Icon usage="slot" icon={ArrowRightIcon} size="m" directional />
          </CardFooter>
        </a>
      </Card>
      <Card asChild aria-labelledby="wrong" ref={connected}>
        <Adapter to="#guide" aria-labelledby={second}>
          <CardTitle id={second}>Second guide</CardTitle>
          <CardDescription>Find a release.</CardDescription>
        </Adapter>
      </Card>
      <main id="guide" tabIndex={-1}>
        Opened guide
      </main>
    </>
  );
}
