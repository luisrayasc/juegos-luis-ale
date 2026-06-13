export function saveStars(gameId, stars) {
  localStorage.setItem('stars-' + gameId, String(Math.max(0, Math.min(3, stars))));
}

export function getStars(gameId) {
  return parseInt(localStorage.getItem('stars-' + gameId) || '0', 10);
}
