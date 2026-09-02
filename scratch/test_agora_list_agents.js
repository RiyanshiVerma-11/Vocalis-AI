import dotenv from 'dotenv';
dotenv.config();

const appId = process.env.AGORA_APP_ID;
const customerKey = process.env.AGORA_CUSTOMER_KEY;
const customerSecret = process.env.AGORA_CUSTOMER_SECRET;
const credentials = Buffer.from(`${customerKey}:${customerSecret}`).toString('base64');

async function listAgents() {
  const urls = [
    `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/agents`,
    `https://api.agora.io/v1/projects/${appId}/fls/v1/agents`,
    `https://api.agora.io/api/conversational-ai/v1/projects/${appId}/agents`,
  ];

  for (const url of urls) {
    try {
      console.log(`Testing GET ${url}`);
      const res = await fetch(url, {
        headers: { Authorization: `Basic ${credentials}` }
      });
      const text = await res.text();
      console.log(`Status ${res.status}: ${text}`);
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}

listAgents();
