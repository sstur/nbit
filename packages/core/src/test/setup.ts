import { Response, Headers, type ResponseInit } from 'node-fetch';

// Polyfill for static methods which are in the standard but not supported by node-fetch
Object.assign(Response, {
  json: (body: unknown, init?: ResponseInit) => {
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json');
    return new Response(JSON.stringify(body), { ...init, headers });
  },
  redirect: (url: string, status = 302) => {
    return new Response('', {
      status,
      headers: { Location: url },
    });
  },
});
