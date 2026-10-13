import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
export default function SiteFooter(){const t=useTranslations('Home');const n=useTranslations('Navigation');return <footer className="container"><div className="footer"><Link href="/" className="brand"><span className="brandmark">⌁</span>FIXFORM.</Link><span>{t('footer')}</span><span><Link href="/services">{n('services')}</Link> · <Link href="/booking">{n('book')}</Link></span></div></footer>}
