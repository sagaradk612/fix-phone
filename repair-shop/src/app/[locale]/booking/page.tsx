import {useTranslations} from 'next-intl';import BookingForm from './form';import type {Metadata} from 'next';
export const metadata:Metadata={title:'Book a Repair',description:'Request a mobile repair appointment and receive a repair reference.'};
export default function BookingPage(){const t=useTranslations('Booking');return <section className="container"><div className="page-intro"><div className="eyebrow">LET’S GET IT FIXED</div><h1>{t('title')}</h1><p>{t('subtitle')}</p></div><BookingForm/></section>}
