/* eslint-disable @typescript-eslint/no-explicit-any */
import { Readable } from 'stream';

import { Request } from '../Request';

describe('Request', () => {
  it('should not construct with just path', () => {
    expect(() => new Request('/')).toThrow('Invalid URL');
  });

  it('should respect method and headers', () => {
    const request = new Request('http://localhost/', {
      method: 'PUT',
      headers: { foo: 'foo', 'content-type': 'bar' },
    });
    expect(request.method).toBe('PUT');
    expect(request.url).toBe('http://localhost/');
    expect(Object.fromEntries(request.headers)).toEqual({
      foo: 'foo',
      'content-type': 'bar',
    });
    expect(request.body).toBe(null);
    expect(request.bodyRaw).toBe(null);
  });

  it('should construct with a null body', () => {
    const request = new Request('http://localhost/', { body: null });
    expect(request.method).toBe('GET');
    expect(request.url).toBe('http://localhost/');
    expect(Object.fromEntries(request.headers)).toEqual({});
    expect(request.body).toBe(null);
    expect(request.bodyRaw).toBe(null);
  });

  it('should construct with a string body', () => {
    const request = new Request('http://localhost/', { body: 'foo' });
    expect(request.method).toBe('GET');
    expect(request.url).toBe('http://localhost/');
    expect(Object.fromEntries(request.headers)).toEqual({});
    expect(request.body instanceof Readable).toBe(true);
    expect(request.bodyRaw).toBe('foo');
  });

  it('should construct with a buffer body', () => {
    const buffer = Buffer.from('foo');
    const request = new Request('http://localhost/foo', {
      method: 'post',
      body: buffer,
    });
    expect(request.method).toBe('POST');
    expect(Object.fromEntries(request.headers)).toEqual({});
    expect(request.body instanceof Readable).toBe(true);
    expect(request.bodyRaw).toBe(buffer);
  });

  it('should construct with a stream body', async () => {
    const stream = Readable.from('foo', { objectMode: false });
    const request = new Request('http://localhost/foo', { body: stream });
    expect(Object.fromEntries(request.headers)).toEqual({});
    expect(request.body).toBe(stream);
    expect(request.bodyRaw).toBe(stream);
    expect(request.bodyUsed).toBe(false);
    const text = await request.text();
    expect(text).toBe('foo');
    expect(request.bodyUsed).toBe(true);
    await expect(request.text()).rejects.toThrow(
      `TypeError: Failed to execute 'text' on 'Request': body stream already read`,
    );
  });

  it('should parse a json body from buffer', async () => {
    const buffer = Buffer.from(JSON.stringify({ foo: 1 }));
    const request = new Request('http://localhost/foo', {
      method: 'post',
      headers: { 'content-type': 'application/json' },
      body: buffer,
    });
    expect(Object.fromEntries(request.headers)).toEqual({
      'content-type': 'application/json',
    });
    expect(request.body instanceof Readable).toBe(true);
    expect(request.bodyRaw).toBe(buffer);
    expect(request.bodyUsed).toBe(false);
    const parsed = await request.json();
    expect(parsed).toEqual({ foo: 1 });
    expect(request.bodyUsed).toBe(true);
    await expect(request.text()).rejects.toThrow(
      `TypeError: Failed to execute 'text' on 'Request': body stream already read`,
    );
  });

  it('should parse a json body from stream', async () => {
    const stream = Readable.from(JSON.stringify({ foo: 1 }), {
      objectMode: false,
    });
    const request = new Request('http://localhost/foo', {
      method: 'get',
      body: stream,
    });
    expect(Object.fromEntries(request.headers)).toEqual({});
    const parsed = await request.json();
    expect(parsed).toEqual({ foo: 1 });
    expect(request.bodyUsed).toBe(true);
    await expect(request.json()).rejects.toThrow(
      `TypeError: Failed to execute 'json' on 'Request': body stream already read`,
    );
  });

  it('should throw if unable to parse json', async () => {
    const request = new Request('http://localhost/foo', {
      method: 'post',
      body: '[1, 2',
    });
    await expect(request.json()).rejects.toThrow(
      `Unexpected end of JSON input`,
    );
  });

  it('should throw if content-length smaller than body size', async () => {
    const request = new Request('http://localhost/foo', {
      method: 'post',
      headers: { 'content-length': '2' },
      body: 'foo',
    });
    await expect(request.text()).rejects.toThrow(
      `Request body size did not match content-length header`,
    );
  });

  it('should throw if content-length greater than body size', async () => {
    const request = new Request('http://localhost/foo', {
      method: 'post',
      headers: { 'content-length': '4' },
      body: 'foo',
    });
    await expect(request.text()).rejects.toThrow(
      `Request body size did not match content-length header`,
    );
  });

  it('should throw if body size exceeds maximum allowed', async () => {
    const request = new Request('http://localhost/foo', {
      method: 'post',
      headers: { 'content-length': '4' },
      body: 'x'.repeat(1001),
      options: { bodyParserMaxBufferSize: 1000 },
    });
    let error: any;
    try {
      await request.text();
    } catch (e) {
      error = e;
    }
    expect(error.status).toBe(413);
    expect(error.message).toBe('Request Entity Too Large');
  });
});
