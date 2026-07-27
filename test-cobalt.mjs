async function test() {
    const res = await fetch('https://api.cobalt.tools/', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        body: JSON.stringify({
            url: 'https://www.youtube.com/watch?v=0VBIICYDjPo',
            audioFormat: 'best',
            isAudioOnly: true
        })
    });
    console.log(res.status);
    console.log(await res.text());
}
test();
