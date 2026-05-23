/**
 * Centralized error handling utilities.
 * Handles Django REST framework error formats, network errors, and retries.
 */
import { showError } from '../components/Toast';

/**
 * Parse an API error response into a human-readable message.
 */
export const parseApiError = (error) => {
  if (!error) return 'An unexpected error occurred';

  if (error.message === 'Network Error') {
    return 'Cannot connect to server. Please check your internet connection.';
  }

  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }

  const status = error.response?.status;
  const data = error.response?.data;

  if (data) {
    if (typeof data === 'string') return data;
    if (data.detail) return data.detail;
    if (data.error) return data.error;
    if (data.message) return data.message;
    if (data.non_field_errors) return data.non_field_errors[0];

    // Field errors — join them
    const fieldErrors = Object.entries(data)
      .filter(([key]) => key !== 'status_code')
      .map(([field, errors]) => {
        const msgs = Array.isArray(errors) ? errors : [errors];
        return `${field}: ${msgs.join(', ')}`;
      });
    if (fieldErrors.length > 0) return fieldErrors.join('; ');
  }

  switch (status) {
    case 400: return 'Invalid request. Please check your input.';
    case 401: return 'Please log in to continue.';
    case 403: return 'You do not have permission to do this.';
    case 404: return 'The requested resource was not found.';
    case 429: return 'Too many requests. Please wait a moment.';
    case 500: return 'Server error. Please try again later.';
    case 503: return 'Service unavailable. Please try again later.';
    default:  return error.message || 'An unexpected error occurred';
  }
};

/**
 * Handle an error: parse it, show a toast, and log to console.
 * Returns the resolved message string.
 */
export const handleError = (error, fallbackMessage = null) => {
  const message = fallbackMessage || parseApiError(error);
  showError(message);
  console.error('Error:', error);
  return message;
};

/**
 * Retry an async function up to maxRetries times with linear back-off.
 * Throws the last error if all attempts fail.
 */
export const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
};

/** Returns true when the error is a network/connectivity error. */
export const isNetworkError = (error) =>
  error.message === 'Network Error' || error.code === 'ECONNABORTED';

/** Returns true when the error is an authentication/authorization error. */
export const isAuthError = (error) =>
  error.response?.status === 401 || error.response?.status === 403;

export default { parseApiError, handleError, withRetry, isNetworkError, isAuthError };
