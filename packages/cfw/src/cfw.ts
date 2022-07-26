import { createCreateApplication, HttpError } from './core';
import CustomRequest from './Request';

export const createApplication = createCreateApplication(
  (router, applicationOptions) => {
    const { getContext } = applicationOptions;

    // TODO: Rename this to processRequest or getResponse?
    const routeRequest = async (baseRequest: Request): Promise<Response> => {
      const { method, url } = baseRequest;
      const { pathname } = new URL(url);

      const toResponse = async (input: unknown) => {
        if (input instanceof Response) {
          return input;
        }
        return Response.json(input);
      };

      // TODO: Factor this getResult up into core? Would need the old approach of Captures -> Request
      const getResult = async () => {
        const matches = router.getMatches(method, pathname);
        for (const [handler, captures] of matches) {
          const request = new CustomRequest(baseRequest, captures);
          // TODO: Move this outside the loop and use await
          const context = getContext?.(request);
          const requestWithContext =
            context === undefined ? request : Object.assign(request, context);
          const result = await handler(requestWithContext);
          if (result !== undefined) {
            return await toResponse(result);
          }
        }
      };

      try {
        const result = await getResult();
        if (result === undefined) {
          return new Response('Not found', {
            status: 404,
            headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
          });
        }
        return result instanceof Response ? result : Response.json(result);
      } catch (e) {
        if (e instanceof HttpError) {
          return new Response(e.message, {
            status: e.status,
            headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
          });
        } else {
          return new Response(String(e), {
            status: 500,
            headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
          });
        }
      }
    };

    return async (request: Request) => {
      return await routeRequest(request);
    };
  },
);
