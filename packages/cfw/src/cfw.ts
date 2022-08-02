import { defineAdapter } from './core';

export const createApplication = defineAdapter((_applicationOptions) => {
  return {
    onError: (request, error) => {
      return new Response(String(error), { status: 500 });
    },
    toResponse: (request, result) => {
      if (result instanceof Response) {
        return result;
      }
      if (result === undefined) {
        return new Response('Not found', { status: 404 });
      }
      return Response.json(result);
    },
    createNativeHandler: (handleRequest) => handleRequest,
  };
});
