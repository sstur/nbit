type Method = 'GET' | 'PUT' | 'POST' | 'HEAD' | 'DELETE' | 'OPTIONS' | '*';

type Captures = Record<string, string>;

type Match<T> = [T, Captures];

type Route<T> = {
  method: Method;
  matcher: (path: string) => Captures | null;
  payload: T;
};

export type Router<T> = {
  insert: (method: Method, pattern: string, payload: T) => void;
  getMatches: (method: string, path: string) => Array<Match<T>>;
};

export function createRouter<T>() {
  const routes: Array<Route<T>> = [];

  return {
    insert(method: Method, pattern: string, payload: T) {
      routes.push({
        method,
        matcher: getMatcher(pattern),
        payload,
      });
    },
    getMatches(method: string, path: string) {
      const results: Array<Match<T>> = [];
      for (const route of routes) {
        if (route.method !== '*' && route.method !== method) {
          continue;
        }
        const captures = route.matcher(path);
        if (captures) {
          results.push([route.payload, captures]);
        }
      }
      return results;
    },
  };
}

function getMatcher(pattern: string) {
  const patternSegments = pattern.slice(1).split('/');
  return (path: string) => {
    const pathSegments = path.slice(1).split('/');
    // TODO: Handle patterns like `/foo/:name/*`
    if (patternSegments.length !== pathSegments.length) {
      return null;
    }
    const captures: Captures = {};
    for (let i = 0; i < pathSegments.length; i++) {
      const patternSegment = patternSegments[i] ?? '';
      const pathSegment = pathSegments[i] ?? '';
      if (patternSegment.startsWith(':')) {
        const key = patternSegment.slice(1);
        captures[key] = pathSegment;
      } else if (patternSegment !== pathSegment) {
        return null;
      }
    }
    return captures;
  };
}
