import { defineAdapter } from './core';
import { StaticFile } from './core/StaticFile';
import { resolveFilePath } from './support/resolveFilePath';

export const createApplication = defineAdapter((applicationOptions) => {
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
  };

  return {
    onError: (request, error) => {
      return new Response(String(error), { status: 500 });
    },
    toResponse: async (request, result) => {
      if (result instanceof StaticFile) {
        return await fromStaticFile(request.headers, result);
      }
      return result;
    },
    createNativeHandler: (handleRequest) => handleRequest,
  };
});
