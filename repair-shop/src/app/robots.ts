import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{return {rules:[{userAgent:'*',allow:'/',disallow:['/api/','/*/admin']}],sitemap:`${(process.env.NEXT_PUBLIC_SITE_URL||'https://example.com').replace(/\/$/,'')}/sitemap.xml`};}
