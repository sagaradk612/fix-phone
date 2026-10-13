'use client';

import {useEffect, useState, type FormEvent} from 'react';
import type {StaffRole} from '@prisma/client';
import styles from './dashboard.module.css';

type Product = {id: string; name: string; brand: string; model: string; storage: string; condition: string; description: string; imageUrl: string | null; price: number; stock: number; active: boolean};
type Order = {id: string; reference: string; customerName: string; email: string; phone: string; shippingAddress: string; status: string; total: number; createdAt: string; items: Array<{productName: string; quantity: number; unitPrice: number}>};
type Booking = {id: string; reference: string; customerName: string; phone: string; email: string | null; device: string; issue: string; status: string; quotedPrice: number | null; currency: string; createdAt: string};
type ServiceItem = {id: string; key: string; name: string; icon: string; description: string; termsAndConditions: string; price: number; turnaround: string; active: boolean; translationKey: string | null};
type RepairPriceItem = {id: string; serviceId: string; serviceName: string; serviceKey: string; model: string; quality: string; price: number; currency: string; active: boolean};
type StaffMember = {id: string; email: string; displayName: string; role: StaffRole; active: boolean};
type DashboardProps = {role: StaffRole; locale: string};

const repairStatuses = ['REQUESTED','RECEIVED','DIAGNOSING','WAITING_APPROVAL','WAITING_PARTS','IN_PROGRESS','READY_FOR_PICKUP','COMPLETED','CANCELLED'];
const orderStatuses = ['PENDING','CONFIRMED','PAID','SHIPPED','COMPLETED','CANCELLED'];
const money = (amount: number) => `฿${amount.toLocaleString('en-US')}`;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {...init, headers: {'Content-Type': 'application/json', ...init?.headers}});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed.');
  return result as T;
}

export default function AdminDashboard({role, locale}: DashboardProps) {
  const [tab, setTab] = useState<'products'|'orders'|'repairs'|'services'|'staff'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [repairPrices, setRepairPrices] = useState<RepairPriceItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({name:'',brand:'Apple',model:'',storage:'128GB',condition:'Good',description:'',imageUrl:'',price:'',stock:'1'});
  const [serviceForm, setServiceForm] = useState({key:'screen', name:'Screen repair', icon:'▣', description:'', termsAndConditions:'', price:'1200', turnaround:'48 hours', translationKey:'screen'});
  const [repairPriceForm, setRepairPriceForm] = useState({model:'', quality:'Standard', price:'', currency:'THB'});
  const [staffForm, setStaffForm] = useState({displayName:'',email:'',password:'',role:'STAFF' as 'MANAGER'|'STAFF'});
  const canManageProducts = role === 'OWNER' || role === 'MANAGER';
  const canManageServices = role === 'OWNER' || role === 'MANAGER';
  const isOwner = role === 'OWNER';

  async function loadDashboard() {
    setError('');
    try {
      const [productResult, orderResult, bookingResult, serviceResult, repairPriceResult] = await Promise.all([
        api<{products: Product[]}>('/api/shop/products?all=1'),
        api<{orders: Order[]}>('/api/shop/orders'),
        api<{bookings: Booking[]}>('/api/bookings'),
        api<{services: ServiceItem[]}>('/api/services?all=1'),
        api<{prices: RepairPriceItem[]}>('/api/repair-prices?all=1'),
      ]);
      setProducts(productResult.products);
      setOrders(orderResult.orders);
      setBookings(bookingResult.bookings);
      setServices(serviceResult.services);
      setRepairPrices(repairPriceResult.prices);
      if (isOwner) {
        const staffResult = await api<{staff: StaffMember[]}>('/api/staff');
        setStaff(staffResult.staff);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load dashboard data.');
    }
  }

  useEffect(() => { void loadDashboard(); }, []);

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/shop/products', {method:'POST', body: JSON.stringify({...productForm, price:Number(productForm.price), stock:Number(productForm.stock)})});
      setProductForm({name:'',brand:'Apple',model:'',storage:'128GB',condition:'Good',description:'',imageUrl:'',price:'',stock:'1'});
      setNotice('Phone added to the shop.');
      await loadDashboard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add phone.');
    } finally {
      setBusy(false);
    }
  }

  async function saveProduct(product: Product) {
    setBusy(true);
    setError('');
    try {
      await api(`/api/shop/products/${product.id}`, {method:'PATCH', body: JSON.stringify(product)});
      setNotice(`${product.name} updated.`);
      setEditingProductId(null);
      await loadDashboard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update phone.');
    } finally {
      setBusy(false);
    }
  }

  async function archiveProduct(product: Product) {
    if (!window.confirm(`Remove ${product.name} from the public shop?`)) return;
    try {
      await api(`/api/shop/products/${product.id}`, {method:'DELETE'});
      setProducts(current => current.map(item => item.id === product.id ? {...item, active:false} : item));
      setNotice('Phone removed from the public shop.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not remove phone.');
    }
  }

  async function addService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/services', {method:'POST', body: JSON.stringify({...serviceForm, price:Number(serviceForm.price)})});
      setServiceForm({key:'screen', name:'Screen repair', icon:'▣', description:'', termsAndConditions:'', price:'1200', turnaround:'48 hours', translationKey:'screen'});
      setNotice('Repair service saved.');
      await loadDashboard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add repair service.');
    } finally {
      setBusy(false);
    }
  }

  async function saveService(service: ServiceItem) {
    setBusy(true);
    setError('');
    try {
      await api(`/api/services/${service.id}`, {method:'PATCH', body: JSON.stringify({name: service.name, key: service.key, icon: service.icon, description: service.description, termsAndConditions: service.termsAndConditions, price: service.price, turnaround: service.turnaround, active: service.active})});
      setNotice(`${service.name} updated.`);
      await loadDashboard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update repair service.');
    } finally {
      setBusy(false);
    }
  }

  async function archiveService(service: ServiceItem) {
    if (!window.confirm(`Hide ${service.name} from the public repair menu?`)) return;
    try {
      await api(`/api/services/${service.id}`, {method:'DELETE'});
      setServices(current => current.filter(item => item.id !== service.id));
      setNotice('Repair service hidden from the public menu.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not hide repair service.');
    }
  }

  async function addRepairPrice(event: FormEvent<HTMLFormElement>, serviceId: string) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/repair-prices', {method:'POST', body: JSON.stringify({...repairPriceForm, serviceId, price:Number(repairPriceForm.price)})});
      setRepairPriceForm({model:'', quality:'Standard', price:'', currency:'THB'});
      setNotice('Service model and quality price added.');
      await loadDashboard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add repair price.');
    } finally {
      setBusy(false);
    }
  }

  async function saveRepairPrice(item: RepairPriceItem) {
    setBusy(true);
    setError('');
    try {
      await api(`/api/repair-prices/${item.id}`, {method:'PATCH', body: JSON.stringify({serviceId:item.serviceId, model:item.model, quality:item.quality, price:item.price, currency:item.currency, active:item.active})});
      setNotice(`${item.serviceName} · ${item.model} · ${item.quality} price updated.`);
      await loadDashboard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update repair price.');
    } finally {
      setBusy(false);
    }
  }

  async function archiveRepairPrice(item: RepairPriceItem) {
    if (!window.confirm(`Hide ${item.serviceName} · ${item.quality} for ${item.model} from customer booking?`)) return;
    try {
      await api(`/api/repair-prices/${item.id}`, {method:'DELETE'});
      setRepairPrices(current => current.map(price => price.id === item.id ? {...price, active:false} : price));
      setNotice('Repair price hidden from customer booking.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not hide repair price.');
    }
  }

  async function changeOrderStatus(order: Order, status: string) {
    try {
      await api(`/api/shop/orders/${order.id}`, {method:'PATCH', body: JSON.stringify({status})});
      setOrders(current => current.map(item => item.id === order.id ? {...item, status} : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update order.');
    }
  }

  async function changeRepairStatus(booking: Booking, status: string) {
    try {
      await api('/api/bookings', {method:'PATCH', body: JSON.stringify({id:booking.id, status})});
      setBookings(current => current.map(item => item.id === booking.id ? {...item, status} : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update repair.');
    }
  }

  async function saveRepairQuote(booking: Booking) {
    if (booking.quotedPrice === null) return;
    try {
      await api('/api/bookings', {method:'PATCH', body: JSON.stringify({id:booking.id, quotedPrice:booking.quotedPrice})});
      setNotice(`Repair quote for ${booking.reference} updated.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update repair quote.');
    }
  }

  async function addStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/staff', {method:'POST', body: JSON.stringify(staffForm)});
      setStaffForm({displayName:'',email:'',password:'',role:'STAFF'});
      setNotice('Staff account created. Share credentials securely.');
      await loadDashboard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create staff account.');
    } finally {
      setBusy(false);
    }
  }

  async function updateStaff(member: StaffMember, changes: {role?: 'MANAGER'|'STAFF'; active?: boolean}) {
    try {
      await api('/api/staff', {method:'PATCH', body: JSON.stringify({id:member.id, ...changes})});
      await loadDashboard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update staff account.');
    }
  }

  async function signOut() {
    await api('/api/staff/logout', {method:'POST'}).catch(() => undefined);
    window.location.assign(`/${locale}/admin/login`);
  }

  return <div className="admin-shell">
    <div className="admin-toolbar">
      <span className="role-label">{role}</span>
      <button className="btn light" type="button" onClick={signOut}>Sign out</button>
    </div>
    <div className="admin-grid">
      <div className="stat-card"><div className="eyebrow">In stock</div><h3>{products.reduce((sum, product) => sum + product.stock, 0)}</h3><p>Second-hand phones</p></div>
      <div className="stat-card"><div className="eyebrow">Orders</div><h3>{orders.filter(order => !['COMPLETED','CANCELLED'].includes(order.status)).length}</h3><p>Open orders</p></div>
      <div className="stat-card"><div className="eyebrow">Repairs</div><h3>{bookings.filter(booking => !['COMPLETED','CANCELLED'].includes(booking.status)).length}</h3><p>Active repair jobs</p></div>
    </div>

    <div className="admin-tabs" role="tablist" aria-label="Shop management">
      <button type="button" role="tab" aria-selected={tab==='products'} onClick={()=>setTab('products')}>Inventory</button>
      <button type="button" role="tab" aria-selected={tab==='orders'} onClick={()=>setTab('orders')}>Orders</button>
      <button type="button" role="tab" aria-selected={tab==='repairs'} onClick={()=>setTab('repairs')}>Repairs</button>
      {canManageServices && <button type="button" role="tab" aria-selected={tab==='services'} onClick={()=>setTab('services')}>Services</button>}
      {isOwner && <button type="button" role="tab" aria-selected={tab==='staff'} onClick={()=>setTab('staff')}>Staff access</button>}
    </div>

    {error && <div className="error" role="alert">{error}</div>}
    {notice && <div className="success" role="status">{notice}</div>}

    {tab === 'products' && <div className="admin-workspace">
      {canManageProducts && <form className="panel admin-form" onSubmit={addProduct}>
        <div className="eyebrow">Store catalog</div><h2>Add a used phone</h2>
        <div className="field-row">
          <div className="field"><label htmlFor="product-name">Listing name</label><input id="product-name" value={productForm.name} onChange={event=>setProductForm({...productForm,name:event.target.value})} required maxLength={120} /></div>
          <div className="field"><label htmlFor="product-brand">Brand</label><input id="product-brand" value={productForm.brand} onChange={event=>setProductForm({...productForm,brand:event.target.value})} required maxLength={60} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label htmlFor="product-model">Model</label><input id="product-model" value={productForm.model} onChange={event=>setProductForm({...productForm,model:event.target.value})} required maxLength={120} /></div>
          <div className="field"><label htmlFor="product-storage">Storage</label><input id="product-storage" value={productForm.storage} onChange={event=>setProductForm({...productForm,storage:event.target.value})} required maxLength={30} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label htmlFor="product-condition">Condition</label><select id="product-condition" value={productForm.condition} onChange={event=>setProductForm({...productForm,condition:event.target.value})}><option>Excellent</option><option>Very Good</option><option>Good</option><option>Fair</option></select></div>
          <div className="field"><label htmlFor="product-price">Price (THB)</label><input id="product-price" type="number" min="1" step="1" value={productForm.price} onChange={event=>setProductForm({...productForm,price:event.target.value})} required /></div>
        </div>
        <div className="field-row">
          <div className="field"><label htmlFor="product-stock">Quantity</label><input id="product-stock" type="number" min="0" max="10000" value={productForm.stock} onChange={event=>setProductForm({...productForm,stock:event.target.value})} required /></div>
          <div className="field"><label htmlFor="product-image">Image URL</label><input id="product-image" type="url" value={productForm.imageUrl} onChange={event=>setProductForm({...productForm,imageUrl:event.target.value})} placeholder="https://…" /></div>
        </div>
        <div className="field"><label htmlFor="product-description">Description</label><textarea id="product-description" value={productForm.description} onChange={event=>setProductForm({...productForm,description:event.target.value})} required maxLength={2000} rows={3} /></div>
        <button className="btn dark" type="submit" disabled={busy}>Add phone</button>
      </form>}
      <section className="panel">
        <div className="section-head"><div><div className="eyebrow">Inventory</div><h2>Listed phones</h2></div></div>
        <div className={styles.folderList}>{products.map(product=><article className={styles.folder} key={product.id}>
          <div className={styles.folderHeader}><div className={styles.folderIdentity}><strong>{product.name}</strong><span>{product.brand} · {product.model} · {product.storage} · {product.condition}</span><span>{money(product.price)} · {product.stock} in stock · {product.active?'Public':'Hidden'}</span></div>{canManageProducts && <button className="btn light" type="button" aria-expanded={editingProductId===product.id} onClick={()=>setEditingProductId(editingProductId===product.id?null:product.id)}>{editingProductId===product.id?'Close':'Edit'}</button>}</div>
          {editingProductId===product.id && <div className={styles.folderEditor}>
            <div className="field-row"><div className="field"><label>Listing name</label><input value={product.name} onChange={event=>setProducts(current=>current.map(item=>item.id===product.id?{...item,name:event.target.value}:item))} /></div><div className="field"><label>Brand</label><input value={product.brand} onChange={event=>setProducts(current=>current.map(item=>item.id===product.id?{...item,brand:event.target.value}:item))} /></div></div>
            <div className="field-row"><div className="field"><label>Model</label><input value={product.model} onChange={event=>setProducts(current=>current.map(item=>item.id===product.id?{...item,model:event.target.value}:item))} /></div><div className="field"><label>Storage</label><input value={product.storage} onChange={event=>setProducts(current=>current.map(item=>item.id===product.id?{...item,storage:event.target.value}:item))} /></div></div>
            <div className="field-row"><div className="field"><label>Condition</label><select value={product.condition} onChange={event=>setProducts(current=>current.map(item=>item.id===product.id?{...item,condition:event.target.value}:item))}><option>Excellent</option><option>Very Good</option><option>Good</option><option>Fair</option></select></div><div className="field"><label>Image URL</label><input type="url" value={product.imageUrl || ''} onChange={event=>setProducts(current=>current.map(item=>item.id===product.id?{...item,imageUrl:event.target.value}:item))} /></div></div>
            <div className="field"><label>Description</label><textarea rows={2} value={product.description} onChange={event=>setProducts(current=>current.map(item=>item.id===product.id?{...item,description:event.target.value}:item))} /></div>
            <div className="field-row"><div className="field"><label>Price (THB)</label><input type="number" min="1" value={product.price} onChange={event=>setProducts(current=>current.map(item=>item.id===product.id?{...item,price:Number(event.target.value)}:item))} /></div><div className="field"><label>Stock</label><input type="number" min="0" value={product.stock} onChange={event=>setProducts(current=>current.map(item=>item.id===product.id?{...item,stock:Number(event.target.value)}:item))} /></div><div className="field"><label>Store listing</label><select value={product.active?'active':'hidden'} onChange={event=>setProducts(current=>current.map(item=>item.id===product.id?{...item,active:event.target.value==='active'}:item))}><option value="active">Public</option><option value="hidden">Hidden</option></select></div></div>
            <div className="admin-actions"><button className="btn dark" type="button" disabled={busy} onClick={()=>saveProduct(product)}>Save changes</button>{product.active && <button className="chip danger" type="button" onClick={()=>archiveProduct(product)}>Hide listing</button>}</div>
          </div>}
        </article>)}{products.length===0 && <p className="empty">No phones listed yet.</p>}</div>
      </section>
    </div>}

    {tab === 'orders' && <section className="panel"><div className="section-head"><div><div className="eyebrow">Customer sales</div><h2>Phone orders</h2></div></div><div className="admin-record-list">{orders.map(order=><article className="admin-record" key={order.id}><div className="record-heading"><strong>{order.reference}</strong><span>{new Date(order.createdAt).toLocaleString()}</span></div><p>{order.customerName} · {order.phone} · {order.email}</p><p>{order.shippingAddress}</p><ul>{order.items.map((item,index)=><li key={`${order.id}-${index}`}>{item.quantity} × {item.productName} · {money(item.unitPrice)}</li>)}</ul><div className="record-footer"><strong>{money(order.total)}</strong><select aria-label={`Status for order ${order.reference}`} value={order.status} onChange={event=>changeOrderStatus(order,event.target.value)}>{orderStatuses.map(status=><option key={status} value={status}>{status.replaceAll('_',' ')}</option>)}</select></div></article>)}{orders.length===0 && <p className="empty">No phone orders yet.</p>}</div></section>}

    {tab === 'repairs' && <section className="panel"><div className="section-head"><div><div className="eyebrow">Service desk</div><h2>Repair bookings</h2></div></div><div className="admin-record-list">{bookings.map(booking=><article className="admin-record" key={booking.id}><div className="record-heading"><strong>{booking.reference}</strong><span>{new Date(booking.createdAt).toLocaleDateString()}</span></div><p>{booking.customerName} · {booking.phone} · {booking.email || 'No email'}</p><p><strong>{booking.device}</strong> · {booking.issue}</p><div className="record-footer"><span>{booking.status.replaceAll('_',' ')}</span><select aria-label={`Status for repair ${booking.reference}`} value={booking.status} onChange={event=>changeRepairStatus(booking,event.target.value)}>{repairStatuses.map(status=><option key={status} value={status}>{status.replaceAll('_',' ')}</option>)}</select></div><div className="record-footer"><label className="stock-field">Final quote ({booking.currency}) <input aria-label={`Final quote for repair ${booking.reference}`} type="number" min="0" step="1" value={booking.quotedPrice ?? ''} onChange={event=>setBookings(current=>current.map(item=>item.id===booking.id?{...item,quotedPrice:event.target.value===''?null:Number(event.target.value)}:item))} /></label><button className="btn light" type="button" disabled={booking.quotedPrice===null} onClick={()=>saveRepairQuote(booking)}>Save quote</button></div></article>)}{bookings.length===0 && <p className="empty">No repair bookings yet.</p>}</div></section>}

    {tab === 'services' && canManageServices && <div className="admin-workspace">
      <form className="panel admin-form" onSubmit={addService}>
        <div className="eyebrow">Repair menu</div><h2>Add repair service</h2>
        <div className="field-row">
          <div className="field"><label htmlFor="service-name">Service name</label><input id="service-name" value={serviceForm.name} onChange={event=>setServiceForm({...serviceForm,name:event.target.value})} required maxLength={100} /></div>
          <div className="field"><label htmlFor="service-key">Key</label><input id="service-key" value={serviceForm.key} onChange={event=>setServiceForm({...serviceForm,key:event.target.value})} required maxLength={40} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label htmlFor="service-icon">Icon</label><input id="service-icon" value={serviceForm.icon} onChange={event=>setServiceForm({...serviceForm,icon:event.target.value})} maxLength={10} /></div>
          <div className="field"><label htmlFor="service-price">Price (THB)</label><input id="service-price" type="number" min="0" step="1" value={serviceForm.price} onChange={event=>setServiceForm({...serviceForm,price:event.target.value})} required /></div>
        </div>
        <div className="field-row">
          <div className="field"><label htmlFor="service-turnaround">Turnaround</label><input id="service-turnaround" value={serviceForm.turnaround} onChange={event=>setServiceForm({...serviceForm,turnaround:event.target.value})} maxLength={80} /></div>
          <div className="field"><label htmlFor="service-translation">Translation key</label><input id="service-translation" value={serviceForm.translationKey} onChange={event=>setServiceForm({...serviceForm,translationKey:event.target.value})} maxLength={80} /></div>
        </div>
        <div className="field"><label htmlFor="service-description">Description</label><textarea id="service-description" value={serviceForm.description} onChange={event=>setServiceForm({...serviceForm,description:event.target.value})} required maxLength={500} rows={3} /></div>
        <div className="field"><label htmlFor="service-terms">Terms and conditions</label><textarea id="service-terms" value={serviceForm.termsAndConditions} onChange={event=>setServiceForm({...serviceForm,termsAndConditions:event.target.value})} maxLength={4000} rows={4} placeholder="Warranty, inspection, approval, and exclusions" /></div>
        <button className="btn dark" type="submit" disabled={busy}>Save service</button>
      </form>

      <section className="panel">
        <div className="section-head"><div><div className="eyebrow">Repair menu</div><h2>Service folders</h2></div></div>
        <div className={styles.folderList}>{services.map(service=>{
          const variants=repairPrices.filter(item=>item.serviceId===service.id);
          return <details className={styles.folder} key={service.id}>
            <summary className={styles.folderSummary}><span>{service.icon} {service.name}</span><span>{variants.filter(item=>item.active).length} active price options · {service.active?'Visible':'Hidden'}</span></summary>
            <div className={styles.folderEditor}>
              <div className="field-row"><div className="field"><label>Service name</label><input value={service.name} onChange={event=>setServices(current=>current.map(item=>item.id===service.id?{...item,name:event.target.value}:item))} /></div><div className="field"><label>Service key</label><input value={service.key} onChange={event=>setServices(current=>current.map(item=>item.id===service.id?{...item,key:event.target.value}:item))} /></div></div>
              <div className="field-row"><div className="field"><label>Icon</label><input value={service.icon} onChange={event=>setServices(current=>current.map(item=>item.id===service.id?{...item,icon:event.target.value}:item))} maxLength={10} /></div><div className="field"><label>Turnaround</label><input value={service.turnaround} onChange={event=>setServices(current=>current.map(item=>item.id===service.id?{...item,turnaround:event.target.value}:item))} maxLength={80} /></div></div>
              <div className="field"><label>Description</label><textarea value={service.description} onChange={event=>setServices(current=>current.map(item=>item.id===service.id?{...item,description:event.target.value}:item))} rows={2} /></div>
              <div className="field"><label>Terms and conditions</label><textarea value={service.termsAndConditions || ''} onChange={event=>setServices(current=>current.map(item=>item.id===service.id?{...item,termsAndConditions:event.target.value}:item))} maxLength={4000} rows={4} placeholder="Warranty, inspection, approval, and exclusions" /></div>
              <div className="field"><label>Customer service page</label><select value={service.active?'visible':'hidden'} onChange={event=>setServices(current=>current.map(item=>item.id===service.id?{...item,active:event.target.value==='visible'}:item))}><option value="visible">Visible</option><option value="hidden">Hidden</option></select></div>
              <div className="admin-actions"><button className="btn light" type="button" disabled={busy} onClick={()=>saveService(service)}>Save service</button></div>
              <h3>Model and quality prices</h3>
              <form className={styles.variantForm} onSubmit={event=>void addRepairPrice(event,service.id)}>
                <div className="field-row"><div className="field"><label>Exact phone model</label><input value={repairPriceForm.model} onChange={event=>setRepairPriceForm({...repairPriceForm,model:event.target.value})} required maxLength={120} placeholder="Apple iPhone 16 Pro" /></div><div className="field"><label>Part quality / option</label><input value={repairPriceForm.quality} onChange={event=>setRepairPriceForm({...repairPriceForm,quality:event.target.value})} required maxLength={80} placeholder="Standard, Premium, Original" /></div></div>
                <div className="field-row"><div className="field"><label>Price</label><input type="number" min="0" max="1000000" step="1" value={repairPriceForm.price} onChange={event=>setRepairPriceForm({...repairPriceForm,price:event.target.value})} required /></div><div className="field"><label>Currency</label><input value={repairPriceForm.currency} onChange={event=>setRepairPriceForm({...repairPriceForm,currency:event.target.value.toUpperCase()})} required minLength={3} maxLength={3} /></div></div>
                <button className="btn dark" type="submit" disabled={busy}>Add model and quality price</button>
              </form>
              <div className={styles.variantList}>{variants.map(item=><details className={styles.variantFolder} key={item.id}>
                <summary>{item.model} · {item.quality} · {item.currency} {item.price.toLocaleString('en-US')} · {item.active?'Available':'Hidden'}</summary>
                <div className={styles.variantEditor}>
                  <div className="field-row"><div className="field"><label>Model</label><input value={item.model} onChange={event=>setRepairPrices(current=>current.map(row=>row.id===item.id?{...row,model:event.target.value}:row))} /></div><div className="field"><label>Quality / option</label><input value={item.quality} onChange={event=>setRepairPrices(current=>current.map(row=>row.id===item.id?{...row,quality:event.target.value}:row))} /></div></div>
                  <div className="field-row"><div className="field"><label>Price</label><input type="number" min="0" step="1" value={item.price} onChange={event=>setRepairPrices(current=>current.map(row=>row.id===item.id?{...row,price:Number(event.target.value)}:row))} /></div><div className="field"><label>Currency</label><input value={item.currency} maxLength={3} onChange={event=>setRepairPrices(current=>current.map(row=>row.id===item.id?{...row,currency:event.target.value.toUpperCase()}:row))} /></div></div>
                  <div className="field"><label>Customer booking</label><select value={item.active?'active':'hidden'} onChange={event=>setRepairPrices(current=>current.map(row=>row.id===item.id?{...row,active:event.target.value==='active'}:row))}><option value="active">Available</option><option value="hidden">Hidden</option></select></div>
                  <div className="admin-actions"><button className="btn light" type="button" disabled={busy} onClick={()=>saveRepairPrice(item)}>Save price</button></div>
                </div>
              </details>)}</div>
            </div>
          </details>;
        })}{services.length===0 && <p className="empty">No repair services yet.</p>}</div>
      </section>
    </div>}

    {tab === 'staff' && isOwner && <div className="admin-workspace">
      <form className="panel admin-form" onSubmit={addStaff}><div className="eyebrow">Access control</div><h2>Create staff account</h2><div className="field"><label htmlFor="staff-name">Name</label><input id="staff-name" value={staffForm.displayName} onChange={event=>setStaffForm({...staffForm,displayName:event.target.value})} required maxLength={100} /></div><div className="field"><label htmlFor="staff-new-email">Work email</label><input id="staff-new-email" type="email" autoComplete="off" value={staffForm.email} onChange={event=>setStaffForm({...staffForm,email:event.target.value})} required maxLength={200} /></div><div className="field"><label htmlFor="staff-new-password">Temporary password</label><input id="staff-new-password" type="password" autoComplete="new-password" minLength={14} value={staffForm.password} onChange={event=>setStaffForm({...staffForm,password:event.target.value})} required /></div><div className="field"><label htmlFor="staff-role">Role</label><select id="staff-role" value={staffForm.role} onChange={event=>setStaffForm({...staffForm,role:event.target.value as 'MANAGER'|'STAFF'})}><option value="STAFF">Staff</option><option value="MANAGER">Manager</option></select></div><button className="btn dark" type="submit" disabled={busy}>Create account</button></form>
      <section className="panel"><div className="section-head"><div><div className="eyebrow">Access control</div><h2>Staff accounts</h2></div></div><div className="admin-record-list">{staff.map(member=><article className="admin-record" key={member.id}><div className="record-heading"><strong>{member.displayName}</strong><span>{member.active?'Active':'Disabled'}</span></div><p>{member.email}</p><div className="record-footer"><select aria-label={`Role for ${member.email}`} value={member.role} disabled={member.role==='OWNER'} onChange={event=>updateStaff(member,{role:event.target.value as 'MANAGER'|'STAFF'})}><option value="OWNER">Owner</option><option value="MANAGER">Manager</option><option value="STAFF">Staff</option></select>{member.role!=='OWNER' && <button type="button" className="chip danger" onClick={()=>updateStaff(member,{active:!member.active})}>{member.active?'Disable':'Enable'}</button>}</div></article>)}{staff.length===0 && <p className="empty">No staff accounts.</p>}</div></section>
    </div>}
  </div>;
}
