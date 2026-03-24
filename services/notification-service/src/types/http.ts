import { Request } from 'express';

export type RequestWithCorrelationId = Request & {
  headers: Request['headers'] & {
    'x-correlation-id'?: string;
  };
};
