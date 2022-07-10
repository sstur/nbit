import path from 'path';

import { createApplication } from '../../http';

const { defineRoutes, attachRoutes } = createApplication({
  root: path.resolve(__dirname, '../..'),
  allowStaticFrom: ['assets'],
});

export { defineRoutes, attachRoutes };
