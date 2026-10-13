'use client';
import {useEffect, useState, Suspense} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useSearchParams} from 'next/navigation';

type RepairPrice = {id: string; serviceId: string; serviceKey: string; serviceName: string; serviceDescription: string; termsAndConditions: string; model: string; quality: string; price: number; currency: string};

function FormInner() {
  const t = useTranslations('Booking');
  const locale = useLocale();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState('');
  const [prices, setPrices] = useState<RepairPrice[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('');
  const [result, setResult] = useState<{reference: string; status: string; quotedPrice: number; currency: string} | null>(null);
  const requestedService = params.get('service') || '';
  const services = [...new Map(prices.map(item => [item.serviceId, {id:item.serviceId,key:item.serviceKey,name:item.serviceName,description:item.serviceDescription,termsAndConditions:item.termsAndConditions}])).values()];
  const selectedService = services.find(item => item.id === selectedServiceId);
  const servicePrices = prices.filter(item => item.serviceId === selectedServiceId);
  const models = [...new Set(servicePrices.map(item => item.model))];
  const modelPrices = servicePrices.filter(item => item.model === selectedModel);
  const selectedPrice = modelPrices.find(item => item.quality === selectedQuality);

  useEffect(() => {
    let mounted = true;
    fetch('/api/repair-prices')
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load repair prices.');
        return data.prices as RepairPrice[];
      })
      .then(items => {
        if (!mounted) return;
        setPrices(items);
        const requested = items.find(item => item.serviceKey === requestedService || item.serviceName.toLowerCase().includes(requestedService.toLowerCase()));
        const serviceId = requested?.serviceId || items[0]?.serviceId || '';
        const serviceOptions = items.filter(item => item.serviceId === serviceId);
        setSelectedServiceId(serviceId);
        setSelectedModel(serviceOptions[0]?.model || '');
        setSelectedQuality(serviceOptions[0]?.quality || '');
      })
      .catch(caught => setError(caught instanceof Error ? caught.message : 'Could not load repair prices.'))
      .finally(() => { if (mounted) setCatalogLoading(false); });
    return () => { mounted = false; };
  }, [requestedService]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedPrice) return;
    setError('');
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const body = Object.fromEntries(formData.entries());

    body.locale = locale;
    body.model = selectedModel;
    body.serviceId = selectedServiceId;
    body.quality = selectedQuality;

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('required'));
      setResult(data);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return <div className="form-wrap"><div className="notice"><h2>{t('success')}</h2><p>{t('successDesc')}</p><strong style={{fontSize: 24, letterSpacing: 1}}>{result.reference}</strong><p>Estimated price: {result.currency} {result.quotedPrice.toLocaleString(locale)}</p><p><a className="btn dark" href={`/${locale}/track-repair`}>Track repair ↗</a></p></div></div>;
  }

  return <form className="form-wrap" onSubmit={submit}>
    <div className="form-grid">
      <div className="field"><label>{t('name')} *</label><input name="customerName" autoComplete="name" required maxLength={100}/></div>
      <div className="field"><label>{t('phone')} *</label><input name="phone" autoComplete="tel" required maxLength={40}/></div>
      <div className="field"><label>{t('email')}</label><input name="email" type="email" autoComplete="email" maxLength={200}/></div>
      <div className="field"><label htmlFor="booking-service">Repair service *</label><select id="booking-service" value={selectedServiceId} required disabled={catalogLoading || services.length === 0} onChange={event => {const serviceId=event.target.value; const first=prices.find(item=>item.serviceId===serviceId); setSelectedServiceId(serviceId); setSelectedModel(first?.model||''); setSelectedQuality(first?.quality||'');}}><option value="" disabled>{catalogLoading ? 'Loading services…' : 'Choose a repair service'}</option>{services.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></div>
      {selectedService && <div className="field full"><strong>{selectedService.description}</strong>{selectedService.termsAndConditions && <div className="notice"><strong>Terms and conditions</strong><p>{selectedService.termsAndConditions}</p></div>}</div>}
      <div className="field"><label htmlFor="booking-model">Exact phone model *</label><select id="booking-model" name="model" value={selectedModel} required disabled={catalogLoading || models.length === 0} onChange={event => {const nextModel=event.target.value; const first=modelPrices.find(item=>item.model===nextModel) || servicePrices.find(item=>item.model===nextModel); setSelectedModel(nextModel); setSelectedQuality(first?.quality||'');}}><option value="" disabled>{catalogLoading ? 'Loading models…' : 'Choose your model'}</option>{models.map(item => <option value={item} key={item}>{item}</option>)}</select></div>
      <div className="field"><label htmlFor="booking-quality">Part quality / option *</label><select id="booking-quality" name="quality" value={selectedQuality} required disabled={catalogLoading || modelPrices.length === 0} onChange={event => setSelectedQuality(event.target.value)}><option value="" disabled>Choose quality</option>{modelPrices.map(item=><option value={item.quality} key={item.id}>{item.quality}</option>)}</select></div>
      <div className="field full"><label>Estimated repair price</label><strong>{selectedPrice ? `${selectedPrice.currency} ${selectedPrice.price.toLocaleString(locale)}` : catalogLoading ? 'Loading price…' : 'No price available for this selection'}</strong><span className="hint">Final price may change after device inspection.</span></div>
      <div className="field"><label>{t('date')}</label><input name="preferredDate" type="date" min={new Date().toISOString().slice(0, 10)}/></div>
      <div className="field full"><label>Additional problem details</label><textarea name="details" rows={3} maxLength={1300} placeholder="Add symptoms or damage details…"/></div>
      <div className="field full"><label>{t('notes')}</label><textarea name="notes" rows={2} maxLength={1500}/></div>
    </div>
    <p className="hint">{t('privacy')}</p>
    {error && <div className="error" role="alert">{error}</div>}
    <button className="btn dark" type="submit" disabled={loading || catalogLoading || !selectedPrice}>{loading ? 'Sending…' : t('submit')} ↗</button>
  </form>;
}

export default function BookingForm() {
  return <Suspense fallback={<div className="form-wrap">Loading…</div>}><FormInner /></Suspense>;
}
