const CERT_DIR = 'CERT_DIR';
const TIMEOUT = 'TIMEOUT';

interface CustomError extends Error {
  statusCode?: number;
  response?: string;
}

const ABORTED_BY_USER = 'Request is aborted by user';

export type {CustomError};
export {CERT_DIR, TIMEOUT, ABORTED_BY_USER};