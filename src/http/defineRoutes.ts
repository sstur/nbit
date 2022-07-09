import type { Handler, Route } from './types';

const app = {
  get: <P extends string>(path: P, handler: Handler<'GET', P>) =>
    ['GET', path as string, handler] as Route,
  post: <P extends string>(path: P, handler: Handler<'POST', P>) =>
    ['POST', path as string, handler] as Route,
  put: <P extends string>(path: P, handler: Handler<'PUT', P>) =>
    ['PUT', path as string, handler] as Route,
  delete: <P extends string>(path: P, handler: Handler<'DELETE', P>) =>
    ['DELETE', path as string, handler] as Route,
};

type App = typeof app;

export function defineRoutes(fn: (app: App) => Array<Route>): Array<Route> {
  return fn(app);
}
