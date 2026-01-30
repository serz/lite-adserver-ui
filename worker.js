/**
 * Cloudflare Worker for serving the Lite Adserver UI
 * Migrated from Cloudflare Pages to Workers with Static Assets
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle static assets first
    try {
      // Try to serve the static asset
      const asset = await env.ASSETS.fetch(request);
      
      // If asset exists, return it
      if (asset && asset.status !== 404) {
        // For HTML files, inject environment variables
        const contentType = asset.headers.get('content-type');
        const isHtml = contentType?.includes('text/html') || url.pathname.endsWith('.html') || url.pathname === '/';
        
        if (isHtml) {
          console.log(`Processing HTML file: ${url.pathname}, content-type: ${contentType}`);
          let html = await asset.text();
          
          // Inject environment variables into the HTML
          const envScript = `
            <script>
              window.__CLOUDFLARE_ENV__ = {
                NEXT_PUBLIC_AD_SERVER_URL: "${env.NEXT_PUBLIC_AD_SERVER_URL || 'https://api.liteadserver.example.com'}",
                NEXT_PUBLIC_TIMEZONE: "${env.NEXT_PUBLIC_TIMEZONE || 'UTC'}"
              };
              console.log('Environment variables injected:', window.__CLOUDFLARE_ENV__);
            </script>
          `;
          
          // Insert the script before the closing head tag or at the beginning of body
          if (html.includes('</head>')) {
            html = html.replace('</head>', `${envScript}</head>`);
          } else {
            // For minified HTML, insert after the head section
            html = html.replace('<body', `${envScript}<body`);
          }
          
          return new Response(html, {
            status: asset.status,
            headers: {
              ...Object.fromEntries(asset.headers),
              'Content-Type': 'text/html'
            }
          });
        }
        
        return asset;
      }
    } catch (error) {
      console.error('Error fetching static asset:', error);
    }

    // Handle SPA routing for Next.js app
    // For any non-asset request, serve the index.html to enable client-side routing
    if (url.pathname.startsWith('/dashboard') || 
        url.pathname.startsWith('/login') || 
        url.pathname === '/' ||
        !url.pathname.includes('.')) {
      
      try {
        // Serve index.html for SPA routes
        const indexRequest = new Request(new URL('/', request.url), request);
        const indexAsset = await env.ASSETS.fetch(indexRequest);
        
        if (indexAsset && indexAsset.status === 200) {
          let html = await indexAsset.text();
          
          // Inject environment variables into the HTML
          const envScript = `
            <script>
              window.__CLOUDFLARE_ENV__ = {
                NEXT_PUBLIC_AD_SERVER_URL: "${env.NEXT_PUBLIC_AD_SERVER_URL || 'https://api.liteadserver.example.com'}",
                NEXT_PUBLIC_TIMEZONE: "${env.NEXT_PUBLIC_TIMEZONE || 'UTC'}"
              };
            </script>
          `;
          
          // Insert the script before the closing head tag or at the beginning of body
          if (html.includes('</head>')) {
            html = html.replace('</head>', `${envScript}</head>`);
          } else {
            // For minified HTML, insert after the head section
            html = html.replace('<body', `${envScript}<body`);
          }
          
          return new Response(html, {
            status: 200,
            headers: {
              ...Object.fromEntries(indexAsset.headers),
              'Content-Type': 'text/html',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
        }
      } catch (error) {
        console.error('Error serving SPA route:', error);
      }
    }

    // If nothing matches, return 404
    return new Response('Not Found', { 
      status: 404,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
};
