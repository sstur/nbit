/* eslint-disable no-console */
import http from 'http';

import { attachRoutes } from './application';
import * as handlers from './handlers';

const port = 3000;

const server = http.createServer(attachRoutes(...Object.values(handlers)));

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
