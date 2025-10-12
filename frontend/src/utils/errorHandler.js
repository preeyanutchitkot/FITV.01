// utils/errorHandler.js
export const formatError = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object') {
    // Handle FastAPI validation errors
    if (error.detail && Array.isArray(error.detail)) {
      return error.detail.map(err => `${err.loc?.join?.('.') || 'field'}: ${err.msg}`).join(', ');
    }
    
    // Handle single detail error
    if (error.detail) {
      return error.detail;
    }
    
    // Handle general error object
    if (error.message) {
      return error.message;
    }
    
    // Last resort - stringify the object
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error occurred';
    }
  }
  
  return 'Unknown error occurred';
};

export const handleApiError = async (response) => {
  let errorData;
  try {
    errorData = await response.json();
  } catch {
    errorData = { detail: `HTTP ${response.status}` };
  }
  
  throw new Error(formatError(errorData));
};