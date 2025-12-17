import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    try {
        const reqUrl = new URL(request.url);
        const target = reqUrl.searchParams.get('url') || reqUrl.searchParams.get('target');

        if (!target) {
            return new Response('Missing `url` query parameter', { status: 400 });
        }

        let parsed: URL;
        try {
            parsed = new URL(target);
        } catch (err) {
            return new Response('Invalid URL', { status: 400 });
        }

        const allowlist = [
            'tiktok.com',
            'www.tiktok.com',
            'tiktokcdn.com',
            'youtube.com',
            'www.youtube.com',
            'youtu.be',
            'ytimg.com',
            'i.ytimg.com',
            'snapchat.com',
            'www.snapchat.com',
            'sc-cdn.net'
        ];

        const hostAllowed = allowlist.some((h) => parsed.hostname === h || parsed.hostname.endsWith('.' + h) || parsed.hostname.endsWith(h));
        if (!hostAllowed) {
            return new Response('Host not allowed', { status: 403 });
        }

        const res = await fetch(parsed.toString(), {
            method: 'GET',
            headers: {
                // minimal UA to improve chances of getting a normal response
                'User-Agent': 'astro-proxy/1.0 (+https://example.com)'
            }
        });

        const headers = new Headers(res.headers);
        // Allow cross-origin for browser consumption
        headers.set('access-control-allow-origin', '*');
        headers.set('access-control-allow-methods', 'GET,HEAD,OPTIONS');
        // Remove CSP or other headers that could break embedding
        headers.delete('content-security-policy');

        const body = await res.arrayBuffer();

        return new Response(body, {
            status: res.status,
            headers
        });
    } catch (err: any) {
        return new Response(String(err?.message || err), { status: 500 });
    }
};
