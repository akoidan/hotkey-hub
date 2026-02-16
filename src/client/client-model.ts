const CERT_DIR = 'CERT_DIR';
const TIMEOUT = 'TIMEOUT';

interface CustomError extends Error {
  statusCode?: number;
  response?: string;
}


export type {CustomError};
export {CERT_DIR, TIMEOUT};