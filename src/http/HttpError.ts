type HttpErrorInit = {
  status: number;
  message: string;
};

export class HttpError extends Error {
  readonly status: number;

  constructor({ status, message }: HttpErrorInit, options?: ErrorOptions) {
    super(message, options);
    this.status = status;
  }

  get name() {
    return this.constructor.name;
  }

  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
}
