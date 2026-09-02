import dotenv from 'dotenv';
dotenv.config();
import { AgoraClient, Agent, Area, DeepgramSTT, OpenAI, MiniMaxTTS } from 'agora-agents';

async function testSDK() {
  try {
    const client = new AgoraClient({
      appId: process.env.AGORA_APP_ID,
      appCertificate: process.env.AGORA_APP_CERTIFICATE,
      customerKey: process.env.AGORA_CUSTOMER_KEY,
      customerSecret: process.env.AGORA_CUSTOMER_SECRET,
      area: Area.US,
    });

    const agent = new Agent({ client })
      .withStt(new DeepgramSTT({ model: 'nova-3', language: 'en-US' }))
      .withLlm(new OpenAI({
        model: 'gpt-4o-mini',
        systemMessages: [{ role: 'system', content: 'You are an interviewer.' }],
        greetingMessage: 'Hello!',
      }))
      .withTts(new MiniMaxTTS({
        model: 'speech-2.6-turbo',
        voiceId: 'English_captivating_female1',
      }));

    const session = agent.createSession({
      channel: `test-${Date.now()}`,
      agentUid: '1',
      remoteUids: ['0'],
      name: `test-session-${Date.now()}`,
      idleTimeout: 60,
    });

    console.log('Attempting session.start()...');
    const agentId = await session.start();
    console.log('Success! Agent ID:', agentId);
  } catch (err) {
    console.error('SDK test failed with error:');
    console.error(err);
  }
}

testSDK();
