// This is required by `new URL()` if the url is not fully-qualified (e.g. just
// a pathname). In most cases it doesn't matter what value we use here.
// See: https://nodejs.org/docs/latest-v12.x/api/url.html#url_url
const URL_BASE = 'http://0.0.0.0';

export function parseUrl(url: string) {
  return new URL(url, URL_BASE);
}
