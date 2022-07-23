import { getBun } from './Bun';
import { getRequest, getResponse } from './getters';

export const Request = getRequest();
export const Response = getResponse();

export type Request = InstanceType<typeof Request>;
export type Response = InstanceType<typeof Response>;

export const Bun = getBun();
