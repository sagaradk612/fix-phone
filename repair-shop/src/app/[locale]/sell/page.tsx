'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { defaultCatalogState, type CatalogState } from '@/lib/services';

const storageKey = 'fixform-catalog';
const conditionFactor: Record<string, number> = {
  Excellent: 1.16,
  'Very Good': 1,
  Good: 0.88,
  Fair: 0.7,
  Broken: 0.42,
};
const deviceFactor: Record<string, number> = {
  '64GB': 0.82,
  '128GB': 1,
  '256GB': 1.12,
  '512GB': 1.22,
  '1TB': 1.34,
};

export default function SellPage(){
  const [catalog, setCatalog] = useState<CatalogState>(defaultCatalogState);
  const [brand, setBrand] = useState('Apple');
  const [model, setModel] = useState('iPhone 13');
  const [condition, setCondition] = useState('Good');
  const [storage, setStorage] = useState('128GB');

  useEffect(() => {
    if(typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(storageKey);
    if(!saved) return;
    try {
      const parsed = JSON.parse(saved) as Partial<CatalogState>;
      if(parsed && Array.isArray(parsed.products)) {
        setCatalog({
          services: Array.isArray(parsed.services) ? parsed.services : defaultCatalogState.services,
          products: parsed.products.length ? parsed.products : defaultCatalogState.products,
          priceSettings: { ...defaultCatalogState.priceSettings, ...(parsed.priceSettings ?? {}) }
        });
      }
    } catch {
      // ignore invalid saved data
    }
  }, []);

  const productList = useMemo(() => {
    const matches = catalog.products.filter(product => {
      const productText = `${product.category} ${product.name}`.toLowerCase();
      return productText.includes(brand.toLowerCase());
    });
    return matches.length ? matches : catalog.products;
  }, [brand, catalog.products]);

  const selectedProduct = useMemo(() => {
    return productList.find(product => product.name.toLowerCase() === model.toLowerCase())
      || productList[0]
      || catalog.products[0];
  }, [productList, model, catalog.products]);

  const offer = useMemo(() => {
    const base = selectedProduct?.suggestedPrice ?? 1800;
    const adjusted = Math.round(
      base * (conditionFactor[condition] ?? 1) * (deviceFactor[storage] ?? 1) * (1 - catalog.priceSettings.buybackFactor)
    );
    return Math.max(catalog.priceSettings.floorOffer, adjusted);
  }, [selectedProduct, condition, storage, catalog.priceSettings]);

  return <section className="container section">
    <div className="page-intro">
      <div className="eyebrow">SELL YOUR PHONE</div>
      <h1>Get a fast quote for your used mobile.</h1>
      <p>Check your device value, compare second-hand pricing, and book a same-day trade-in or upgrade option without the hassle.</p>
    </div>

    <div className="sell-layout">
      <div className="panel">
        <div className="eyebrow">Quick valuation</div>
        <h3 style={{ marginTop: 12 }}>Tell us about your device</h3>

        <div className="field-row" style={{ marginTop: 18 }}>
          <div className="field">
            <label>Brand</label>
            <select value={brand} onChange={e => setBrand(e.target.value)}>
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
              <option value="Google">Google</option>
              <option value="OnePlus">OnePlus</option>
              <option value="Xiaomi">Xiaomi</option>
            </select>
          </div>

          <div className="field">
            <label>Model</label>
            <select value={model} onChange={e => setModel(e.target.value)}>
              {productList.map(product => (
                <option key={product.id} value={product.name}>{product.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field-row" style={{ marginTop: 18 }}>
          <div className="field">
            <label>Condition</label>
            <select value={condition} onChange={e => setCondition(e.target.value)}>
              <option value="Excellent">Excellent</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Broken">Broken</option>
            </select>
          </div>

          <div className="field">
            <label>Storage</label>
            <select value={storage} onChange={e => setStorage(e.target.value)}>
              <option value="64GB">64GB</option>
              <option value="128GB">128GB</option>
              <option value="256GB">256GB</option>
              <option value="512GB">512GB</option>
              <option value="1TB">1TB</option>
            </select>
          </div>
        </div>

        <div className="pill-row" style={{ marginTop: 22 }}>
          {catalog.products.slice(0, 4).map(product => (
            <span key={product.id} className="pill">{product.name}</span>
          ))}
        </div>
      </div>

      <aside className="panel price-box">
        <div className="eyebrow">Live offer</div>
        <h3>Estimated buyback value</h3>
        <div className="price-number">฿{offer.toLocaleString('en-US')}</div>
        <ul className="price-list">
          <li>{selectedProduct?.name || 'Selected device'} stock: {selectedProduct?.stock ?? 0}</li>
          <li>Condition: {condition}</li>
          <li>Storage: {storage}</li>
          <li>Instant trade-in available</li>
        </ul>
        <Link href="/booking" className="btn dark">Book a sell-back</Link>
      </aside>
    </div>

    <div className="section-head" style={{ marginTop: 32 }}>
      <div>
        <div className="eyebrow">Top buys</div>
        <h2>Popular second-hand devices</h2>
      </div>
    </div>

    <div className="service-grid">
      {catalog.products.map(product => (
        <article className="service-card" key={product.id}>
          <div className="service-icon">📱</div>
          <h3>{product.name}</h3>
          <p>{product.category} · {product.condition}</p>
          <div className="service-bottom">
            <span className="price">฿{product.suggestedPrice.toLocaleString('en-US')}</span>
            <button
              type="button"
              className="btn light"
              onClick={() => {
                setBrand(product.category);
                setModel(product.name);
              }}
            >
              Select
            </button>
          </div>
        </article>
      ))}
    </div>
  </section>;
}
