/**
 * Adapted from
 * https://github.com/http-party/http-server/blob/b0cb863/lib/core/index.js
 * which is licensed under the MIT license.
 */
import type { Headers } from '../applicationTypes';

import type { FileStats } from './fileServing';

export function shouldSend304(
  headers: Headers,
  serverLastModified: Date,
  serverEtag: string,
) {
  const clientModifiedSince = headers.get('if-modified-since');
  const clientEtag = headers.get('if-none-match');
  let clientModifiedDate;

  if (!clientModifiedSince && !clientEtag) {
    // Client did not provide any conditional caching headers
    return false;
  }

  if (clientModifiedSince) {
    // Catch "illegal access" dates that will crash v8
    try {
      clientModifiedDate = Date.parse(clientModifiedSince);
    } catch (err) {
      return false;
    }

    // TODO: Better checking here
    if (new Date(clientModifiedDate).toString() === 'Invalid Date') {
      return false;
    }
    // If the client's copy is older than the server's, don't return 304
    if (clientModifiedDate < serverLastModified.valueOf()) {
      return false;
    }
  }

  if (clientEtag) {
    // TODO: Should we trim the `W/` before comparing?
    if (clientEtag !== serverEtag) {
      return false;
    }
  }

  return true;
}

export function generateEtag(stats: FileStats) {
  const datePart = stats.mtimeMs.toString(16).padStart(11, '0');
  const sizePart = stats.size.toString(16);
  return `W/"${sizePart}${datePart}"`;
}
