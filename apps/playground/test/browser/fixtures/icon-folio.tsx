import { UnicaProvider } from '@docouno/unica';
import extensions from '../../../src/scenes/08-extensions-empty.scene.js';

export default function IconFolioFixture() {
  return (
    <UnicaProvider overrides={{ Icon: { size: 'l' } }}>
      <extensions.render />
    </UnicaProvider>
  );
}
