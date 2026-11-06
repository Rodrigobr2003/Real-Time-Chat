export const usernameFromEmail = (email: string) => {
  const base = email
    .split("@")[0]
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 24);

  return base.length >= 3 ? base : `user${base}`;
};
