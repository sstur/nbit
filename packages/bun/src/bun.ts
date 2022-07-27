import { createCreateApplication } from './core';
import { StaticFile } from './core/StaticFile';
import CustomRequest from './Request';
import { resolveFilePath } from './fs';
import { serveFile } from './support/serveFile';

export const createApplication = createCreateApplication(
  (routeRequest, applicationOptions) => {
    // Note: This `fromStaticFile` implementation is identical to that of node
    // except it uses a custom serveFile (which uses a custom statAsync and
    // returns a FileBlob instead of read stream).
    const fromStaticFile = async (
      requestHeaders: Headers,
      file: StaticFile,
    ): Promise<Response | undefined> => {
      const { filePath, options, responseInit: init } = file;
      const resolved = resolveFilePath(filePath, applicationOptions);
      if (!resolved) {
        return;
      }
      const [fullFilePath] = resolved;
      const fileResponse = await serveFile(
        requestHeaders,
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

    return async (request: Request) => {
      const { method } = request;
      const { pathname } = new URL(request.url);
      return await routeRequest({
        method,
        pathname,
        instantiateRequest: (captures) => {
          // TODO: Should we pass in the parsed URL to avoid parsing it again
          return new CustomRequest(request, captures);
        },
        onError: (e) => {
          return new Response(String(e), {
            status: 500,
            headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
          });
        },
        toResponse: async (input: unknown) => {
          if (input instanceof Response) {
            return input;
          }
          if (input instanceof StaticFile) {
            return await fromStaticFile(request.headers, input);
          }
          return Response.json(input);
        },
      });
    };
  },
);
