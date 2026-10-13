import {useTranslations} from 'next-intl';import TrackForm from './form';import type {Metadata} from 'next';
export const metadata:Metadata={title:'Track Repair',description:'Securely check the current status of your mobile phone repair.'};
export default function TrackPage(){const t=useTranslations('Track');return <section className="container"><div className="page-intro"><div className="eyebrow">REPAIR STATUS</div><h1>{t('title')}</h1><p>{t('subtitle')}</p></div><TrackForm/></section>}
