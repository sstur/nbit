type HttpErrorInit = {
  status: number;
  message?: string;
};

type Args = [
  status: number,
  message?: string | undefined,
  options?: ErrorOptions | undefined,
];
// This form is deprecated; remove in next major version
type ArgsLegacy = [init: HttpErrorInit, options?: ErrorOptions | undefined];

type ArgsAll = Args | ArgsLegacy;

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message?: string, options?: ErrorOptions);
  constructor(init: HttpErrorInit, options?: ErrorOptions);
  constructor(...args: ArgsAll) {
    const [status, message, options] = normalizeArgs(args);
    super(message ?? String(status), options);
    this.status = status;
  }

  get name() {
    return this.constructor.name;
  }

  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
}

function normalizeArgs(args: ArgsAll): Args {
  if (typeof args[0] === 'number') {
    return args as Args;
  }
  const [{ status, message }, options] = args as ArgsLegacy;
  return [status, message, options];
}
