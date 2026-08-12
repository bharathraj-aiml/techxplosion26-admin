import React, { useState, useEffect } from 'react';
import {
  Lock, LogOut, Users, CreditCard, AlertTriangle, Search, Trash2,
  Download, Eye, X, CheckCircle2, Clock, XCircle, BarChart3, Shield, Terminal
} from 'lucide-react';
import { getAllRegistrations, deleteRegistration, updatePaymentStatus } from './services/dbService';

const ADMIN_EMAIL = 'admin@srmmcet.edu.in';
const ADMIN_PASSWORD = 'techx2026';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('tx26_admin_session') === 'active';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReg, setSelectedReg] = useState(null);

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    setLoading(true);
    const data = await getAllRegistrations();
    setRegistrations(data);
    setLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail === ADMIN_EMAIL && loginPassword === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      localStorage.setItem('tx26_admin_session', 'active');
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. Check email and password.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('tx26_admin_session');
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this registration? This cannot be undone.')) return;
    await deleteRegistration(id);
    setRegistrations(prev => prev.filter(r => r.id !== id));
    if (selectedReg?.id === id) setSelectedReg(null);
  };

  const handleStatusChange = async (id, newStatus) => {
    await updatePaymentStatus(id, { payment_status: newStatus });
    await loadData();
    if (selectedReg?.id === id) {
      const updated = registrations.find(r => r.id === id);
      if (updated) setSelectedReg({ ...updated, payment_status: newStatus });
    }
  };

  const exportCSV = () => {
    const headers = ['Reg No', 'Name', 'College', 'Department', 'Year', 'Email', 'Phone', 'Tracks', 'Events', 'Team?', 'Amount Due', 'Payment Status', 'Registered At'];
    const rows = registrations.map(r => [
      r.registration_number || '-',
      r.full_name,
      r.college_name,
      r.department,
      r.year_of_study,
      r.email,
      r.phone,
      (r.track || []).join(' + '),
      (r.events_selected || []).join(', '),
      r.is_team ? 'Team' : 'Individual',
      r.amount_due,
      r.payment_status,
      new Date(r.created_at).toLocaleString('en-IN')
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `techxplosion26_registrations_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const totalRegs = registrations.length;
  const paidRegs = registrations.filter(r => r.payment_status === 'paid').length;
  const pendingRegs = registrations.filter(r => r.payment_status === 'pending').length;
  const totalRevenue = registrations.filter(r => r.payment_status === 'paid').reduce((sum, r) => sum + (r.amount_paid || r.amount_due || 0), 0);

  // Filtered
  const filtered = registrations.filter(r => {
    const matchesSearch = !searchQuery || 
      r.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.college_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.registration_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ═══════════ LOGIN SCREEN ═══════════
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[#a07c1e] mx-auto flex items-center justify-center shadow-xl">
              <Shield className="w-8 h-8 text-[#0d1017]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[var(--text-main)] font-heading">Admin Portal</h1>
            <p className="text-xs text-[var(--text-muted)] jb-mono">TechXplosion'26 • SRM MCET</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-1.5 jb-mono">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="admin@srmmcet.edu.in"
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] jb-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-1.5 jb-mono">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] jb-mono"
              />
            </div>
            {loginError && (
              <div className="p-3 rounded-lg bg-[var(--accent-crimson)]/10 border border-[var(--accent-crimson)]/30 text-xs text-[var(--accent-crimson)] jb-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {loginError}
              </div>
            )}
            <button type="submit" className="w-full py-3.5 rounded-xl font-bold text-xs jb-mono uppercase tracking-wider bg-gradient-to-r from-[var(--brand-primary)] to-[#a07c1e] text-[#0d1017] shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" /> Sign In to Admin
            </button>
          </form>

          <p className="text-[10px] text-[var(--text-muted)] text-center jb-mono">
            Demo: admin@srmmcet.edu.in / techx2026
          </p>
        </div>
      </div>
    );
  }

  // ═══════════ ADMIN DASHBOARD ═══════════
  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin Header */}
      <header className="glass-panel border-b border-[var(--border-color)] px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[#a07c1e] flex items-center justify-center shadow-lg">
            <Terminal className="w-5 h-5 text-[#0d1017]" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-sm text-[var(--text-main)]">TechXplosion'26</span>
            <span className="ml-2 px-2 py-0.5 rounded-md bg-[var(--badge-bg)] text-[var(--badge-text)] text-[9px] font-bold jb-mono uppercase tracking-wider">Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[var(--text-muted)] jb-mono hidden sm:inline">{ADMIN_EMAIL}</span>
          <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--accent-crimson)] hover:border-[var(--accent-crimson)]/50 transition-all jb-mono flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="flex-grow p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Users className="w-4 h-4 text-[var(--brand-primary)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider jb-mono">Total Registrations</span>
            </div>
            <p className="text-3xl font-extrabold text-[var(--text-main)] jb-mono">{totalRegs}</p>
          </div>
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-emerald)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider jb-mono">Paid</span>
            </div>
            <p className="text-3xl font-extrabold text-[var(--accent-emerald)] jb-mono">{paidRegs}</p>
          </div>
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Clock className="w-4 h-4 text-[var(--brand-primary)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider jb-mono">Pending</span>
            </div>
            <p className="text-3xl font-extrabold text-[var(--brand-primary)] jb-mono">{pendingRegs}</p>
          </div>
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <CreditCard className="w-4 h-4 text-[var(--brand-primary)]" />
              <span className="text-[10px] font-bold uppercase tracking-wider jb-mono">Revenue</span>
            </div>
            <p className="text-3xl font-extrabold text-gradient-gold jb-mono">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex items-center gap-3 flex-grow w-full sm:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, college, reg number..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] jb-mono"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-main)] jb-mono"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="px-3 py-2 rounded-lg bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--brand-primary)] jb-mono transition-all">
              Refresh
            </button>
            <button onClick={exportCSV} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--brand-primary)] to-[#a07c1e] text-[#0d1017] text-xs font-bold jb-mono flex items-center gap-1.5 hover:opacity-90 transition-all">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-xs text-[var(--text-muted)] jb-mono">Loading registrations...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-xs text-[var(--text-muted)] jb-mono">No registrations found matching your filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs jb-mono">
                <thead>
                  <tr className="bg-[var(--bg-card-subtle)] border-b border-[var(--border-color)]">
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Reg No</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">College</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider hidden lg:table-cell">Tracks</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Amount</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filtered.map(reg => (
                    <tr key={reg.id} className="hover:bg-[var(--bg-card-subtle)] transition-colors">
                      <td className="px-4 py-3 font-bold text-[var(--brand-primary)]">{reg.registration_number || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-[var(--text-main)]">{reg.full_name}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{reg.email}</div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] hidden md:table-cell">{reg.college_name}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)] hidden lg:table-cell">{(reg.track || []).join(', ')}</td>
                      <td className="px-4 py-3 font-bold text-[var(--text-main)]">₹{reg.amount_due}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          reg.payment_status === 'paid' ? 'bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)]' :
                          reg.payment_status === 'pending' ? 'bg-[var(--badge-bg)] text-[var(--brand-primary)]' :
                          'bg-[var(--accent-crimson-glow)] text-[var(--accent-crimson)]'
                        }`}>
                          {reg.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setSelectedReg(reg)} className="p-1.5 rounded-lg hover:bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-all" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(reg.id)} className="p-1.5 rounded-lg hover:bg-[var(--accent-crimson-glow)] text-[var(--text-muted)] hover:text-[var(--accent-crimson)] transition-all" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-3 border-t border-[var(--border-color)] text-[10px] text-[var(--text-muted)] jb-mono">
            Showing {filtered.length} of {totalRegs} registrations
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedReg(null)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-extrabold text-lg text-[var(--text-main)]">Registration Details</h2>
              <button onClick={() => setSelectedReg(null)} className="p-1.5 rounded-lg hover:bg-[var(--bg-card-subtle)] text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs jb-mono">
              <div><span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider font-bold">Reg Number</span><span className="font-bold text-[var(--brand-primary)]">{selectedReg.registration_number || '—'}</span></div>
              <div><span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider font-bold">Status</span><span className={`font-bold ${selectedReg.payment_status === 'paid' ? 'text-[var(--accent-emerald)]' : selectedReg.payment_status === 'pending' ? 'text-[var(--brand-primary)]' : 'text-[var(--accent-crimson)]'}`}>{selectedReg.payment_status?.toUpperCase()}</span></div>
              <div><span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider font-bold">Full Name</span><span className="text-[var(--text-main)] font-bold">{selectedReg.full_name}</span></div>
              <div><span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider font-bold">Email</span><span className="text-[var(--text-main)]">{selectedReg.email}</span></div>
              <div><span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider font-bold">Phone</span><span className="text-[var(--text-main)]">{selectedReg.phone}</span></div>
              <div><span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider font-bold">College</span><span className="text-[var(--text-main)]">{selectedReg.college_name}</span></div>
              <div><span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider font-bold">Department</span><span className="text-[var(--text-main)]">{selectedReg.department}</span></div>
              <div><span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider font-bold">Year</span><span className="text-[var(--text-main)]">{selectedReg.year_of_study}</span></div>
              <div><span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider font-bold">Tracks</span><span className="text-[var(--text-main)]">{(selectedReg.track || []).join(', ')}</span></div>
              <div><span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider font-bold">Events</span><span className="text-[var(--text-main)]">{(selectedReg.events_selected || []).join(', ')}</span></div>
              <div><span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider font-bold">Amount Due</span><span className="text-[var(--brand-primary)] font-bold">₹{selectedReg.amount_due}</span></div>
              <div><span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider font-bold">Payment Ref</span><span className="text-[var(--text-main)]">{selectedReg.payment_reference || '—'}</span></div>
            </div>

            {selectedReg.is_team && selectedReg.team_members?.length > 0 && (
              <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] space-y-2 text-xs jb-mono">
                <span className="font-bold text-[var(--text-main)] uppercase tracking-wider text-[10px]">Team Members</span>
                {selectedReg.team_members.map((m, idx) => (
                  <div key={idx} className="text-[var(--text-muted)]">#{idx+2}: <strong className="text-[var(--text-main)]">{m.name}</strong> ({m.email || 'N/A'})</div>
                ))}
              </div>
            )}

            {/* Status Actions */}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[10px] text-[var(--text-muted)] jb-mono uppercase tracking-wider font-bold mr-2">Set Status:</span>
              <button onClick={() => handleStatusChange(selectedReg.id, 'paid')} className="px-3 py-1.5 rounded-lg bg-[var(--accent-emerald-bg)] text-[var(--accent-emerald)] text-[10px] font-bold jb-mono uppercase hover:opacity-80 transition-all border border-[var(--accent-emerald)]/20">Mark Paid</button>
              <button onClick={() => handleStatusChange(selectedReg.id, 'pending')} className="px-3 py-1.5 rounded-lg bg-[var(--badge-bg)] text-[var(--brand-primary)] text-[10px] font-bold jb-mono uppercase hover:opacity-80 transition-all border border-[var(--brand-primary)]/20">Mark Pending</button>
              <button onClick={() => handleStatusChange(selectedReg.id, 'failed')} className="px-3 py-1.5 rounded-lg bg-[var(--accent-crimson-glow)] text-[var(--accent-crimson)] text-[10px] font-bold jb-mono uppercase hover:opacity-80 transition-all border border-[var(--accent-crimson)]/20">Mark Failed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
