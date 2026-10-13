'use client';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { defaultCatalogState, type CatalogState } from '@/lib/services';

const statuses=['REQUESTED','RECEIVED','DIAGNOSING','WAITING_APPROVAL','WAITING_PARTS','IN_PROGRESS','READY_FOR_PICKUP','COMPLETED','CANCELLED'];
const storageKey='fixform-catalog';

export default function AdminDashboard(){
  const [key,setKey]=useState('');
  const [rows,setRows]=useState<any[]>([]);
  const [error,setError]=useState('');
  const [loaded,setLoaded]=useState(false);
  const [catalog,setCatalog]=useState<CatalogState>(defaultCatalogState);
  const [serviceForm,setServiceForm]=useState({name:'',description:'',price:'',turnaround:'48 hours'});
  const [productForm,setProductForm]=useState({name:'',category:'Phone',condition:'Good',suggestedPrice:'',stock:'1'});

  useEffect(()=>{
    if(typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(storageKey);
    if(!saved) return;
    try {
      const parsed = JSON.parse(saved) as Partial<CatalogState>;
      if(parsed && Array.isArray(parsed.services) && Array.isArray(parsed.products)) {
        setCatalog({
          services: parsed.services.length ? parsed.services : defaultCatalogState.services,
          products: parsed.products.length ? parsed.products : defaultCatalogState.products,
          priceSettings: { ...defaultCatalogState.priceSettings, ...(parsed.priceSettings ?? {}) }
        });
      }
    } catch {
      // ignore invalid saved data
    }
  },[]);

  useEffect(()=>{
    if(typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(catalog));
    }
  },[catalog]);

  async function load(){
    setError('');
    try{
      const r=await fetch('/api/bookings',{headers:{'x-admin-key':key}});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error || 'Could not load bookings');
      setRows(d.bookings || []);
      setLoaded(true);
    }catch(e){
      setError(e instanceof Error ? e.message : 'Request failed');
    }
  }

  async function update(id:string,status:string){
    try{
      const r=await fetch('/api/bookings',{method:'PATCH',headers:{'Content-Type':'application/json','x-admin-key':key},body:JSON.stringify({id,status})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error || 'Update failed');
      setRows(rows.map(x=>x.id===id ? d.booking : x));
    }catch(e){
      setError(e instanceof Error ? e.message : 'Update failed');
    }
  }

  function addService(e: FormEvent<HTMLFormElement>){
    e.preventDefault();
    const parsedPrice = Number(serviceForm.price);
    if(!serviceForm.name.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Enter a valid service name and price.');
      return;
    }
    setCatalog(prev=>({
      ...prev,
      services:[{
        id:`service-${Date.now()}`,
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim() || 'Custom service',
        price: parsedPrice,
        turnaround: serviceForm.turnaround.trim() || '48 hours',
        popular: false
      }, ...prev.services]
    }));
    setServiceForm({name:'',description:'',price:'',turnaround:'48 hours'});
    setError('');
  }

  function addProduct(e: FormEvent<HTMLFormElement>){
    e.preventDefault();
    const parsedPrice = Number(productForm.suggestedPrice);
    const parsedStock = Number(productForm.stock);
    if(!productForm.name.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0 || Number.isNaN(parsedStock) || parsedStock < 0) {
      setError('Enter a valid product name, price and quantity.');
      return;
    }
    setCatalog(prev=>({
      ...prev,
      products:[{
        id:`product-${Date.now()}`,
        name: productForm.name.trim(),
        category: productForm.category,
        condition: productForm.condition,
        suggestedPrice: parsedPrice,
        stock: parsedStock,
        popular: false
      }, ...prev.products]
    }));
    setProductForm({name:'',category:'Phone',condition:'Good',suggestedPrice:'',stock:'1'});
    setError('');
  }

  const avgOffer = useMemo(()=>{
    if(!catalog.products.length) return 0;
    return Math.round(catalog.products.reduce((sum,p)=>sum+p.suggestedPrice,0)/catalog.products.length);
  },[catalog.products]);

  return <div className="admin-shell">
    <div className="admin-grid">
      <div className="stat-card"><div className="eyebrow">Overview</div><h3>{catalog.services.length}</h3><p>Services</p></div>
      <div className="stat-card"><div className="eyebrow">Inventory</div><h3>{catalog.products.length}</h3><p>Products</p></div>
      <div className="stat-card"><div className="eyebrow">Buyback</div><h3>฿{avgOffer.toLocaleString('en-US')}</h3><p>Avg. offer</p></div>
    </div>

    <div className="admin-split">
      <div className="panel">
        <div className="section-head">
          <div>
            <div className="eyebrow">Access</div>
            <h3>Admin login</h3>
          </div>
          <button className="btn dark" type="button" onClick={load}>Load bookings ↗</button>
        </div>
        <div className="field" style={{marginTop:16}}>
          <label>Admin API key</label>
          <input type="password" value={key} onChange={e=>setKey(e.target.value)} autoComplete="current-password" placeholder="Enter admin secret"/>
        </div>
        {error && <div className="error">{error}</div>}
      </div>

      <div className="panel">
        <div className="section-head">
          <div>
            <div className="eyebrow">Pricing</div>
            <h3>Price settings</h3>
          </div>
        </div>
        <div className="field-row" style={{marginTop:16}}>
          <div className="field">
            <label>Buyback factor</label>
            <input type="number" min="0" max="1" step="0.01" value={catalog.priceSettings.buybackFactor} onChange={e=>setCatalog(prev=>({...prev, priceSettings:{...prev.priceSettings, buybackFactor: Number(e.target.value)}}))} />
          </div>
          <div className="field">
            <label>Service markup</label>
            <input type="number" min="0" max="1" step="0.01" value={catalog.priceSettings.serviceMarkup} onChange={e=>setCatalog(prev=>({...prev, priceSettings:{...prev.priceSettings, serviceMarkup: Number(e.target.value)}}))} />
          </div>
        </div>
        <div className="field" style={{marginTop:16}}>
          <label>Floor offer</label>
          <input type="number" min="0" step="10" value={catalog.priceSettings.floorOffer} onChange={e=>setCatalog(prev=>({...prev, priceSettings:{...prev.priceSettings, floorOffer: Number(e.target.value)}}))} />
        </div>
      </div>
    </div>

    <div className="admin-split">
      <form className="panel" onSubmit={addService}>
        <div className="eyebrow">Catalog</div>
        <h3>Add service</h3>
        <div className="field" style={{marginTop:12}}>
          <label>Service name</label>
          <input value={serviceForm.name} onChange={e=>setServiceForm({...serviceForm, name:e.target.value})} placeholder="Camera repair" />
        </div>
        <div className="field">
          <label>Description</label>
          <input value={serviceForm.description} onChange={e=>setServiceForm({...serviceForm, description:e.target.value})} placeholder="Speaker and mic troubleshooting" />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Price</label>
            <input type="number" value={serviceForm.price} onChange={e=>setServiceForm({...serviceForm, price:e.target.value})} placeholder="850" />
          </div>
          <div className="field">
            <label>Turnaround</label>
            <input value={serviceForm.turnaround} onChange={e=>setServiceForm({...serviceForm, turnaround:e.target.value})} placeholder="48 hours" />
          </div>
        </div>
        <button type="submit" className="btn dark" style={{marginTop:16}}>Add service</button>
      </form>

      <form className="panel" onSubmit={addProduct}>
        <div className="eyebrow">Inventory</div>
        <h3>Add product</h3>
        <div className="field" style={{marginTop:12}}>
          <label>Product name</label>
          <input value={productForm.name} onChange={e=>setProductForm({...productForm, name:e.target.value})} placeholder="iPhone 14 Pro" />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Category</label>
            <input value={productForm.category} onChange={e=>setProductForm({...productForm, category:e.target.value})} placeholder="Apple" />
          </div>
          <div className="field">
            <label>Condition</label>
            <select value={productForm.condition} onChange={e=>setProductForm({...productForm, condition:e.target.value})}>
              <option value="Excellent">Excellent</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Broken">Broken</option>
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Suggested price</label>
            <input type="number" value={productForm.suggestedPrice} onChange={e=>setProductForm({...productForm, suggestedPrice:e.target.value})} placeholder="14900" />
          </div>
          <div className="field">
            <label>Stock</label>
            <input type="number" min="0" value={productForm.stock} onChange={e=>setProductForm({...productForm, stock:e.target.value})} placeholder="1" />
          </div>
        </div>
        <button type="submit" className="btn dark" style={{marginTop:16}}>Add product</button>
      </form>
    </div>

    <div className="admin-split">
      <div className="panel">
        <div className="eyebrow">Catalog</div>
        <h3>Services</h3>
        <div className="catalog-list">
          {catalog.services.map(service => (
            <div className="catalog-item" key={service.id}>
              <div>
                <strong>{service.name}</strong>
                <p>{service.description}</p>
                <span>฿{service.price.toLocaleString('en-US')} · {service.turnaround}</span>
              </div>
              <button type="button" className="chip danger" onClick={()=>setCatalog(prev=>({...prev, services: prev.services.filter(item=>item.id!==service.id)}))}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="eyebrow">Inventory</div>
        <h3>Products</h3>
        <div className="catalog-list">
          {catalog.products.map(product => (
            <div className="catalog-item" key={product.id}>
              <div>
                <strong>{product.name}</strong>
                <p>{product.category} · {product.condition}</p>
                <span>฿{product.suggestedPrice.toLocaleString('en-US')} · stock {product.stock}</span>
              </div>
              <button type="button" className="chip danger" onClick={()=>setCatalog(prev=>({...prev, products: prev.products.filter(item=>item.id!==product.id)}))}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="panel">
      <div className="section-head">
        <div>
          <div className="eyebrow">Orders</div>
          <h3>Bookings dashboard</h3>
        </div>
      </div>
      {loaded ? (
        <div className="table-wrap">
          <table className="admin-table">
            <thead><tr><th>Reference</th><th>Customer</th><th>Device / issue</th><th>Received</th><th>Status</th></tr></thead>
            <tbody>{rows.map(b=><tr key={b.id}><td><strong>{b.reference}</strong><br/>{b.phone}</td><td>{b.customerName}<br/>{b.email || ''}</td><td>{b.device}<br/>{b.issue}</td><td>{new Date(b.createdAt).toLocaleDateString()}</td><td><select aria-label={`Status for ${b.reference}`} value={b.status} onChange={e=>update(b.id,e.target.value)}>{statuses.map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></td></tr>)}</tbody>
          </table>
          {rows.length===0 && <div className="empty">No bookings yet.</div>}
        </div>
      ) : <div className="empty">Enter the admin key and load recent bookings.</div>}
    </div>
  </div>;
}
