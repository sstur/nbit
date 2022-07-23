import { Response } from '@nbit/node';

import { defineRoutes } from '../application';

export default defineRoutes((app) => [
  app.get('/', (_request) => {
    // Will be resolved relative to the root specified in application.ts
    return Response.file('public/index.html');
  }),
]);
