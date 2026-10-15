import { handler } from '../server/index.mjs';

export default async function vercelHandler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const route = url.searchParams.get('route');

  // Restore the API path forwarded by vercel.json.
  if (route !== null) {
    url.searchParams.delete('route');

    const path = route.replace(/^\/+/, '');
    const query = url.searchParams.toString();

    req.url = `/api/${path}${query ? `?${query}` : ''}`;
  }

  return handler(req, res);
}