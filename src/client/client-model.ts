const CERT_DIR = 'CERT_DIR';
const TIMEOUT = 'TIMEOUT';

interface CustomError extends Error {
  statusCode?: number;
  response?: string;
}

interface RequestOptions {
  query?: Record<string, string>,
  payload?: unknown,
  timeout?: number,
}

interface ApiOptions {
  timeout?: number;
}

const ABORTED_BY_USER = 'Request is aborted by user';

export type {CustomError, RequestOptions, ApiOptions};
export {CERT_DIR, TIMEOUT, ABORTED_BY_USER};