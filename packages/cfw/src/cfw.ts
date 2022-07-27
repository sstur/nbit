import { createCreateApplication } from './core';
import CustomRequest from './Request';

export const createApplication = createCreateApplication(
  (routeRequest, _applicationOptions) => {
    return async (request: Request) => {
      const { method } = request;
      const { pathname } = new URL(request.url);
      const response = await routeRequest({
        method,
        pathname,
        instantiateRequest: (captures) => {
          // TODO: Should we pass in the parsed URL to avoid parsing it again
          return new CustomRequest(request, captures);
        },
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
