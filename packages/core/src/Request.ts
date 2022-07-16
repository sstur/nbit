export class Request<M extends string, Params extends string> {
  readonly method = '' as M;
  readonly params = {} as { [K in Params]: string };
}
