const res = await fetch('http://localhost:3000/api/liveavatar/start-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ isSandbox: true })
});
const data = await res.text();
console.log('Status:', res.status);
console.log('Response:', data.slice(0, 800));
