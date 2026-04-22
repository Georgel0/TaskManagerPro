import sitemap from "./sitemap"

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
      sitemap: 'https://task-manager-pro-demo.vercel.app/sitemap.xml'
  };
}