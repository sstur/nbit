import { Headers } from '../web-io';

// https://nodejs.org/docs/latest-v16.x/api/http.html#messagerawheaders
export function fromNodeRawHeaders(rawHeaders: Array<string>) {
  const headers = new Headers();
  for (let i = 0; i < rawHeaders.length; i++) {
    const name = rawHeaders[i] ?? '';
    const value = rawHeaders[++i] ?? '';
    headers.append(name, value);
  }
  return headers;
}

// Helper to convert headers to the object expected by Node's
// response.writeHead().
// https://nodejs.org/docs/latest-v16.x/api/http.html#responsewriteheadstatuscode-statusmessage-headers
export function toNodeHeaders(headers: Headers) {
  const result: Record<string, string | Array<string>> = {};
  for (const [name, values] of headers.headers.values()) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    result[name] = values.length === 1 ? values[0]! : values;
  }
  return result;
}
