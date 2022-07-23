/**
 * Adapted from
 * https://github.com/http-party/http-server/blob/b0cb863/lib/core/index.js
 * which is licensed under the MIT license.
 */
import { type Stats } from 'fs';

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

export function generateEtag(stat: Stats) {
  // TODO: Create a hash from this data?
  const parts = [stat.size.toString(16), stat.mtime.valueOf().toString(16)];
  return `W/"${parts.join('-')}"`;
}
