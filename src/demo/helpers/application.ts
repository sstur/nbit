import path from 'path';

import { createApplication } from '../../http';

const { defineRoutes, attachRoutes } = createApplication({
  root: path.resolve(__dirname, '../..'),
  allowStaticFrom: ['assets'],
  getContext: (request) => ({
    auth: async () => {
      const authHeader = request.headers.get('Authorization') ?? '';
      const token = authHeader.startsWith('Bearer')
        ? authHeader.split(' ')[1]
        : undefined;
      return isValidAuthToken(token);
    },
  }),
});

function isValidAuthToken(token: string | undefined) {
  return token === 'some-valid-token';
}

export { defineRoutes, attachRoutes };
