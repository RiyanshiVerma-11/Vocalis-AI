import dotenv from 'dotenv';
dotenv.config();

const liveAvatarKey = process.env.LIVE_AVATAR_API_KEY;

async function findAllSandboxAvatars() {
  const res = await fetch('https://api.liveavatar.com/v1/avatars/public?limit=100', {
    headers: { 'X-API-KEY': liveAvatarKey }
  });
  const data = await res.json();
  const avatars = data.data?.results || [];

  console.log(`Checking ${avatars.length} public avatars for sandbox compatibility...\n`);

  for (const av of avatars) {
    try {
      const tokenRes = await fetch('https://api.liveavatar.com/v1/sessions/token', {
        method: 'POST',
        headers: { 'X-API-KEY': liveAvatarKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'LITE', avatar_id: av.id, is_sandbox: true })
      });
      if (tokenRes.ok) {
        console.log(`✅ Sandbox Compatible: "${av.name}" (ID: ${av.id}, Gender/Type: ${av.gender || 'N/A'}, Preview: ${av.preview_image_url || av.image_url || 'N/A'})`);
      }
    } catch (_) {}
  }
}

findAllSandboxAvatars();
