import { join } from 'path';

import { createApplication } from './bun';

const { defineRoutes, attachRoutes } = createApplication({
  root: join(import.meta.dir, '..'),
  allowStaticFrom: ['public'],
  getContext: (request) => ({
    auth: async () => {
      return request.headers.get('X-Auth') === 'secret';
    },
  }),
});

const routes = defineRoutes((app) => [
  app.get('/', async (request) => {
    return Response.json({ path: request.path });
  }),
  app.post('/auth', async (request) => {
    const body = await request.json();
    return Response.json({ body });
  }),
]);

const PORT = 3000;

Bun.serve({
  port: 3000,
  fetch: attachRoutes(routes),
});

// eslint-disable-next-line no-console
console.log(`Server running at http://localhost:${PORT}`);
