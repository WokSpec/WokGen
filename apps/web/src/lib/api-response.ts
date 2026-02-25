// Standard API response helpers
export function apiSuccess<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function apiError({ message, code, status }: { message: string; code: string; status: number }) {
  return Response.json({ error: message, code, status }, { status });
}

export const API_ERRORS = {
  UNAUTHORIZED: () => apiError({ message: 'Authentication required', code: 'UNAUTHORIZED', status: 401 }),
  FORBIDDEN: () => apiError({ message: 'Access denied', code: 'FORBIDDEN', status: 403 }),
  NOT_FOUND: (resource = 'Resource') => apiError({ message: `${resource} not found`, code: 'NOT_FOUND', status: 404 }),
  BAD_REQUEST: (msg: string) => apiError({ message: msg, code: 'BAD_REQUEST', status: 400 }),
  RATE_LIMITED: () => apiError({ message: 'Too many requests', code: 'RATE_LIMITED', status: 429 }),
  INTERNAL: (msg = 'Internal server error') => apiError({ message: msg, code: 'INTERNAL_ERROR', status: 500 }),
  VALIDATION: (msg: string) => apiError({ message: msg, code: 'VALIDATION_ERROR', status: 422 }),
};
