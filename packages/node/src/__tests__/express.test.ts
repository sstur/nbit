import { Readable } from 'stream';

import { createApplication } from '../express';
import Response from '../core/CustomResponse';

import { createMockExpress } from './helpers/createMockExpress';

const { defineRoutes, attachRoutes } = createApplication({
  allowStaticFrom: ['public'],
  getContext: (request) => ({
    auth: () => {
      return request.headers.get('authentication') ?? '';
    },
  }),
});

const routes = defineRoutes((app) => [
  app.get('/', () => {
    return { a: 1 };
  }),
  app.get('/null', () => {
    return new Response(null, { status: 400 });
  }),
  app.get('/buffer', () => {
    return new Response(Buffer.from('foo'), {
      status: 418,
      statusText: 'Yo',
      headers: { foo: 'x' },
    });
  }),
  app.get('/file', () => {
    return Response.file('public/foo.txt');
  }),
  app.get('/stream', () => {
    const data = 'Hello';
    return new Response(Readable.from(data, { objectMode: false }));
  }),
  app.get('/error', () => {
    throw new Error('Waat');
  }),
  app.get('/error2', () => {
    throw new Error('Rethrow');
  }),
]);

describe('express', () => {
  const expressHandler = attachRoutes(routes);

  it('should handle a json response body', async () => {
    const [req, res, next, promise] = createMockExpress('/');
    expressHandler(req, res, next);
    await promise;
    expect(next).toHaveBeenCalledTimes(0);
    expect(res.writeHead).toHaveBeenCalledTimes(1);
    expect(res.writeHead).toHaveBeenCalledWith(200, '', {
      'Content-Type': 'application/json;charset=UTF-8',
    });
    expect(res.write).toHaveBeenCalledTimes(1);
    expect(res.write).toHaveBeenCalledWith('{"a":1}');
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('should handle a null response body', async () => {
    const [req, res, next, promise] = createMockExpress('/null');
    expressHandler(req, res, next);
    await promise;
    expect(next).toHaveBeenCalledTimes(0);
    expect(res.writeHead).toHaveBeenCalledTimes(1);
    expect(res.writeHead).toHaveBeenCalledWith(400, '', {});
    expect(res.write).toHaveBeenCalledTimes(0);
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('should handle a buffer response body', async () => {
    const [req, res, next, promise] = createMockExpress('/buffer');
    expressHandler(req, res, next);
    await promise;
    expect(next).toHaveBeenCalledTimes(0);
    expect(res.writeHead).toHaveBeenCalledTimes(1);
    expect(res.writeHead).toHaveBeenCalledWith(418, 'Yo', { foo: 'x' });
    expect(res.write).toHaveBeenCalledTimes(1);
    expect(res.write).toHaveBeenCalledWith(Buffer.from('foo'));
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('should forward an error to next', async () => {
    const [req, res, next, promise] = createMockExpress('/error');
    expressHandler(req, res, next);
    await promise;
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new Error('Waat'));
    expect(res.writeHead).toHaveBeenCalledTimes(0);
    expect(res.write).toHaveBeenCalledTimes(0);
    expect(res.end).toHaveBeenCalledTimes(0);
  });

  it('should handle an error thrown by the framework', async () => {
    const [req, res, next, promise] = createMockExpress('/error2');
    expressHandler(req, res, next);
    await promise;
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new Error('Rethrow'));
    expect(res.writeHead).toHaveBeenCalledTimes(1);
    expect(res.writeHead).toHaveBeenCalledWith(500);
    expect(res.write).toHaveBeenCalledTimes(0);
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(res.end).toHaveBeenCalledWith('Error: Rethrow');
  });

  it('should call next() on no route', async () => {
    const [req, res, next, promise] = createMockExpress('/nothing');
    expressHandler(req, res, next);
    await promise;
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(res.writeHead).toHaveBeenCalledTimes(0);
    expect(res.write).toHaveBeenCalledTimes(0);
    expect(res.end).toHaveBeenCalledTimes(0);
  });

  it('should use res.sendFile()', async () => {
    const [req, res, next, promise] = createMockExpress('/file');
    expressHandler(req, res, next);
    await promise;
    expect(next).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.writeHead).toHaveBeenCalledTimes(0);
    expect(res.write).toHaveBeenCalledTimes(0);
    expect(res.end).toHaveBeenCalledTimes(0);
    expect(res.sendFile).toHaveBeenCalledTimes(1);
    expect(res.sendFile).toHaveBeenCalledWith(
      'foo.txt',
      {
        headers: {},
        lastModified: true,
        maxAge: undefined,
        root: 'public',
      },
      next,
    );
  });

  it('should handle a stream response body', async () => {
    const [req, res, next, promise] = createMockExpress('/stream');
    expressHandler(req, res, next);
    await promise;
    expect(next).toHaveBeenCalledTimes(0);
    expect(res.writeHead).toHaveBeenCalledTimes(1);
    expect(res.writeHead).toHaveBeenCalledWith(200, '', {});
    expect(res.write).toHaveBeenCalledTimes(1);
    expect(res.write).toHaveBeenCalledWith(Buffer.from('Hello'));
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  describe('custom serveFile', () => {
    const { defineRoutes, attachRoutes } = createApplication({
      root: '/home/foo',
      allowStaticFrom: ['public'],
      serveFile: async (params) => {
        const { status, headers, filePath, ...other } = params;
        if (filePath.endsWith('/file2.txt')) {
          return null;
        }
        const headersObject = Object.fromEntries(headers.entries());
        return Response.json(
          { status, headers: headersObject, filePath, ...other },
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
      const expressHandler = attachRoutes(routes);
      const [req, res, next, promise] = createMockExpress('/file');
      expressHandler(req, res, next);
      await promise;
      expect(next).toHaveBeenCalledTimes(0);
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.writeHead).toHaveBeenCalledWith(200, '', {
        'Content-Type': 'application/json;charset=UTF-8',
        ETag: 'public/file.txt',
      });
      expect(res.write).toHaveBeenCalledTimes(1);
      const data = Object(res.write).mock.calls[0][0];
      const parsed = JSON.parse(String(data));
      expect(parsed).toEqual({
        filePath: 'public/file.txt',
        fullFilePath: '/home/foo/public/file.txt',
        status: 200,
        statusText: '',
        headers: {},
        options: {},
      });
      expect(res.end).toHaveBeenCalledTimes(1);
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
      const expressHandler = attachRoutes(routes);
      const [req, res, next, promise] = createMockExpress('/file');
      expressHandler(req, res, next);
      await promise;
      expect(next).toHaveBeenCalledTimes(0);
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.writeHead).toHaveBeenCalledWith(404, '', {
        'Content-Type': 'application/json;charset=UTF-8',
        foo: '1',
        ETag: 'public/file.txt',
      });
      expect(res.write).toHaveBeenCalledTimes(1);
      const data = Object(res.write).mock.calls[0][0];
      const parsed = JSON.parse(String(data));
      expect(parsed).toEqual({
        filePath: 'public/file.txt',
        fullFilePath: '/home/foo/public/file.txt',
        status: 404,
        statusText: '',
        headers: { foo: '1' },
        options: { maxAge: 10, cachingHeaders: true },
      });
      expect(res.end).toHaveBeenCalledTimes(1);
    });

    it('should allow returning null', async () => {
      const routes = defineRoutes((app) => [
        app.get('/file2', async (_request) => {
          return Response.file('public/file2.txt');
        }),
      ]);
      const expressHandler = attachRoutes(routes);
      const [req, res, next, promise] = createMockExpress('/file2');
      expressHandler(req, res, next);
      await promise;
      expect(next).toHaveBeenCalledTimes(0);
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.writeHead).toHaveBeenCalledWith(404, '', {
        'Content-Type': 'text/plain;charset=UTF-8',
      });
      expect(res.write).toHaveBeenCalledTimes(1);
      expect(res.write).toHaveBeenCalledWith('Not found');
      expect(res.end).toHaveBeenCalledTimes(1);
    });
  });
});
