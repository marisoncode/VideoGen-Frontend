// Intelligent API URL resolver
// On Vercel / production, it automatically targets your live Render backend
const isProduction = typeof window !== 'undefined' && (
  window.location.hostname.includes('vercel.app') ||
  window.location.hostname.includes('render.com') ||
  import.meta.env.PROD
);

export const API_BASE = (
  import.meta.env.VITE_API_URL ||
  (isProduction ? 'https://videogen-backend-ajn7.onrender.com' : '')
).replace(/\/+$/, '');

export function apiUrl(endpoint) {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://') || endpoint.startsWith('data:')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE}${cleanEndpoint}`;
}
