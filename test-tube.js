async function getYT() {
  const videoId = '0VBIICYDjPo';
  const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await watchRes.text();
  const keyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  const apiKey = keyMatch ? keyMatch[1] : '';

  const playerRes = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
    body: JSON.stringify({
      context: { client: { clientName: 'MWEB', clientVersion: '2.20231201.01.00' } },
      videoId
    })
  });
  const data = await playerRes.json();
  console.log('MWEB:', !!data.streamingData);
  
  const playerRes2 = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
    body: JSON.stringify({
      context: { client: { clientName: 'WEB_REMIX', clientVersion: '1.20231201.01.00' } },
      videoId
    })
  });
  const data2 = await playerRes2.json();
  console.log('WEB_REMIX:', !!data2.streamingData);

  const playerRes3 = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
    body: JSON.stringify({
      context: { client: { clientName: 'TVHTML5', clientVersion: '7.20240101.01.00' } },
      videoId
    })
  });
  const data3 = await playerRes3.json();
  console.log('TVHTML5:', !!data3.streamingData);
}
getYT();
