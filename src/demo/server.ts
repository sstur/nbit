/* eslint-disable no-console */
import { createServer } from 'http';

import { attachRoutes } from './helpers/application';
import { listen } from './helpers/listen';
import * as handlers from './handlers';

const PORT = 3000;

async function start() {
  const requestHandler = attachRoutes(...Object.values(handlers));

  const server = createServer(requestHandler);

  await listen(server, { port: PORT });
  console.log(`Server running at http://localhost:${PORT}`);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
