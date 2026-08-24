async function test() {
  const res = await fetch('http://localhost:5000/api/tutor/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseId: '64f7b2c9e4b0a1a2b3c4d5e6',
      lessonContent: 'Polymers are big molecules.',
      history: [],
      message: 'explain polymers'
    })
  });

  console.log('Status:', res.status);
  
  if (res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    while(true) {
        const { value, done } = await reader.read();
        if (done) break;
        console.log('CHUNK:', JSON.stringify(decoder.decode(value)));
    }
  }
}

test().catch(console.error);
