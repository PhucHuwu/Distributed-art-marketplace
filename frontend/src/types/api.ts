export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  correlationId?: string | null;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details: unknown[];
  };
  correlationId?: string | null;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  code: string;
  status: number;
  details: unknown[];
  correlationId: string | null;

  constructor(input: {
    code: string;
    message: string;
    status: number;
    details?: unknown[];
    correlationId?: string | null;
  }) {
    super(input.message);
    this.name = 'ApiError';
    this.code = input.code;
    this.status = input.status;
    this.details = input.details || [];
    this.correlationId = input.correlationId || null;
  }
}
