// Adapted from https://github.com/jinder/path/blob/a2f87c3/path.js
// which is an exact copy of the NodeJS `path` module.

const CWD = '/';

// path.resolve([from ...], to)
export function resolve(...args: Array<string>) {
  let resolvedPath = '';
  let resolvedAbsolute = false;

  for (let i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    const path = i >= 0 ? args[i] : CWD;
    // Skip empty entries
    if (!path) {
      continue;
    }
    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path[0] === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe

  // Normalize the path
  resolvedPath = normalizeArray(
    resolvedPath.split('/'),
    !resolvedAbsolute,
  ).join('/');

  return (resolvedAbsolute ? '/' : '') + resolvedPath || '.';
}

export function join(...args: Array<string>) {
  let path = '';
  for (const segment of args) {
    if (segment) {
      path += path ? '/' + segment : segment;
    }
  }
  return normalize(path);
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts: Array<string>, allowAboveRoot?: boolean) {
  const res = [];
  for (const p of parts) {
    // ignore empty parts
    if (!p || p === '.') {
      continue;
    }
    if (p === '..') {
      if (res.length && res[res.length - 1] !== '..') {
        res.pop();
      } else if (allowAboveRoot) {
        res.push('..');
      }
    } else {
      res.push(p);
    }
  }
  return res;
}

function normalize(path: string) {
  const isPathAbsolute = isAbsolute(path);
  const trailingSlash = path ? path[path.length - 1] === '/' : false;

  // Normalize the path
  path = normalizeArray(path.split('/'), !isPathAbsolute).join('/');

  if (!path && !isPathAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isPathAbsolute ? '/' : '') + path;
}

function isAbsolute(path: string) {
  return path.charAt(0) === '/';
}
