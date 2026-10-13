'use client';

import {useEffect, useMemo, useState, type FormEvent} from 'react';

type Product = {id: string; name: string; brand: string; model: string; storage: string; condition: string; description: string; imageUrl: string | null; price: number; stock: number};
type CartLine = {product: Product; quantity: number};
const formatPrice = (price: number) => `฿${price.toLocaleString('en-US')}`;

export default function SellPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('All brands');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [customer, setCustomer] = useState({customerName:'',email:'',phone:'',shippingAddress:'',notes:''});

  async function loadProducts() {
    setLoading(true);
    try {
      const response = await fetch('/api/shop/products');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load the phone catalog.');
      setProducts(result.products);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load the phone catalog.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadProducts(); }, []);

  const brands = useMemo(() => ['All brands', ...new Set(products.map(product => product.brand))], [products]);
  const filteredProducts = useMemo(() => products.filter(product => {
    const matchesBrand = brand === 'All brands' || product.brand === brand;
    const searchText = `${product.name} ${product.brand} ${product.model} ${product.storage}`.toLowerCase();
    return matchesBrand && searchText.includes(search.trim().toLowerCase());
  }), [products, brand, search]);
  const cartLines = useMemo<CartLine[]>(() => products.flatMap(product => {
    const quantity = cart[product.id] || 0;
    return quantity > 0 ? [{product, quantity}] : [];
  }), [products, cart]);
  const total = cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  function changeQuantity(product: Product, nextQuantity: number) {
    setCart(current => {
      const updated = {...current};
      if (nextQuantity <= 0) delete updated[product.id];
      else updated[product.id] = Math.min(nextQuantity, product.stock);
      return updated;
    });
    setConfirmation('');
    setError('');
  }

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setConfirmation('');
    try {
      const response = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({...customer, items: cartLines.map(line => ({productId:line.product.id,quantity:line.quantity}))}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Your order could not be placed.');
      setConfirmation(`Order ${result.reference} received. Our team will contact you to confirm payment and delivery.`);
      setCart({});
      setCustomer({customerName:'',email:'',phone:'',shippingAddress:'',notes:''});
      await loadProducts();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Your order could not be placed.');
    } finally {
      setSubmitting(false);
    }
  }

  return <section className="container section shop-page">
    <div className="page-intro">
      <div className="eyebrow">TESTED SECOND-HAND PHONES</div>
      <h1>Find your next phone.</h1>
      <p>Browse inspected devices with clear condition, storage, and pricing. Place an order request and our team will confirm the details with you.</p>
    </div>

    <div className="shop-toolbar">
      <label className="shop-search"><span>Search phones</span><input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Model, brand or storage" /></label>
      <label className="shop-filter"><span>Brand</span><select value={brand} onChange={event=>setBrand(event.target.value)}>{brands.map(option=><option key={option}>{option}</option>)}</select></label>
    </div>

    <div className="shop-layout">
      <div className="shop-results">
        {loading && <p className="empty">Loading phones…</p>}
        {!loading && filteredProducts.map(product=><article className="shop-product" key={product.id}>
          {product.imageUrl ? <img className="shop-product-photo" src={product.imageUrl} alt={`${product.name} second-hand phone`} /> : <div className="shop-product-placeholder" aria-hidden="true"><span>{product.brand}</span><strong>{product.model}</strong><small>{product.storage}</small></div>}
          <div className="shop-product-info">
            <div className="shop-product-heading"><div><span className="eyebrow">{product.brand}</span><h2>{product.name}</h2></div><strong className="shop-price">{formatPrice(product.price)}</strong></div>
            <div className="shop-specs"><span>{product.storage}</span><span>{product.condition}</span><span>{product.stock} available</span></div>
            <p>{product.description}</p>
            <button className="btn dark" type="button" disabled={product.stock < 1} onClick={()=>changeQuantity(product,(cart[product.id]||0)+1)}>{product.stock < 1 ? 'Out of stock' : cart[product.id] ? `Add another (${cart[product.id]} in cart)` : 'Add to cart'}</button>
          </div>
        </article>)}
        {!loading && filteredProducts.length===0 && <div className="empty shop-empty">{products.length ? 'No phones match those filters.' : 'No phones are listed right now. Please check back soon.'}</div>}
      </div>

      <aside className="panel shop-cart">
        <div className="eyebrow">Your order</div>
        <h2>Cart <span>{cartLines.reduce((sum,line)=>sum+line.quantity,0)}</span></h2>
        {cartLines.length===0 ? <p className="empty">Add a phone to start an order.</p> : <>
          <div className="cart-lines">{cartLines.map(line=><div className="cart-line" key={line.product.id}><div><strong>{line.product.name}</strong><span>{formatPrice(line.product.price)} each</span></div><div className="quantity-control"><button type="button" aria-label={`Remove one ${line.product.name}`} onClick={()=>changeQuantity(line.product,line.quantity-1)}>−</button><span>{line.quantity}</span><button type="button" aria-label={`Add one ${line.product.name}`} disabled={line.quantity>=line.product.stock} onClick={()=>changeQuantity(line.product,line.quantity+1)}>+</button></div></div>)}</div>
          <div className="cart-total"><span>Order total</span><strong>{formatPrice(total)}</strong></div>
          <form className="checkout-form" onSubmit={checkout}>
            <div className="field"><label htmlFor="order-name">Full name</label><input id="order-name" autoComplete="name" value={customer.customerName} onChange={event=>setCustomer({...customer,customerName:event.target.value})} required minLength={2} maxLength={100} /></div>
            <div className="field"><label htmlFor="order-email">Email</label><input id="order-email" type="email" autoComplete="email" value={customer.email} onChange={event=>setCustomer({...customer,email:event.target.value})} required maxLength={200} /></div>
            <div className="field"><label htmlFor="order-phone">Phone</label><input id="order-phone" type="tel" autoComplete="tel" value={customer.phone} onChange={event=>setCustomer({...customer,phone:event.target.value})} required minLength={5} maxLength={40} /></div>
            <div className="field"><label htmlFor="order-address">Delivery address</label><textarea id="order-address" autoComplete="street-address" rows={3} value={customer.shippingAddress} onChange={event=>setCustomer({...customer,shippingAddress:event.target.value})} required minLength={8} maxLength={1000} /></div>
            <div className="field"><label htmlFor="order-notes">Order notes</label><textarea id="order-notes" rows={2} value={customer.notes} onChange={event=>setCustomer({...customer,notes:event.target.value})} maxLength={1000} /></div>
            {error && <div className="error" role="alert">{error}</div>}
            {confirmation && <div className="success" role="status">{confirmation}</div>}
            <button className="btn dark" type="submit" disabled={submitting}>{submitting ? 'Placing order…' : 'Place order request'}</button>
            <p className="checkout-note">No payment is taken here. The shop will confirm payment and delivery with you.</p>
          </form>
        </>}
      </aside>
    </div>
  </section>;
}
