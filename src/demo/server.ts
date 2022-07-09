/* eslint-disable no-console */
import path from 'path';
import { createServer } from 'http';

import express from 'express';

import { createApplication } from '../http';

import { listen } from './helpers/listen';
import * as handlers from './handlers';

const PORT = 3000;

async function start() {
  const app = express();
  const server = createServer(app);

  const { attachRoutes } = createApplication({
    root: path.resolve(__dirname, '../..'),
    allowStaticFrom: ['assets'],
  });

  for (let routes of Object.values(handlers)) {
    attachRoutes(app, routes);
  }

  await listen(server, { port: PORT });
  console.log(`Server running at http://localhost:${PORT}`);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
