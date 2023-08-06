import { Request } from '../../applicationTypes';
import { CustomRequest } from '../CustomRequest';
import { HttpError } from '../HttpError';

describe('CustomRequest', () => {
  it('should instantiate with full url', async () => {
    const request = new Request('https://example.com/foo/bar?a=1&b=_');
    const customRequest = new CustomRequest(request);
    const { method, url, headers, path, search, query, params } = customRequest;
    expect({ method, url, path, search, params }).toEqual({
      method: 'GET',
      url: 'https://example.com/foo/bar?a=1&b=_',
      path: '/foo/bar',
      search: '?a=1&b=_',
      params: {},
    });
    expect(Object.fromEntries(query)).toEqual({ a: '1', b: '_' });
    expect(Object.fromEntries(headers)).toEqual({});
  });

  it('should throw if wrong content type', async () => {
    const request = new Request('/foo', {
      method: 'post',
      headers: { 'content-type': 'text/plain' },
      body: JSON.stringify({ foo: 1 }),
    });
    const customRequest = new CustomRequest(request);
    await expect(customRequest.json()).rejects.toEqual(
      new HttpError({ status: 400, message: 'Invalid JSON body' }),
    );
  });

  it('should throw if no content type', async () => {
    const request = new Request('/foo', {
      method: 'post',
      body: JSON.stringify({ foo: 1 }),
    });
    const customRequest = new CustomRequest(request);
    await expect(customRequest.json()).rejects.toEqual(
      new HttpError({ status: 400, message: 'Invalid JSON body' }),
    );
  });
});
