import { defineAdapter } from './core';
import { StaticFile } from './core/StaticFile';
import { resolveFilePath } from './fs';
import { serveFile } from './support/serveFile';

export const createApplication = defineAdapter((applicationOptions) => {
  // This `fromStaticFile` function is identical to that of node.
  const fromStaticFile = async (
    requestHeaders: Headers,
    staticFile: StaticFile,
  ): Promise<Response | undefined> => {
    const { filePath, options, responseInit: init } = staticFile;
    const resolved = resolveFilePath(filePath, applicationOptions);
    if (!resolved) {
      return;
    }
    const [fullFilePath] = resolved;
    const customServeFile = applicationOptions.serveFile;
    if (customServeFile) {
      const { status, statusText, headers } = new Response(null, init);
      const maybeResponse = await customServeFile({
        filePath,
        fullFilePath,
        status,
        statusText,
        headers,
        options,
      });
      return maybeResponse ?? undefined;
    }
    const fileResponse = await serveFile(requestHeaders, fullFilePath, options);
    if (!fileResponse) {
      return;
    }
    // Use the status from fileResponse if provided (e.g. "304 Not Modified")
    // otherwise fall back to user-specified value or default.
    const responseStatus = fileResponse.status ?? init.status ?? 200;
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

  return {
    onError: (request, error) => {
      return new Response(String(error), { status: 500 });
    },
    toResponse: async (request, result) => {
      if (result instanceof StaticFile) {
        result = await fromStaticFile(request.headers, result);
      }
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
