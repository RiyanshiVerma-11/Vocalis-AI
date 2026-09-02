import dotenv from 'dotenv';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { RtcTokenBuilder, RtcRole } = require('agora-token');

dotenv.config();

const appId = process.env.AGORA_APP_ID;
const appCertificate = process.env.AGORA_APP_CERTIFICATE;
const customerKey = process.env.AGORA_CUSTOMER_KEY;
const customerSecret = process.env.AGORA_CUSTOMER_SECRET;

const channelName = 'test-room-777';
const uid = 1;
const currentTimestamp = Math.floor(Date.now() / 1000);
const privilegeExpireTimestamp = currentTimestamp + 3600;

const agentToken = RtcTokenBuilder.buildTokenWithUid(
  appId,
  appCertificate,
  channelName,
  uid,
  RtcRole.PUBLISHER,
  privilegeExpireTimestamp,
  privilegeExpireTimestamp
);

const basicAuth = Buffer.from(`${customerKey}:${customerSecret}`).toString('base64');
const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/join`;

const payloadNoAvatar = {
  name: `agent-${Date.now()}`,
  properties: {
    channel: channelName,
    token: agentToken,
    agent_rtc_uid: String(uid),
    remote_rtc_uids: ['*'],
  },
  llm: { url: 'http://localhost:3000/api/agora/llm-webhook', api_key: 'vocalis-internal' },
  tts: { vendor: 'minimax' },
  asr: { vendor: 'deepgram', language: 'en-US' }
};

async function testNoAvatar() {
  try {
    console.log(`\nTesting ${url} without avatar...`);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`
      },
      body: JSON.stringify(payloadNoAvatar)
    });
    const text = await res.text();
    console.log(`Result HTTP ${res.status}: ${text}`);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testNoAvatar();
