'use client';

import {useState, type FormEvent} from 'react';
import {useRouter} from '@/i18n/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/staff/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Sign-in failed.');
      router.replace('/admin');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return <form className="form-wrap staff-login-form" onSubmit={submit}>
    <div className="field">
      <label htmlFor="staff-email">Work email</label>
      <input id="staff-email" type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required maxLength={200} />
    </div>
    <div className="field">
      <label htmlFor="staff-password">Password</label>
      <input id="staff-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required maxLength={200} />
    </div>
    {error && <div className="error" role="alert">{error}</div>}
    <button className="btn dark" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
  </form>;
}
