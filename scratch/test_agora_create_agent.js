import dotenv from 'dotenv';
dotenv.config();

const appId = process.env.AGORA_APP_ID;
const customerKey = process.env.AGORA_CUSTOMER_KEY;
const customerSecret = process.env.AGORA_CUSTOMER_SECRET;
const credentials = Buffer.from(`${customerKey}:${customerSecret}`).toString('base64');

async function createAgentInConsole() {
  const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/agents`;
  const body = {
    name: 'Vocalis-Live-Agent',
    preset_type: 'custom',
    properties: {
      idle_timeout: 120,
    }
  };

  try {
    console.log('Posting to:', url);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`
      },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    console.log(`Status ${res.status}: ${text}`);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

createAgentInConsole();
