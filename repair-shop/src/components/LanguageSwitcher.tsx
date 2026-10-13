'use client';
import {useLocale, useTranslations} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/navigation';
import {useTransition} from 'react';

const labels: Record<string,string> = {en:'English',th:'ไทย',zh:'中文',ja:'日本語',ko:'한국어',es:'Español',fr:'Français',de:'Deutsch',ar:'العربية',hi:'हिन्दी',pt:'Português',it:'Italiano',ru:'Русский',vi:'Tiếng Việt',id:'Bahasa Indonesia',ms:'Bahasa Melayu',he:'עברית',fa:'فارسی',ur:'اردو'};
export default function LanguageSwitcher(){
  const locale=useLocale(); const router=useRouter(); const pathname=usePathname(); const [pending,startTransition]=useTransition(); const t=useTranslations('Common');
  return <label className="sr-only-wrap"><span className="sr-only">{t('language')}</span><select className="lang" aria-label={t('language')} value={locale} disabled={pending} onChange={e=>{const next=e.target.value; document.cookie=`preferred-locale=${next}; path=/; max-age=31536000; samesite=lax`; startTransition(()=>router.replace(pathname,{locale:next}));}}>{Object.entries(labels).map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></label>;
}
