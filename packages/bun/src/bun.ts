import { createCreateApplication, HttpError } from './core';
import { Request } from './Request';
import { Response as CustomResponse } from './Response';
import type { Request as BaseRequest } from './builtins';

export const createApplication = createCreateApplication((router, options) => {
  const { getContext } = options;

  const routeRequest = async (baseRequest: BaseRequest): Promise<Response> => {
    const { method, url } = baseRequest;
    const { pathname } = new URL(url);
    const getResult = async () => {
      const matches = router.getMatches(method, pathname);
      for (const [handler, captures] of matches) {
        const request = new Request(baseRequest, Object.fromEntries(captures));
        const context = getContext?.(request);
        const requestWithContext =
          context === undefined ? request : Object.assign(request, context);
        const result = handler(requestWithContext);
        if (result !== undefined) {
          return result;
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
      // TODO: If result is an object containing a circular reference, this
      // next line will throw, resulting in a 500 response with no
      // indication of which handler caused it.
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

  return async (request: BaseRequest) => {
    const response = await routeRequest(request);
    if (response instanceof CustomResponse) {
      return response.toNativeResponse(options);
    }
    return response;
  };
});
