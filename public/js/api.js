// Relative URL allows seamless transition between Localhost and Cloud hosting
const API_BASE = '/api';

async function apiRequest(endpoint, method = 'GET', data = null, isMultipart = false) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let options = { method, headers };

  if (data) {
    if (isMultipart) {
      options.body = data; // FormData handles its own boundary headers
    } else {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'API request failed');
    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}