import type {MetadataRoute} from 'next';
import {routing} from '@/i18n/routing';
const base=(process.env.NEXT_PUBLIC_SITE_URL||'https://example.com').replace(/\/$/,'');
export default function sitemap():MetadataRoute.Sitemap{
  const paths=['','/services','/booking','/track-repair'];
  return paths.flatMap(path=>routing.locales.map(locale=>({url:`${base}/${locale}${path}`,lastModified:new Date(),alternates:{languages:Object.fromEntries(routing.locales.map(l=>[l,`${base}/${l}${path}`]))}})));
}
