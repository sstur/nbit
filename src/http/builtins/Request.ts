import { getRequest } from './getRequest';

export const Request = getRequest();

export type Request = InstanceType<typeof Request>;
