import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import {
  BarChart3, LayoutDashboard, Receipt, Sparkles, Plus, LogOut, Home,
  Search, Bell, TrendingUp, PlusCircle, MinusCircle, Utensils,
  Gamepad2, Bus, ShoppingBag, HeartPulse, BookOpen, Smartphone, Briefcase, Gift, Trash2, X, ArrowUpCircle, ArrowDownCircle, Sun, Moon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement);

const CATS = {
  Food: { icon: Utensils, color: '#ff86c3' },
  Entertainment: { icon: Gamepad2, color: '#ac8aff' },
  Transport: { icon: Bus, color: '#5bf4de' },
  Shopping: { icon: ShoppingBag, color: '#fbbf24' },
  Health: { icon: HeartPulse, color: '#34d399' },
  Education: { icon: BookOpen, color: '#60a5fa' },
  Subscriptions: { icon: Smartphone, color: '#f87171' },
  Work: { icon: Briefcase, color: '#a78bfa' },
  Gift: { icon: Gift, color: '#fb923c' },
  Other: { icon: Sparkles, color: '#94a3b8' }
};

const getCatColor = (catName) => {
  if (CATS[catName]) return CATS[catName].color;
  let hash = 0;
  for (let i = 0; i < catName.length; i++) hash = catName.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 85%, 65%)`;
};

// Generate N maximally-distinct colors using golden-angle hue spacing
const DISTINCT_PALETTE = [
  '#5bf4de','#ff86c3','#ac8aff','#fbbf24','#34d399',
  '#60a5fa','#f87171','#fb923c','#a3e635','#e879f9',
  '#06b6d4','#f43f5e','#2dd4bf','#8b5cf6','#f59e0b',
  '#14b8a6','#ec4899','#6366f1','#84cc16','#0ea5e9',
  '#d946ef','#10b981','#f97316','#7c3aed','#eab308',
  '#22d3ee','#db2777','#4f46e5','#65a30d','#0284c7'
];
const getChartColor = (index) => {
  if (index < DISTINCT_PALETTE.length) return DISTINCT_PALETTE[index];
  // Beyond palette: use golden angle to maximize hue distance
  const hue = ((index - DISTINCT_PALETTE.length) * 137.508) % 360;
  const lightness = 55 + (index % 3) * 10; // vary lightness too
  return `hsl(${hue}, 80%, ${lightness}%)`;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, formatAmount, formatShort } = useCurrency();

  const [entries, setEntries] = useState([]);
  const [activePage, setActivePage] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('income');
  const [searchQ, setSearchQ] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [chartView, setChartView] = useState('week');

  // Form state
  const [mAmount, setMAmount] = useState('');
  const [mCategory, setMCategory] = useState('Work');
  const [mCustomCategory, setMCustomCategory] = useState('');
  const [mDate, setMDate] = useState(new Date().toISOString().split('T')[0]);
  const [mNote, setMNote] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "entries"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  const submitEntry = async () => {
    const amt = parseFloat(mAmount);
    if (!amt || amt <= 0 || !mDate) return alert('Valid info required');

    const finalCategory = mCategory === 'Other' && mCustomCategory.trim() ? mCustomCategory.trim() : mCategory;

    await addDoc(collection(db, "users", user.uid, "entries"), {
      type: modalType,
      amount: amt,
      category: finalCategory,
      date: mDate,
      note: mNote.trim(),
      currency
    });

    setMAmount('');
    setMNote('');
    setMCustomCategory('');
    setIsModalOpen(false);
  };

  const deleteEntry = async (id) => {
    await deleteDoc(doc(db, "users", user.uid, "entries", id));
  };

  const getFilteredEntries = () => {
    if (!searchQ) return entries;
    const lq = searchQ.toLowerCase();
    return entries.filter(e => {
      const noteStr = e.note ? e.note.toLowerCase() : '';
      const catStr = e.category ? e.category.toLowerCase() : '';
      return noteStr.includes(lq) || catStr.includes(lq);
    });
  };

  // Basic stats
  const totalIn = entries.filter(e => e.type === 'income').reduce((a, e) => a + e.amount, 0);
  const totalOut = entries.filter(e => e.type === 'expense').reduce((a, e) => a + e.amount, 0);
  const balance = totalIn - totalOut;

  const isThisWeek = (ds) => {
    const now = new Date();
    const day = (now.getDay() + 6) % 7;
    const start = new Date(now); start.setDate(now.getDate() - day); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
    const d = new Date(ds + 'T00:00:00');
    return d >= start && d <= end;
  };

  const weekIn = entries.filter(e => e.type === 'income' && isThisWeek(e.date)).reduce((a, e) => a + e.amount, 0);
  const weekOut = entries.filter(e => e.type === 'expense' && isThisWeek(e.date)).reduce((a, e) => a + e.amount, 0);
  const rate = weekIn > 0 ? Math.round(((weekIn - weekOut) / weekIn) * 100) : 0;

  // Chart Logic
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)); weekStart.setHours(0, 0, 0, 0);
  const chartInData = days.map((_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return entries.filter(e => e.type === 'income' && e.date === ds).reduce((a, e) => a + e.amount, 0);
  });
  const chartOutData = days.map((_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return entries.filter(e => e.type === 'expense' && e.date === ds).reduce((a, e) => a + e.amount, 0);
  });

  const chartOptions = {
    responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.85)' }, grid: { display: false } },
      y: { ticks: { color: 'rgba(255,255,255,0.85)', callback: v => formatShort(v) }, grid: { color: 'rgba(255,255,255,0.1)' }, border: { display: false } }
    }
  };

  const chartData = {
    labels: days,
    datasets: [
      { label: 'Income', data: chartInData, backgroundColor: '#5bf4de', borderRadius: 12, barThickness: 18, borderSkipped: false },
      { label: 'Spending', data: chartOutData, backgroundColor: 'rgba(172,138,255,0.8)', borderRadius: 12, barThickness: 18, borderSkipped: false }
    ]
  };

  // Daily Spending logic — all expenses for today, no limit
  const todayStr = new Date().toISOString().split('T')[0];
  const todayExp = entries.filter(e => e.type === 'expense' && e.date === todayStr);
  const dTotal = todayExp.reduce((a, e) => a + e.amount, 0);
  const byCat = {};
  todayExp.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  // Use getChartColor for both donut AND legend to stay in sync
  const donutData = {
    labels: sortedCats.map(c => c[0]),
    datasets: [{ data: sortedCats.map(c => c[1]), backgroundColor: sortedCats.map((_, i) => getChartColor(i)), borderWidth: 0 }]
  };
  const donutOptions = { cutout: '65%', plugins: { legend: { display: false } } };

  // Monthly totals for insights (kept separate)
  const isThisMonth = (ds) => { const n = new Date(), t = new Date(ds + 'T00:00:00'); return t.getMonth() === n.getMonth() && t.getFullYear() === n.getFullYear(); };
  const monthExp = entries.filter(e => e.type === 'expense' && isThisMonth(e.date));
  const mTotal = monthExp.reduce((a, e) => a + e.amount, 0);
  const monthlyCats = {};
  monthExp.forEach(e => { monthlyCats[e.category] = (monthlyCats[e.category] || 0) + e.amount; });
  const monthSortedCats = Object.entries(monthlyCats).sort((a, b) => b[1] - a[1]);

  // Analytics Logic
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    months.push(d);
  }
  const mLabels = months.map(m => m.toLocaleString('default', { month: 'short' }));

  const mIn = months.map(m => entries.filter(e => e.type === 'income' && new Date(e.date + 'T00:00:00').getMonth() === m.getMonth() && new Date(e.date + 'T00:00:00').getFullYear() === m.getFullYear()).reduce((a, e) => a + e.amount, 0));
  const mOut = months.map(m => entries.filter(e => e.type === 'expense' && new Date(e.date + 'T00:00:00').getMonth() === m.getMonth() && new Date(e.date + 'T00:00:00').getFullYear() === m.getFullYear()).reduce((a, e) => a + e.amount, 0));

  const chartMonthData = {
    labels: mLabels,
    datasets: [
      { label: 'Savings', data: mIn.map((inc, i) => inc - mOut[i]), backgroundColor: '#5bf4de', borderRadius: 12, barThickness: 18, borderSkipped: false },
      { label: 'Expenses', data: mOut, backgroundColor: 'rgba(172,138,255,0.8)', borderRadius: 12, barThickness: 18, borderSkipped: false }
    ]
  };

  const analyticsLineData = {
    labels: mLabels,
    datasets: [
      { label: 'Income', data: mIn, borderColor: '#5bf4de', backgroundColor: 'rgba(91,244,222,0.08)', tension: 0.4, fill: true },
      { label: 'Spending', data: mOut, borderColor: '#ff86c3', backgroundColor: 'rgba(255,134,195,0.08)', tension: 0.4, fill: true }
    ]
  };

  const allByCat = {};
  entries.filter(e => e.type === 'expense').forEach(e => { allByCat[e.category] = (allByCat[e.category] || 0) + e.amount; });
  const allCats = Object.entries(allByCat).sort((a, b) => b[1] - a[1]);
  const allCatLabels = allCats.map(c => c[0]);
  const allCatData = allCats.map(c => c[1]);
  // Use getChartColor (distinct palette) for analytics too — never duplicate
  const allCatColors = allCatLabels.map((_, i) => getChartColor(i));

  const analyticsDonutData = {
    labels: allCatLabels.length ? allCatLabels : ['No data'],
    datasets: [{ data: allCatData.length ? allCatData : [1], backgroundColor: allCatData.length ? allCatColors : ['rgba(255,255,255,0.06)'], borderWidth: 0 }]
  };

  const customCats = Array.from(new Set(entries.map(e => e.category))).filter(c => !CATS[c]);
  const dropdownCats = [...Object.keys(CATS).filter(c => c !== 'Other'), ...customCats, 'Other'];

  return (
    <div id="app" className="visible">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div>
          <div className="app-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Logo size={36} />
            Where it Went?
          </div>
          <div className="app-tagline">Financial Dashboard</div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
          <div className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}><LayoutDashboard size={18} /><span>Dashboard</span></div>
          <div className={`nav-item ${activePage === 'history' ? 'active' : ''}`} onClick={() => setActivePage('history')}><Receipt size={18} /><span>Transactions</span></div>
          <div className={`nav-item ${activePage === 'analytics' ? 'active' : ''}`} onClick={() => setActivePage('analytics')}><BarChart3 size={18} /><span>Analytics</span></div>
        </nav>
        <div className="sidebar-spacer"></div>
        <div className="currency-select-wrap">
          <div className="currency-label">Currency</div>
          <select className="currency-select" value={currency} onChange={e => setCurrency(e.target.value)}>
            <option value="INR">🇮🇳 INR — ₹</option>
            <option value="USD">🇺🇸 USD — $</option>
            <option value="EUR">🇪🇺 EUR — €</option>
            <option value="GBP">🇬🇧 GBP — £</option>
          </select>
        </div>
        <button className="add-txn-btn" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Add Transaction</button>
        <div className="sidebar-bottom-nav">
          <div className="nav-item" onClick={() => navigate('/')}><Home size={18} /><span>Return to Home</span></div>
          <div className="nav-item" onClick={logout}><LogOut size={18} /><span>Log Out</span></div>
        </div>
      </aside>

      {/* TOPBAR */}
      <header className="topbar">
        <nav className="topbar-nav">
          <a href="#" className={activePage === 'dashboard' ? 'active' : ''} onClick={() => setActivePage('dashboard')}>Overview</a>
          <a href="#" className={activePage === 'history' ? 'active' : ''} onClick={() => setActivePage('history')}>History</a>
          <a href="#" className={activePage === 'analytics' ? 'active' : ''} onClick={() => setActivePage('analytics')}>Analytics</a>
        </nav>
        <div className="topbar-right">
          <div className="search-wrap">
            <Search className="search-icon" size={16} />
            <input type="text" className="search-input" placeholder="Search transactions…" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          </div>
          <div style={{ position: 'relative' }}>
            <div className="user-avatar" onClick={() => setIsProfileOpen(!isProfileOpen)} style={{ cursor: 'pointer' }}>{user.avatar}</div>
            {isProfileOpen && (
              <div className="glass" style={{ position: 'absolute', top: '48px', right: '0', padding: '16px', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 100, borderRadius: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>{user.name || 'User'}</div>
                <div style={{ fontSize: '12px', color: 'var(--on-surface-var)' }}>{user.email}</div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--outline-var)' }} />
                <button onClick={logout} style={{ color: 'var(--tertiary)', textAlign: 'left', padding: '4px 0', fontSize: '13px', fontWeight: '600' }}>Log Out safely</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <div className="page-inner">

          {activePage === 'dashboard' && (
            <div className="app-page active">
              <div className="balance-section">
                <div>
                  <div className="balance-eyebrow">Total Liquidity</div>
                  <div className="balance-amount" style={{ color: balance >= 0 ? 'var(--on-surface)' : 'var(--tertiary)' }}>
                    {formatAmount(balance)}
                  </div>
                  <div className="balance-growth" style={{ color: rate >= 0 ? 'var(--primary)' : 'var(--tertiary)' }}>
                    <TrendingUp size={18} />
                    <span>{rate >= 0 ? '+' : ''}{rate}%</span>
                  </div>
                </div>
                <div className="quick-actions">
                  <button className="quick-action-btn" onClick={() => { setModalType('income'); setIsModalOpen(true); }}>
                    <div className="qa-icon" style={{ background: 'rgba(91,244,222,0.12)', color: 'var(--primary)' }}><PlusCircle size={20} /></div>
                    <div><div className="qa-label">Income</div><div className="qa-title">Quick Log</div></div>
                  </button>
                  <button className="quick-action-btn" onClick={() => { setModalType('expense'); setIsModalOpen(true); }}>
                    <div className="qa-icon" style={{ background: 'rgba(255,134,195,0.12)', color: 'var(--tertiary)' }}><MinusCircle size={20} /></div>
                    <div><div className="qa-label">Expense</div><div className="qa-title">Quick Log</div></div>
                  </button>
                </div>
              </div>

              <div className="bento">
                <div className="col-8 glass chart-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                      <div className="card-title">{chartView === 'week' ? 'Weekly Momentum' : 'Monthly Momentum'}</div>
                      <div className="card-sub" style={{ marginBottom: 0 }}>{chartView === 'week' ? 'Your cash flow for the last 7 days' : 'Savings and expenses over 6 months'}</div>
                    </div>
                    <div className="toggle-group">
                      <button className={`toggle-btn ${chartView === 'week' ? 'active' : ''}`} onClick={() => setChartView('week')}>WEEK</button>
                      <button className={`toggle-btn ${chartView === 'month' ? 'active' : ''}`} onClick={() => setChartView('month')}>MONTH</button>
                    </div>
                  </div>
                  <div style={{ height: '220px' }}>
                    <Bar data={chartView === 'week' ? chartData : chartMonthData} options={chartOptions} />
                  </div>
                </div>

                <div className="col-4 glass-purple insights-card">
                  <div className="insights-eyebrow"><Sparkles size={14} /> Budgeting Insights</div>
                  {monthSortedCats.length > 0 ? (
                    <>
                      <div className="insights-headline">You spent {Math.round((monthSortedCats[0][1] / mTotal) * 100)}% of your budget on {monthSortedCats[0][0]}.</div>
                      <div className="insights-body">Based on your entries this month, {monthSortedCats[0][0]} is your top spending category at {formatShort(monthSortedCats[0][1])}. Consider setting a monthly cap to stay on track.</div>
                    </>
                  ) : (
                    <>
                      <div className="insights-headline">Log some entries to get insights.</div>
                      <div className="insights-body">Once you start tracking your income and spending, we'll generate personalised budgeting suggestions here.</div>
                    </>
                  )}
                </div>

                <div className="col-5 glass anatomy-card">
                  <div className="card-title" style={{ marginBottom: '20px' }}>Daily Spending</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div className="donut-wrap">
                      <div style={{ height: '120px', width: '120px' }}><Doughnut data={donutData} options={donutOptions} /></div>
                      <div className="donut-center">
                        <div className="donut-center-label">Total</div>
                        <div className="donut-center-val">{formatShort(dTotal)}</div>
                      </div>
                    </div>
                    <div className="cat-legend">
                      {sortedCats.length === 0 && <div style={{ fontSize: '13px', color: 'var(--on-surface-var)' }}>No expenses today.</div>}
                      {sortedCats.map((c, i) => (
                        <div className="cat-item" key={c[0]}>
                          <div className="cat-dot" style={{ background: getChartColor(i) }}></div>
                          <div className="cat-name">{c[0]}</div>
                          <div className="cat-pct">{dTotal > 0 ? Math.round((c[1] / dTotal) * 100) : 0}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-7 glass txn-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div className="card-title">Movement History</div>
                    <button style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans',sans-serif" }} onClick={() => setActivePage('history')}>View All</button>
                  </div>
                  <div>
                    {getFilteredEntries().slice(0, 6).map(e => {
                      const CIcon = CATS[e.category]?.icon || Sparkles;
                      const catColor = getCatColor(e.category);
                      const isInc = e.type === 'income';
                      return (
                        <div className="txn-item" key={e.id}>
                          <div className="txn-icon-wrap" style={{ background: `${catColor}20`, color: catColor }}>
                            <CIcon size={18} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="txn-name">{e.note || e.category}</div>
                            <div className="txn-meta">{e.category} • {new Date(e.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className={`txn-amount ${isInc ? 'pos' : 'neg'}`}>{isInc ? '+' : '-'}{formatAmount(e.amount)}</div>
                          </div>
                        </div>
                      )
                    })}
                    {getFilteredEntries().length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: 'var(--on-surface-var)', fontSize: '14px' }}>No transactions yet.</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 'history' && (
            <div className="app-page active">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                  <h2 className="headline" style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em' }}>Transactions</h2>
                </div>
                <button className="add-txn-btn" style={{ width: 'auto', padding: '12px 24px' }} onClick={() => setIsModalOpen(true)}>
                  <Plus size={16} /> Add Entry
                </button>
              </div>
              <div className="all-txn-card">
                {getFilteredEntries().map(e => {
                  const CIcon = CATS[e.category]?.icon || Sparkles;
                  const catColor = getCatColor(e.category);
                  const isInc = e.type === 'income';
                  return (
                    <div className="txn-item" key={e.id}>
                      <div className="txn-icon-wrap" style={{ background: `${catColor}20`, color: catColor }}>
                        <CIcon size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="txn-name">{e.note || e.category}</div>
                        <div className="txn-meta">{e.category} • {new Date(e.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                      </div>
                      <div style={{ textAlign: 'right', paddingRight: '16px' }}>
                        <div className={`txn-amount ${isInc ? 'pos' : 'neg'}`}>{isInc ? '+' : '-'}{formatAmount(e.amount)}</div>
                      </div>
                      <button className="delete-btn" onClick={() => deleteEntry(e.id)}><Trash2 size={13} /></button>
                    </div>
                  )
                })}
                {getFilteredEntries().length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: 'var(--on-surface-var)', fontSize: '14px' }}>No transactions yet.</div>}
              </div>
            </div>
          )}

          {activePage === 'analytics' && (
            <div className="app-page active">
              <div style={{ marginBottom: '28px' }}>
                <h2 className="headline" style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em' }}>Analytics</h2>
                <p style={{ fontSize: '14px', color: 'var(--on-surface-var)', marginTop: '4px' }}>Deep patterns in your financial data</p>
              </div>
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-label">This Month's Spend</div>
                  <div className="stat-val neg">{formatAmount(mTotal)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Top Category</div>
                  <div className="stat-val" style={{ fontSize: '20px' }}>{monthSortedCats[0] ? monthSortedCats[0][0] : '—'}</div>
                </div>
              </div>

              <div className="bento">
                <div className="col-8 glass chart-card">
                  <div className="card-title">Monthly Trend</div>
                  <div className="card-sub">Income vs. spending over 6 months</div>
                  <div style={{ height: '260px' }}>
                    <Line data={analyticsLineData} options={chartOptions} />
                  </div>
                </div>
                <div className="col-4 glass chart-card">
                  <div className="card-title">Category Breakdown</div>
                  <div className="card-sub">All-time expenses by type</div>
                  <div style={{ height: '220px' }}>
                    <Doughnut data={analyticsDonutData} options={{ maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.85)', boxWidth: 12, padding: 12 } } } }} />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target.className.includes('modal-overlay')) setIsModalOpen(false) }}>
          <div className="modal-box">
            <div className="modal-title">Log a Transaction</div>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={16} /></button>
            <div className="type-toggle">
              <div className={`type-btn inc ${modalType === 'income' ? 'active' : ''}`} onClick={() => { setModalType('income'); setMCategory('Work') }}>
                <ArrowUpCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Income
              </div>
              <div className={`type-btn exp ${modalType === 'expense' ? 'active' : ''}`} onClick={() => { setModalType('expense'); setMCategory('Food') }}>
                <ArrowDownCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Expense
              </div>
            </div>
            <div className="form-grid">
              <div className="form-field full">
                <div className="field-label">Amount ({currency})</div>
                <input className="field-input" type="number" value={mAmount} onChange={e => setMAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" />
              </div>
              <div className="form-field">
                <div className="field-label">Category</div>
                <select className="field-input" value={mCategory} onChange={e => setMCategory(e.target.value)}>
                  {dropdownCats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {mCategory === 'Other' && (
                <div className="form-field full">
                  <div className="field-label">Specify Other Category</div>
                  <input className="field-input" type="text" value={mCustomCategory} onChange={e => setMCustomCategory(e.target.value)} placeholder="e.g. Pet Supplies" />
                </div>
              )}
              <div className="form-field">
                <div className="field-label">Date</div>
                <input className="field-input" type="date" value={mDate} onChange={e => setMDate(e.target.value)} />
              </div>
              <div className="form-field full">
                <div className="field-label">Note (optional)</div>
                <input className="field-input" type="text" value={mNote} onChange={e => setMNote(e.target.value)} placeholder="What was this for?" />
              </div>
            </div>
            <button className="submit-btn" onClick={submitEntry}>Add Entry</button>
          </div>
        </div>
      )}
    </div>
  );
}
