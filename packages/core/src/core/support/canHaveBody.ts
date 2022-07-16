import type { Method, MethodWithBody } from '../../types';

export function canHaveBody(method: Method): method is MethodWithBody {
  return method === 'POST' || method === 'PUT';
}
