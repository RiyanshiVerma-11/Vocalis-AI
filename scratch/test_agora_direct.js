import dotenv from 'dotenv';
dotenv.config();

const appId = process.env.AGORA_APP_ID;
const customerKey = process.env.AGORA_CUSTOMER_KEY;
const customerSecret = process.env.AGORA_CUSTOMER_SECRET;
const heygenKey = process.env.HEYGEN_API_KEY;

const credentials = Buffer.from(`${customerKey}:${customerSecret}`).toString('base64');
const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/join`;

const payload = {
  name: `agent-${Date.now()}`,
  properties: {
    channel: 'test-room-999',
    token: 'dummy-token',
    agent_rtc_uid: '1',
    remote_rtc_uids: ['*'],
  },
  avatar: {
    enable: true,
    vendor: 'heygen',
    params: {
      api_key: heygenKey || '',
      avatar_id: 'Aditya_public_1',
      quality: 'medium'
    }
  },
  llm: { url: 'http://localhost:3000/api/agora/llm-webhook', api_key: 'vocalis-internal' },
  tts: { vendor: 'minimax' },
  asr: { vendor: 'deepgram', language: 'en-US' }
};

async function testWithRealAvatarId() {
  try {
    console.log(`\nTesting ${url} with real HeyGen avatar_id "Aditya_public_1"...`);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log(`Result HTTP ${res.status}: ${text}`);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testWithRealAvatarId();
