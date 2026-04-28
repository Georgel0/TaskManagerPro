export default function sitemap() {
  const baseUrl = 'https://task-manager-pro-demo.vercel.app';

  const routes = [
    '',
    '/dashboard',
    '/projects',
    '/tasks',
    '/profile',
    '/archive'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'monthly',
    riority: route === '/dashboard' ? 1 : 0.8,
  }));

  return routes;
}