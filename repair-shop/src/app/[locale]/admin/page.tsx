import AdminDashboard from './dashboard';
export const metadata={title:'Admin Dashboard',robots:{index:false,follow:false}};
export default function AdminPage(){return <section className="container"><div className="page-intro"><div className="eyebrow">SHOP OPERATIONS</div><h1>Repair dashboard</h1><p>Review incoming requests and update repair progress. Use your configured admin API key.</p></div><AdminDashboard/></section>}
