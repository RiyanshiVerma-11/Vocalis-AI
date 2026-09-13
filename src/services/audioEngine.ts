// ============================================================
// Audio Engine Proxy — Unified with AgoraVoiceEngine
// Guarantees zero conflicting AudioContexts and zero microphone contention
// ============================================================

import { agoraVoiceEngine, AgoraVoiceEngine } from './agoraVoiceEngine';

export const audioEngine = agoraVoiceEngine;
export { AgoraVoiceEngine as AudioEngine };
export default agoraVoiceEngine;
