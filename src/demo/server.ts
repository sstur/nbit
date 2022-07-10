/* eslint-disable no-console */
import path from 'path';
import { createServer } from 'http';

import { createApplication } from '../http';

import { listen } from './helpers/listen';
import * as handlers from './handlers';

const PORT = 3000;

async function start() {
  const { attachRoutes } = createApplication({
    root: path.resolve(__dirname, '../..'),
    allowStaticFrom: ['assets'],
  });

  const requestHandler = attachRoutes(...Object.values(handlers));

  const server = createServer(requestHandler);

  await listen(server, { port: PORT });
  console.log(`Server running at http://localhost:${PORT}`);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
