import { Response } from '@nbit/express';

import { defineRoutes } from '../application';

export default defineRoutes((app) => [
  app.post('/auth', async (request) => {
    const body = await request.json();
    return Response.json({ body });
  }),
]);
