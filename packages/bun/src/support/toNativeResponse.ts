import { isStaticFile, type Response as WrappedResponse } from '../Response';
import { Response } from '../builtins';

export function toNativeResponse(response: WrappedResponse) {
  // TODO: statusText
  const { body, status, headers } = response;
  if (isStaticFile(body)) {
    return new Response('Error: Static file serving not yet supported.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  } else {
    return new Response(body, { status, headers });
  }
}
