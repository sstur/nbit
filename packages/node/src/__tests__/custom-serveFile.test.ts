import { Request } from '../applicationTypes';
import Response from '../core/CustomResponse';
import { createApplication } from '../node';

describe('serveFile', () => {
  const { defineRoutes, createRequestHandler } = createApplication({
    root: '/home/foo',
    allowStaticFrom: ['public'],
    serveFile: async (params) => {
      const { status, headers, ...other } = params;
      const headersObject = Object.fromEntries(headers.entries());
      return Response.json(
        { status, headers: headersObject, ...other },
        {
          status,
          headers: { ...headersObject, ETag: params.filePath },
        },
      );
    },
  });

  it('should invoke custom serveFile', async () => {
    const routes = defineRoutes((app) => [
      app.get('/file', async (_request) => {
        return Response.file('public/file.txt');
      }),
    ]);
    const requestHandler = createRequestHandler(routes);
    const request = new Request('http://localhost/file');
    const response = await requestHandler(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('ETag')).toBe('public/file.txt');
    const parsed = await response.json();
    expect(parsed).toEqual({
      filePath: 'public/file.txt',
      fullFilePath: '/home/foo/public/file.txt',
      status: 200,
      statusText: '',
      headers: {},
      options: {},
    });
  });

  it('should pass through init options', async () => {
    const routes = defineRoutes((app) => [
      app.get('/file', async (_request) => {
        return Response.file('public/file.txt', {
          status: 404,
          headers: { foo: '1' },
          maxAge: 10,
          cachingHeaders: true,
        });
      }),
    ]);
    const requestHandler = createRequestHandler(routes);
    const request = new Request('http://localhost/file');
    const response = await requestHandler(request);
    expect(response.status).toBe(404);
    expect(response.headers.get('foo')).toBe('1');
    expect(response.headers.get('ETag')).toBe('public/file.txt');
    const parsed = await response.json();
    expect(parsed).toEqual({
      filePath: 'public/file.txt',
      fullFilePath: '/home/foo/public/file.txt',
      status: 404,
      statusText: '',
      headers: { foo: '1' },
      options: { maxAge: 10, cachingHeaders: true },
    });
  });
});
