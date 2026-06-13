export function saveStars(gameId, stars) {
  localStorage.setItem('stars-' + gameId, String(Math.max(0, Math.min(3, stars))));
}

export function getStars(gameId) {
  return parseInt(localStorage.getItem('stars-' + gameId) || '0', 10);
}

// Borra las estrellas de los juegos indicados (por id).
export function clearStars(gameIds) {
  gameIds.forEach(id => localStorage.removeItem('stars-' + id));
}

// Borra las estrellas de TODOS los juegos del sitio.
export function clearAllStars() {
  Object.keys(localStorage)
    .filter(k => k.startsWith('stars-'))
    .forEach(k => localStorage.removeItem(k));
}
