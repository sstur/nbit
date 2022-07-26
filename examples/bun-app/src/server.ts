/* eslint-disable no-console */
import { attachRoutes } from './application';
import * as handlers from './handlers';

const port = 3000;

Bun.serve({
  port,
  fetch: attachRoutes(...Object.values(handlers)),
});

console.log(`Server running at http://localhost:${port}`);
