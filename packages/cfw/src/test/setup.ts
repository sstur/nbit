import { Request, Response, Headers, type ResponseInit } from 'node-fetch';

// Polyfill for Response.json() which is in the standard but not supported by node-fetch 2.x
Object(Response).json = (body: unknown, init?: ResponseInit) => {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(body), { ...init, headers });
};

Object.assign(globalThis, { Request, Response, Headers });
