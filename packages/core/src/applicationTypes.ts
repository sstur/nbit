export { Request } from './mocks/Request';
export { Response, type ResponseInit } from './mocks/Response';
export { Headers, type HeadersInit } from './mocks/Headers';

export type NativeHandler = (request: unknown) => Promise<unknown>;
