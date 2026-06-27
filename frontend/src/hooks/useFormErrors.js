import { useState } from 'react';

export const useFormErrors = () => {
  const [globalError, setGlobalError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleError = (error) => {
    // Check if it's a Zod validation error array sent from our validate middleware
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const newFieldErrors = {};
      error.response.data.errors.forEach(err => {
        newFieldErrors[err.path] = err.message;
      });
      setFieldErrors(newFieldErrors);
      setGlobalError('Please fix the highlighted errors below.');
    } else {
      // It's a generic error (e.g. duplicate email constraint, server crash)
      setGlobalError(error.response?.data?.message || error.message || 'An unexpected error occurred.');
      setFieldErrors({});
    }
  };

  const clearErrors = () => {
    setGlobalError(null);
    setFieldErrors({});
  };

  return { globalError, fieldErrors, handleError, clearErrors, setFieldErrors };
};
