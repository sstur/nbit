import { defineRoutes, Response } from '../../http';

export default defineRoutes((app) => [
  app.post('/auth', async (request) => {
    const body = await request.json();
    return Response.json({ body });
  }),
]);
