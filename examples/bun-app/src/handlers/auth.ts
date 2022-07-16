import { Response } from '@nbit/bun';

import { defineRoutes } from '../application';

export default defineRoutes((app) => [
  app.post('/auth', async (request) => {
    const body = await request.json();
    return Response.json({ body });
  }),
]);
