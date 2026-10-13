import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';
export default function SiteHeader(){const t=useTranslations('Navigation');return <header className="container"><div className="topbar"><Link href="/" className="brand"><span className="brandmark">⌁</span><span>FIXFORM<span style={{color:'#799b39'}}>.</span></span></Link><nav className="nav"><Link href="/services">{t('services')}</Link><Link href="/sell">Shop phones</Link><Link href="/booking">{t('book')}</Link><Link href="/track-repair">{t('track')}</Link></nav><div className="navright"><LanguageSwitcher/><Link className="btn" href="/booking">{t('book')} ↗</Link></div></div></header>}
