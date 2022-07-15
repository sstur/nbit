// This is required by `new URL()` for parsing but it doesn't matter what value
// this has since it's not used.
// See: https://nodejs.org/docs/latest-v12.x/api/url.html#url_url
const URL_BASE = 'https://0.0.0.0';

export function parseUrl(url: string) {
  return new URL(url, URL_BASE);
}
