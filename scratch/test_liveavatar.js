import dotenv from 'dotenv';
dotenv.config();

const liveAvatarKey = process.env.LIVE_AVATAR_API_KEY;

async function findSandboxAvatar() {
  console.log('Fetching all public avatars to find sandbox-compatible ones...\n');

  const res = await fetch('https://api.liveavatar.com/v1/avatars/public?limit=100', {
    headers: { 'X-API-KEY': liveAvatarKey }
  });
  const data = await res.json();
  const avatars = data.data?.results || [];
  console.log(`Total public avatars: ${avatars.length}`);

  // Try each avatar until we find one that works in sandbox
  for (const avatar of avatars) {
    try {
      const tokenRes = await fetch('https://api.liveavatar.com/v1/sessions/token', {
        method: 'POST',
        headers: {
          'X-API-KEY': liveAvatarKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'LITE',
          avatar_id: avatar.id,
          is_sandbox: true
        })
      });

      const tokenData = await tokenRes.json();
      if (tokenRes.status === 200) {
        console.log(`\n✅ SANDBOX COMPATIBLE: "${avatar.name}" (${avatar.id})`);
        console.log('Session token response:', JSON.stringify(tokenData, null, 2));
        return;
      } else {
        console.log(`❌ ${avatar.name}: ${tokenData.message || tokenData.data?.[0]?.message}`);
      }
    } catch (e) {
      console.log(`❌ ${avatar.name}: ${e.message}`);
    }
  }

  console.log('\nNo sandbox-compatible avatar found. Trying without sandbox flag...');
  // Try without sandbox
  const tokenRes = await fetch('https://api.liveavatar.com/v1/sessions/token', {
    method: 'POST',
    headers: {
      'X-API-KEY': liveAvatarKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mode: 'LITE',
      avatar_id: avatars[0]?.id,
      is_sandbox: false
    })
  });
  const tokenData = await tokenRes.json();
  console.log(`Without sandbox, Status ${tokenRes.status}:`, JSON.stringify(tokenData, null, 2));
}

findSandboxAvatar();
