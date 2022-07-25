import { createCreateApplication, HttpError } from './core';
import { StaticFile } from './core/StaticFile';
import CustomRequest from './Request';
import { resolveFilePath } from './core/support/resolveFilePath';
import { serveFile } from './support/serveFile';

export const createApplication = createCreateApplication(
  (router, applicationOptions) => {
    const { getContext } = applicationOptions;

    // TODO: Rename this to processRequest or getResponse?
    const routeRequest = async (baseRequest: Request): Promise<Response> => {
      const { method, url } = baseRequest;
      const { pathname } = new URL(url);

      // TODO: Factor out the following 3 functions?
      // Note: This `fromStaticFile` implementation is identical to that of node
      // except it uses a custom serveFile (which uses a custom statAsync and
      // returns a FileBlob instead of read stream).
      const fromStaticFile = async (
        file: StaticFile,
      ): Promise<Response | undefined> => {
        const { filePath, options, responseInit: init } = file;
        const resolved = resolveFilePath(filePath, applicationOptions);
        if (!resolved) {
          return;
        }
        const [fullFilePath] = resolved;
        const fileResponse = await serveFile(
          baseRequest.headers,
          fullFilePath,
          options,
        );
        if (!fileResponse) {
          return;
        }
        // Use the status from fileResponse if provided (e.g. "304 Not Modified")
        // otherwise fall back to user-specified value or default.
        const responseStatus = fileResponse.status ?? init?.status ?? 200;
        const responseHeaders = new Headers(init.headers);
        // Merge in the headers without overwriting existing headers
        for (const [key, value] of Object.entries(fileResponse.headers ?? {})) {
          if (!responseHeaders.has(key)) {
            responseHeaders.set(key, value);
          }
        }
        return new Response(fileResponse.body ?? '', {
          ...init,
          status: responseStatus,
          headers: responseHeaders,
        });
      };

      const toResponse = async (input: unknown) => {
        if (input === undefined || input instanceof Response) {
          return input;
        }
        if (input instanceof StaticFile) {
          return await fromStaticFile(input);
        }
        return Response.json(input);
      };

      // TODO: Factor this getResult up into core? Would need the old approach of Captures -> Request
      const getResult = async () => {
        const matches = router.getMatches(method, pathname);
        for (const [handler, captures] of matches) {
          const request = new CustomRequest(baseRequest, captures);
          const context = getContext?.(request);
          const requestWithContext =
            context === undefined ? request : Object.assign(request, context);
          const result = handler(requestWithContext);
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
