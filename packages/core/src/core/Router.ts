type Method = 'GET' | 'PUT' | 'POST' | 'HEAD' | 'DELETE' | 'OPTIONS' | '*';

type Handler<Context> = (context: Context) => unknown;

type Captures = Array<[string, string]>;

type Route<Context> = {
  method: Method;
  matcher: (path: string) => Captures | null;
  handler: Handler<Context>;
};

export class Router<Context> {
  private routes: Array<Route<Context>> = [];

  attachRoute(method: Method, pattern: string, handler: Handler<Context>) {
    this.routes.push({
      method,
      matcher: getMatcher(pattern),
      handler,
    });
  }

  async route(
    method: string,
    path: string,
    getContext: (captures: Captures) => Context,
  ) {
    for (const route of this.routes) {
      if (route.method !== '*' && route.method !== method) {
        continue;
      }
      const captures = route.matcher(path);
      if (captures) {
        const result = await route.handler(getContext(captures));
        if (result != null) {
          return result;
        }
      }
    }
  }
}

function getMatcher(pattern: string) {
  const patternSegments = pattern.slice(1).split('/');
  return (path: string) => {
    const pathSegments = path.slice(1).split('/');
    // TODO: Handle patterns like `/foo/:name/*`
    if (patternSegments.length !== pathSegments.length) {
      return null;
    }
    const captures: Captures = [];
    for (let i = 0; i < pathSegments.length; i++) {
      const patternSegment = patternSegments[i] ?? '';
      const pathSegment = pathSegments[i] ?? '';
      if (patternSegment.startsWith(':')) {
        const key = patternSegment.slice(1);
        captures.push([key, pathSegment]);
      } else if (patternSegment !== pathSegment) {
        return null;
      }
    }
    return captures;
  };
}
