import { Readable } from 'stream';

import { createApplication } from '../node';
import Response from '../core/CustomResponse';

import { createMockNode } from './helpers/createMockNode';

process.chdir('/project');

const { defineRoutes, attachRoutes } = createApplication({
  root: '/project',
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
  app.get('/file2', () => {
    return Response.file('public/foo.txt', {
      maxAge: 0,
    });
  }),
  app.get('/stream', () => {
    const data = 'Hello';
    return new Response(Readable.from(data, { objectMode: false }));
  }),
  app.get('/error', () => {
    throw new Error('Waat');
  }),
]);

describe('node', () => {
  const nodeHandler = attachRoutes(routes);

  it('should handle a json response body', async () => {
    const [req, res, promise] = createMockNode('/');
    nodeHandler(req, res);
    await promise;
    expect(res.writeHead).toHaveBeenCalledTimes(1);
    expect(res.writeHead).toHaveBeenCalledWith(200, '', {
      'Content-Type': 'application/json;charset=UTF-8',
    });
    expect(res.write).toHaveBeenCalledTimes(1);
    expect(res.write).toHaveBeenCalledWith('{"a":1}');
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('should handle a null response body', async () => {
    const [req, res, promise] = createMockNode('/null');
    nodeHandler(req, res);
    await promise;
    expect(res.writeHead).toHaveBeenCalledTimes(1);
    expect(res.writeHead).toHaveBeenCalledWith(400, '', {});
    expect(res.write).toHaveBeenCalledTimes(0);
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('should handle a buffer response body', async () => {
    const [req, res, promise] = createMockNode('/buffer');
    nodeHandler(req, res);
    await promise;
    expect(res.writeHead).toHaveBeenCalledTimes(1);
    expect(res.writeHead).toHaveBeenCalledWith(418, 'Yo', { foo: 'x' });
    expect(res.write).toHaveBeenCalledTimes(1);
    expect(res.write).toHaveBeenCalledWith(Buffer.from('foo'));
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('should handle error thrown', async () => {
    const [req, res, promise] = createMockNode('/error');
    nodeHandler(req, res);
    await promise;
    expect(res.writeHead).toHaveBeenCalledTimes(1);
    expect(res.writeHead).toHaveBeenCalledWith(500, '', {
      'Content-Type': 'text/plain;charset=UTF-8',
    });
    expect(res.write).toHaveBeenCalledTimes(1);
    expect(res.write).toHaveBeenCalledWith('Error: Waat');
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('should handle an error thrown by the framework', async () => {
    const [req, res, promise] = createMockNode('/', {
      headers: { throw: 'Foo' },
    });
    nodeHandler(req, res);
    await promise;
    expect(res.writeHead).toHaveBeenCalledTimes(2);
    expect(res.writeHead).toHaveBeenLastCalledWith(500);
    expect(res.write).toHaveBeenCalledTimes(0);
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(res.end).toHaveBeenCalledWith('Error: Foo');
  });

  it('should handle no route', async () => {
    const [req, res, promise] = createMockNode('/nothing');
    nodeHandler(req, res);
    await promise;
    expect(res.writeHead).toHaveBeenCalledTimes(1);
    expect(res.writeHead).toHaveBeenCalledWith(404, '', {
      'Content-Type': 'text/plain;charset=UTF-8',
    });
    expect(res.write).toHaveBeenCalledTimes(1);
    expect(res.write).toHaveBeenCalledWith('Not found');
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('should send file', async () => {
    const [req, res, promise] = createMockNode('/file');
    nodeHandler(req, res);
    await promise;
    expect(res.writeHead).toHaveBeenCalledTimes(1);
    expect(res.writeHead).toHaveBeenCalledWith(200, '', {
      'Content-Length': '12',
      'Content-Type': 'text/plain',
      ETag: 'W/"c18a1eeaccf8"',
      'Last-Modified': 'Tue, 22 Aug 2023 20:23:39 GMT',
    });
    expect(res.write).toHaveBeenCalledTimes(1);
    expect(res.write).toHaveBeenCalledWith(Buffer.from('Some content'));
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('should honor caching options', async () => {
    const [req, res, promise] = createMockNode('/file2');
    nodeHandler(req, res);
    await promise;
    expect(res.writeHead).toHaveBeenCalledTimes(1);
    expect(res.writeHead).toHaveBeenCalledWith(200, '', {
      'Content-Length': '12',
      'Content-Type': 'text/plain',
      ETag: 'W/"c18a1eeaccf8"',
      'Last-Modified': 'Tue, 22 Aug 2023 20:23:39 GMT',
      'Cache-Control': 'max-age=0',
    });
    expect(res.write).toHaveBeenCalledTimes(1);
    expect(res.write).toHaveBeenCalledWith(Buffer.from('Some content'));
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('should handle a stream response body', async () => {
    const [req, res, promise] = createMockNode('/stream');
    nodeHandler(req, res);
    await promise;
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
      const nodeHandler = attachRoutes(routes);
      const [req, res, promise] = createMockNode('/file');
      nodeHandler(req, res);
      await promise;
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
      const nodeHandler = attachRoutes(routes);
      const [req, res, promise] = createMockNode('/file');
      nodeHandler(req, res);
      await promise;
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
      const nodeHandler = attachRoutes(routes);
      const [req, res, promise] = createMockNode('/file2');
      nodeHandler(req, res);
      await promise;
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
