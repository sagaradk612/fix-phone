import type {Metadata} from 'next';
import LoginForm from './login-form';

export const metadata: Metadata = {title: 'Staff sign in', robots: {index: false, follow: false}};

export default function AdminLoginPage() {
  return <section className="container section staff-login-page">
    <div className="page-intro">
      <div className="eyebrow">PRIVATE STAFF AREA</div>
      <h1>Staff sign in</h1>
      <p>Use your assigned shop account to continue.</p>
    </div>
    <LoginForm />
  </section>;
}
