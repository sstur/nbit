import { Response } from '../../http';
import { defineRoutes } from '../helpers/application';

export default defineRoutes((app) => [
  app.post('/auth', async (request) => {
    const body = await request.json();
    return Response.json({ body });
  }),
]);