async function testAgora() {
  try {
    const res = await fetch('http://localhost:3000/api/agora/start-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelName: 'test-room-101',
        uid: 1,
        interviewerName: 'Rohan Sharma'
      })
    });
    const data = await res.json();
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testAgora();
