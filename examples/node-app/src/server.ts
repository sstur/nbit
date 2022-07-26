/* eslint-disable no-console */
import http from 'http';

import { createApplication } from '@nbit/node';

const { defineRoutes, attachRoutes } = createApplication();

const routes = defineRoutes((app) => [
  app.get('/', (_request) => {
    return { hello: 'world' };
  }),
]);

const port = 3000;

const server = http.createServer(attachRoutes(routes));

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
