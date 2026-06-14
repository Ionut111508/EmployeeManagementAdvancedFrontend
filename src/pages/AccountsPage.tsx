import { FormEvent, useState } from 'react';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import type { Account, UserRole } from '../types/domain';

const emptyCreateForm = { accountId: '', username: '', password: '', role: 'Employee' as UserRole };

export function AccountsPage() {
  const [refresh, setRefresh] = useState(0);
  const accounts = useAsync(api.accounts, [refresh]);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editing, setEditing] = useState<Account | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function createAccount(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      await api.createAccount(createForm);
      setCreateForm(emptyCreateForm);
      setRefresh(value => value + 1);
      setMessage('Account created. Link it to an employee before using it for login.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create account.');
    }
  }

  async function updateAccount(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setMessage(null);
    try {
      await api.updateAccount(editing.accountId, {
        username: editing.username,
        role: editing.role,
        password: editPassword || null
      });
      setEditing(null);
      setEditPassword('');
      setRefresh(value => value + 1);
      setMessage('Account updated. Role changes apply at the next login.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update account.');
    }
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Security" title="Accounts" description="Create database accounts, assign roles, and reset passwords. Only linked accounts can sign in." />
    <form className="card form-grid" onSubmit={createAccount}>
      <h2>Create account</h2>
      <input className="field" placeholder="Account ID" value={createForm.accountId} onChange={event => setCreateForm({ ...createForm, accountId: event.target.value })} required />
      <input className="field" placeholder="Username" value={createForm.username} onChange={event => setCreateForm({ ...createForm, username: event.target.value })} required />
      <input className="field" type="password" minLength={8} placeholder="Password (minimum 8 characters)" value={createForm.password} onChange={event => setCreateForm({ ...createForm, password: event.target.value })} required />
      <select className="field" value={createForm.role} onChange={event => setCreateForm({ ...createForm, role: event.target.value as UserRole })}><option value="Employee">Employee</option><option value="Manager">Manager</option><option value="Admin">Admin</option></select>
      <button className="btn">Create account</button>
      {message && <p className="muted form-message">{message}</p>}
    </form>

    {editing && <form className="card form-grid" onSubmit={updateAccount}>
      <h2>Edit {editing.accountId}</h2>
      <input className="field" value={editing.username} onChange={event => setEditing({ ...editing, username: event.target.value })} required />
      <select className="field" value={editing.role} onChange={event => setEditing({ ...editing, role: event.target.value as UserRole })}><option value="Employee">Employee</option><option value="Manager">Manager</option><option value="Admin">Admin</option></select>
      <input className="field" type="password" minLength={8} placeholder="New password (optional)" value={editPassword} onChange={event => setEditPassword(event.target.value)} />
      <button className="btn">Save account</button>
      <button className="btn secondary" type="button" onClick={() => { setEditing(null); setEditPassword(''); }}>Cancel</button>
    </form>}

    <Status loading={accounts.loading} error={accounts.error} empty={accounts.data?.length === 0} />
    {accounts.data && <div className="table-card"><table className="data-table"><thead><tr><th>Account</th><th>Username</th><th>Linked employee</th><th>Role</th><th>Action</th></tr></thead><tbody>{accounts.data.map(account => <tr key={account.accountId}><td><strong>{account.accountId}</strong></td><td>{account.username}</td><td>{account.employeeName ?? 'Not linked'}{account.employeeId && <><br/><span className="muted">{account.employeeId}</span></>}</td><td><span className={`badge role-${account.role.toLowerCase()}`}>{account.role}</span></td><td><button className="btn secondary" type="button" onClick={() => { setEditing(account); setEditPassword(''); }}>Edit</button></td></tr>)}</tbody></table></div>}
  </section>;
}
