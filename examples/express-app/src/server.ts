/* eslint-disable no-console */
import express from 'express';

import { attachRoutes } from './application';
import * as handlers from './handlers';

const app = express();
const port = 3000;

const middleware = attachRoutes(...Object.values(handlers));

app.use(middleware);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
