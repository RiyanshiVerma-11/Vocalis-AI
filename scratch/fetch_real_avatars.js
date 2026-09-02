import dotenv from 'dotenv';
dotenv.config();

const heygenKey = process.env.HEYGEN_API_KEY;

async function getAvatars() {
  try {
    const res = await fetch('https://api.heygen.com/v2/avatars', {
      headers: { 'x-api-key': heygenKey }
    });
    const data = await res.json();
    if (data.data && data.data.avatars) {
      console.log('Total HeyGen Avatars:', data.data.avatars.length);
      const list = data.data.avatars.slice(0, 10).map(a => ({
        id: a.avatar_id,
        name: a.avatar_name,
        gender: a.gender,
        preview: a.preview_image_url
      }));
      console.log('Sample Avatars:', JSON.stringify(list, null, 2));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

getAvatars();
