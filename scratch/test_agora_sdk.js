import dotenv from 'dotenv';
dotenv.config();
import {
  AgoraClient,
  Agent,
  Area,
  DeepgramSTT,
  Groq,
  MiniMaxTTS,
} from 'agora-agents';

async function verifyAgoraConversationalAI() {
  console.log('=== VERIFYING AGORA CONVERSATIONAL AI ENGINE (Official SDK) ===');
  try {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    console.log('1. Initializing AgoraClient with Area.US...');
    const agoraClient = new AgoraClient({
      appId,
      appCertificate,
      area: Area.US,
    });

    console.log('2. Setting up Cloud ASR (Deepgram Nova-3)...');
    const stt = new DeepgramSTT({
      model: 'nova-3',
      language: 'en-US',
    });

    console.log('3. Setting up Cloud LLM (Groq Llama-3.3-70b-versatile)...');
    const llm = new Groq({
      apiKey: process.env.GROQ_API_KEY.trim(),
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile',
      systemMessages: [
        {
          role: 'system',
          content: 'You are Rohan Sharma, a Lead Systems Architect. Conduct an adaptive voice technical interview. Ask concise, probing questions (2 sentences max).',
        },
      ],
      greetingMessage: 'Hello! I am Rohan Sharma, Lead Systems Architect. Let us begin the technical interview.',
      failureMessage: 'I did not catch that clearly. Could you please repeat?',
      maxHistory: 20,
    });

    console.log('4. Setting up Cloud TTS (MiniMax speech-2.6-turbo)...');
    const tts = new MiniMaxTTS({
      model: 'speech-2.6-turbo',
      voiceId: 'English_captivating_female1',
    });

    console.log('5. Composing Conversational AI Agent...');
    const agent = new Agent({ client: agoraClient })
      .withStt(stt)
      .withLlm(llm)
      .withTts(tts);

    const channelName = `vocalis-verification-${Date.now()}`;
    const session = agent.createSession({
      channel: channelName,
      agentUid: '1',
      remoteUids: ['0'],
      name: `vocalis-agent-${Date.now()}`,
      idleTimeout: 30,
    });

    console.log(`6. Calling session.start() on Agora Cloud SDRTN for channel: ${channelName}...`);
    const agentId = await session.start();
    console.log('\n======================================================');
    console.log('  SUCCESS! AGORA CONVERSATIONAL AI AGENT IS RUNNING!  ');
    console.log('======================================================');
    console.log(`Agent ID: ${agentId}`);
    console.log(`Channel Name: ${channelName}`);
    console.log(`Pipeline: Deepgram Nova-3 (ASR) -> Groq Llama-3.3-70b (LLM) -> MiniMax (TTS)`);
    console.log(`RTC Transport: Agora Software-Defined Real-Time Network (SDRTN)`);
    console.log('======================================================\n');

    console.log('7. Calling agoraClient.stopAgent() to gracefully tear down...');
    await agoraClient.stopAgent(agentId);
    console.log('Agent stopped cleanly. Quota preserved.\n');
  } catch (err) {
    console.error('\nVerification failed:', err);
    process.exit(1);
  }
}

verifyAgoraConversationalAI();
