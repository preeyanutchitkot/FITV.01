// src/utils/jwtDecode.js
export function jwtDecode(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}