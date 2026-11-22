import type { ReactElement } from 'react';
import signIn from '../../../src/scenes/01-sign-in.scene.js';
import overview from '../../../src/scenes/02-workspace-overview.scene.js';
import collection from '../../../src/scenes/03-document-collection.scene.js';
import invite from '../../../src/scenes/07-invite-access-modal.scene.js';
import extensions from '../../../src/scenes/08-extensions-empty.scene.js';
import preferences from '../../../src/scenes/09-user-preferences.scene.js';
import admin from '../../../src/scenes/10-workspace-admin.scene.js';
import { unicaWorkbenchBase } from '../../../src/unica.workbench.shared.js';
import { WorkbenchApp } from '../../../src/workbench/WorkbenchApp.js';

const catalog = {
  ...unicaWorkbenchBase,
  components: [],
  scenes: [signIn, overview, collection, invite, extensions, preferences, admin],
};

export default function CardFolioFixture(): ReactElement {
  return <WorkbenchApp config={catalog} />;
}
