// polling.js
export function startPolling(callback, interval = 5000) {
  let timer = setInterval(callback, interval);
  return () => clearInterval(timer);
}
