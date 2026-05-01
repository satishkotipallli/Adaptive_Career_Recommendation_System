export const getRoleFromToken = (token) => {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload?.user?.role || null;
  } catch (error) {
    console.error('Invalid token');
    return null;
  }
};

