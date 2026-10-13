import {defineRouting} from 'next-intl/routing';
export const routing = defineRouting({
  // Expand this list as reviewed translations are added. Do not advertise a locale
  // until its fallback and content behavior have been tested.
  locales: ['en', 'th', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'ar', 'hi', 'pt', 'it', 'ru', 'vi', 'id', 'ms', 'he', 'fa', 'ur'],
  defaultLocale: 'en',
  localePrefix: 'always',
  localeDetection: true
});
