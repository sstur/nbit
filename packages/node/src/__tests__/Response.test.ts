import { Readable } from 'stream';

import { Response } from '../applicationTypes';

describe('Response', () => {
  it('should construct with no args', () => {
    const response = new Response();
    expect(response.body).toBe(null);
    expect(response.bodyRaw).toBe(null);
    expect(Object.fromEntries(response.headers)).toEqual({});
  });

  it('should construct with undefined', () => {
    const response = new Response(undefined);
    expect(Object.fromEntries(response.headers)).toEqual({});
    expect(response.bodyUsed).toBe(false);
    expect(response.body).toBe(null);
    expect(response.bodyRaw).toBe(null);
    expect(response.bodyUsed).toBe(false);
  });

  it('should construct with null', () => {
    const response = new Response(null);
    expect(Object.fromEntries(response.headers)).toEqual({});
    expect(response.body).toBe(null);
    expect(response.bodyRaw).toBe(null);
  });

  it('should construct with string', async () => {
    const response = new Response('foo');
    expect(Object.fromEntries(response.headers)).toEqual({
      'Content-Type': 'text/plain;charset=UTF-8',
    });
    expect(response.body instanceof Readable).toBe(true);
    expect(response.bodyRaw).toEqual('foo');
    expect(response.bodyUsed).toBe(false);
    const text = await response.text();
    expect(text).toBe('foo');
    expect(response.bodyUsed).toBe(true);
    await expect(response.text()).rejects.toThrow(
      `TypeError: Failed to execute 'text' on 'Response': body stream already read`,
    );
  });

  it('should honor headers', async () => {
    const response = new Response('foo', {
      headers: { foo: 'foo', 'content-type': 'bar' },
    });
    expect(Object.fromEntries(response.headers)).toEqual({
      foo: 'foo',
      'content-type': 'bar',
    });
    expect(response.bodyRaw).toEqual('foo');
    expect(response.bodyUsed).toBe(false);
    const text = await response.text();
    expect(text).toBe('foo');
  });

  it('should construct with buffer', async () => {
    const response = new Response(Buffer.from('foo'));
    expect(Object.fromEntries(response.headers)).toEqual({});
    expect(response.body instanceof Readable).toBe(true);
    const stream = response.body;
    expect(response.body).toBe(stream);
    expect(Buffer.isBuffer(response.bodyRaw)).toBe(true);
    expect(response.bodyUsed).toBe(false);
    const text = await response.text();
    expect(text).toBe('foo');
    expect(response.bodyUsed).toBe(true);
    await expect(response.text()).rejects.toThrow(
      `TypeError: Failed to execute 'text' on 'Response': body stream already read`,
    );
  });

  it('should construct with stream', async () => {
    const stream = Readable.from('foo', { objectMode: false });
    const response = new Response(stream);
    expect(Object.fromEntries(response.headers)).toEqual({});
    expect(response.body).toBe(stream);
    expect(response.bodyRaw).toBe(stream);
    expect(response.bodyUsed).toBe(false);
    const text = await response.text();
    expect(text).toBe('foo');
    expect(response.bodyUsed).toBe(true);
    await expect(response.text()).rejects.toThrow(
      `TypeError: Failed to execute 'text' on 'Response': body stream already read`,
    );
  });

  it('should construct with Response.json()', async () => {
    const response = Response.json({ foo: 1 });
    expect(Object.fromEntries(response.headers)).toEqual({
      'Content-Type': 'application/json;charset=UTF-8',
    });
    expect(response.body instanceof Readable).toBe(true);
    expect(response.bodyRaw).toBe(JSON.stringify({ foo: 1 }));
    expect(response.bodyUsed).toBe(false);
    const parsed = await response.json();
    expect(parsed).toEqual({ foo: 1 });
    expect(response.bodyUsed).toBe(true);
    await expect(response.text()).rejects.toThrow(
      `TypeError: Failed to execute 'text' on 'Response': body stream already read`,
    );
    await expect(response.json()).rejects.toThrow(
      `TypeError: Failed to execute 'json' on 'Response': body stream already read`,
    );
  });

  it('should parse JSON string regardless of content-type', async () => {
    const response = new Response(JSON.stringify({ foo: 1 }));
    expect(Object.fromEntries(response.headers)).toEqual({
      'Content-Type': 'text/plain;charset=UTF-8',
    });
    const parsed = await response.json();
    expect(parsed).toEqual({ foo: 1 });
  });

  it('should parse JSON buffer regardless of content-type', async () => {
    const response = new Response(Buffer.from(JSON.stringify({ foo: 1 })));
    expect(Object.fromEntries(response.headers)).toEqual({});
    const parsed = await response.json();
    expect(parsed).toEqual({ foo: 1 });
  });

  it('should throw on invalid JSON', async () => {
    const response = new Response(Buffer.from('foo'));
    expect(Object.fromEntries(response.headers)).toEqual({});
    await expect(response.json()).rejects.toThrow(`Unexpected token`);
  });
});
