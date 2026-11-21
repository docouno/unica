import { Kbd, KbdGroup } from '@docouno/unica';

export default function KbdSsrFixture() {
  return (
    <KbdGroup
      ref={(node) => {
        if (node) {
          node.dataset.hydrated = '';
        }
      }}
      separator="then"
    >
      <KbdGroup separator="">
        <Kbd label="Commande" lang="fr">
          ⌘
        </Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
      <Kbd>↩</Kbd>
    </KbdGroup>
  );
}
