import { createCreateApplication } from './core';

export const createApplication = createCreateApplication(
  (routeRequest, _applicationOptions) => {
    return async (request: Request) => {
      const response = await routeRequest(request, {
        onError: (error) => {
          return new Response(String(error), { status: 500 });
        },
        toResponse: async (result) => {
          if (result instanceof Response) {
            return result;
          }
          return Response.json(result);
        },
      });
      return response ?? new Response('Not found', { status: 404 });
    };
  },
);
