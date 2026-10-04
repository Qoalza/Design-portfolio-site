import * as migration_20260911_155753_initial from './20260911_155753_initial';
import * as migration_20261004_191241_redesign_release_content from './20261004_191241_redesign_release_content';

export const migrations = [
  {
    up: migration_20260911_155753_initial.up,
    down: migration_20260911_155753_initial.down,
    name: '20260911_155753_initial',
  },
  {
    up: migration_20261004_191241_redesign_release_content.up,
    down: migration_20261004_191241_redesign_release_content.down,
    name: '20261004_191241_redesign_release_content'
  },
];
