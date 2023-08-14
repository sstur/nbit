import { HttpError } from '../HttpError';

describe('HttpError', () => {
  it('should work with status and message', () => {
    const error = new HttpError(400, 'Bad Input');
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(400);
    expect(error.message).toBe('Bad Input');
    expect(error.toString()).toBe('HttpError: Bad Input');
    expect(error.name).toBe('HttpError');
    expect(HttpError.name).toBe('HttpError');
    expect(Object.prototype.toString.call(error)).toBe('[object HttpError]');
  });

  it('should work with status only', () => {
    const error = new HttpError(400);
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(400);
    expect(error.message).toBe('400');
    expect(error.toString()).toBe('HttpError: 400');
    expect(error.name).toBe('HttpError');
    expect(HttpError.name).toBe('HttpError');
    expect(Object.prototype.toString.call(error)).toBe('[object HttpError]');
  });

  it('should work with init object', () => {
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
