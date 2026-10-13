import type {Metadata} from 'next';
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import '../globals.css';
export const metadata:Metadata={title:{default:'FIXFORM. | Mobile Repair',template:'%s | FIXFORM.'},description:'Expert mobile repairs, clear estimates, and convenient repair tracking.'};
const rtlLocales=['ar','he','fa','ur'];
export function generateStaticParams(){return routing.locales.map(locale=>({locale}));}
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const {locale}=await params;if(!hasLocale(routing.locales,locale))notFound();const messages=await getMessages();return <html lang={locale} dir={rtlLocales.includes(locale)?'rtl':'ltr'}><body className={rtlLocales.includes(locale)?'rtl':''}><NextIntlClientProvider messages={messages}><SiteHeader/><main>{children}</main><SiteFooter/></NextIntlClientProvider></body></html>;}
