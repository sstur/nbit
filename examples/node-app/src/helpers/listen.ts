import type { Server as HttpServer } from 'http';
import type { ListenOptions } from 'net';

/**
 * Start an httpServer listening. Returns a promise that will resolve when
 * server has started listening successfully or will reject with an error such
 * as EADDRINUSE.
 */
export function listen(httpServer: HttpServer, options: ListenOptions) {
  return new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(options, () => {
      httpServer.removeListener('error', reject);
      resolve();
    });
  });
}
