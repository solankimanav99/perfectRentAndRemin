const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const getAuthToken = () => localStorage.getItem('pr_jwt_token');

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('pr_jwt_token', token);
  } else {
    localStorage.removeItem('pr_jwt_token');
  }
};

/**
 * Resolves full URL for clothing and category images.
 * Respects relative paths returned by backend.
 */
export const resolveImageUrl = (path) => {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }
  if (path.startsWith('/assets/')) {
    return path;
  }
  const baseHost = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${baseHost}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getAuthToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : {};
    }

    if (!response.ok || data.success === false) {
      if (response.status === 401) {
        setAuthToken(null);
      }
      const message =
        (data.error && data.error.message) ||
        data.message ||
        `Request failed with status ${response.status}`;
      const err = new Error(message);
      err.code = (data.error && data.error.code) || 'API_ERROR';
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const netErr = new Error('Backend server is offline or unreachable at ' + API_BASE_URL);
      netErr.code = 'NETWORK_ERROR';
      netErr.status = 0;
      throw netErr;
    }
    throw error;
  }
};
