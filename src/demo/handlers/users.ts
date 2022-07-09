import { defineRoutes, Response } from '../../http';

export default defineRoutes(({ get, post }) => [
  get('/hello', (_request) => {
    return new Response('Hello');
  }),

  get('/hello/:name', async (request) => {
    // Note: TypeScript knows exactly the shape of params here
    const { name } = request.params;
    return Response.json({ hi: name });
  }),

  // From the terminal below, try: curl -H 'content-type: application/json' -d '{"hello":"world"}' http://localhost:3000/stuff
  post('/stuff', async (request) => {
    const body = await request.json();
    // The following is equivalent to returning Response.json({ body })
    return new Response(JSON.stringify({ body }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }),
]);
