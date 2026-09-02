import dotenv from 'dotenv';
dotenv.config();

const heygenKey = process.env.HEYGEN_API_KEY;

async function testLiveAvatarGet() {
  try {
    console.log('Testing GET https://api.liveavatar.com/v1/sessions');
    const res = await fetch('https://api.liveavatar.com/v1/sessions', {
      method: 'GET',
      headers: {
        'X-API-KEY': heygenKey,
        'Accept': 'application/json'
      }
    });
    const text = await res.text();
    console.log(`Status ${res.status}: ${text}`);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testLiveAvatarGet();
