import dotenv from 'dotenv';
dotenv.config();

const heygenKey = process.env.HEYGEN_API_KEY;

console.log('Testing HeyGen Key:', heygenKey ? heygenKey.slice(0, 15) + '...' : 'MISSING');

async function testHeyGen() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    console.log('\n--- 1. Testing HeyGen API v2 Avatars ---');
    const res1 = await fetch('https://api.heygen.com/v2/avatars', {
      headers: {
        'x-api-key': heygenKey,
        'accept': 'application/json',
      },
      signal: controller.signal
    });
    const text1 = await res1.text();
    console.log(`Status ${res1.status}: ${text1.slice(0, 300)}`);
  } catch (e) {
    console.error('Test 1 Error:', e.message);
  } finally {
    clearTimeout(timeoutId);
  }
}

testHeyGen();
