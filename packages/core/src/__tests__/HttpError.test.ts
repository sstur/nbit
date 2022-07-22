import { HttpError } from '../core/HttpError';

describe('HttpError', () => {
  it('should be a fully-functional subclass of Error', () => {
    const error = new HttpError({ status: 400, message: 'Bad Input' });

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toBeInstanceOf(Error);

    expect(error.status).toBe(400);
    expect(error.message).toBe('Bad Input');
    expect(error.toString()).toBe('HttpError: Bad Input');
    expect(error.name).toBe('HttpError');

    expect(HttpError.name).toBe('HttpError');
    expect(Object.prototype.toString.call(error)).toBe('[object HttpError]');
  });
});
