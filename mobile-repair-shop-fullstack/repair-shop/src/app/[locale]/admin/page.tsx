import AdminDashboard from './dashboard';
import {redirect} from 'next/navigation';
import {getCurrentStaff} from '@/lib/staff-auth';
export const metadata={title:'Staff dashboard',robots:{index:false,follow:false}};
export default async function AdminPage({params}:{params:Promise<{locale:string}>}){
	const {locale}=await params;
	const staff=await getCurrentStaff();
	if(!staff) redirect(`/${locale}/admin/login`);
	return <section className="container section"><div className="page-intro"><div className="eyebrow">PRIVATE SHOP OPERATIONS</div><h1>Shop dashboard</h1><p>Signed in as {staff.displayName} · {staff.role.toLowerCase()}</p></div><AdminDashboard role={staff.role} locale={locale}/></section>;
}
