/* eslint-disable no-console */
import { attachRoutes } from './helpers/application';
import * as handlers from './handlers';

const PORT = 3000;

export default {
  port: 3000,
  fetch: attachRoutes(...Object.values(handlers)),
};

console.log(`Server running at http://localhost:${PORT}`);
