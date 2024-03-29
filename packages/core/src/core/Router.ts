type Captures = Record<string, string>;

type Match<T> = [T, Captures, [method: string, pattern: string]];

type Route<T> = {
  method: string;
  pattern: string;
  matcher: (path: string) => Captures | null;
  payload: T;
};

export type Router<T> = {
  insert: (method: string, pattern: string, payload: T) => void;
  getMatches: (method: string, path: string) => Array<Match<T>>;
};

export function createRouter<T>() {
  const routes: Array<Route<T>> = [];

  return {
    insert(method: string, pattern: string, payload: T) {
      routes.push({
        method,
        pattern,
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
          const { method, pattern, payload } = route;
          results.push([payload, captures, [method, pattern]]);
        }
      }
      return results;
    },
  };
}

function getMatcher(pattern: string) {
  const patternSegments = pattern.slice(1).split('/');
  const hasPlaceholder = pattern.includes('/:');
  const hasWildcard = patternSegments.includes('*');
  const isStatic = !hasPlaceholder && !hasWildcard;
  return (path: string) => {
    const captures: Captures = {};
    if (isStatic && path === pattern) {
      return captures;
    }
    const pathSegments = path.slice(1).split('/');
    if (!hasWildcard && patternSegments.length !== pathSegments.length) {
      return null;
    }
    const length = Math.max(patternSegments.length, pathSegments.length);
    for (let i = 0; i < length; i++) {
      const patternSegment = patternSegments[i];
      if (patternSegment === '*') {
        const remainder = pathSegments.slice(i);
        captures[patternSegment] = remainder.join('/');
        return remainder.length ? captures : null;
      }
      const pathSegment = pathSegments[i];
      if (!pathSegment || !patternSegment) {
        return null;
      }
      if (patternSegment.startsWith(':') && pathSegment) {
        const key = patternSegment.slice(1);
        captures[key] = pathSegment;
      } else if (patternSegment !== pathSegment) {
        return null;
      }
    }
    return captures;
  };
}
