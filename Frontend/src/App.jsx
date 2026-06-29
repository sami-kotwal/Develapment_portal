import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function formatDate(dateValue) {
  if (!dateValue) return 'Not set'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    .format(new Date(`${dateValue}T00:00:00`))
}

function daysUntil(dateValue) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateValue}T00:00:00`)
  return Math.round((target - today) / 86400000)
}

function daysSince(dateValue) {
  if (!dateValue) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const normalized = String(dateValue).slice(0, 10)
  const target = new Date(`${normalized}T00:00:00`)
  return Math.floor((today - target) / 86400000)
}

function dateInputValue(dateValue) {
  return dateValue ? String(dateValue).slice(0, 10) : ''
}

function isPastFifteenDays(dateValue) {
  return Boolean(dateValue) && daysSince(dateValue) >= 15
}

function getDomainStatus(domain) {
  const days = daysUntil(domain.expiry)
  if (days < 0) return 'Expired'
  if (days <= 30) return 'Expiring'
  return 'Active'
}

function toWebsite(domain, fallbackDeveloper = 'Mahad') {
  return {
    name: domain.name,
    domain: domain.name,
    status: domain.websiteStatus,
    hosting: domain.hosting,
    email: domain.email,
    emailCount: domain.emailCount || 0,
    developer: domain.developer || fallbackDeveloper,
    websiteUrl: domain.websiteUrl || '',
    logoImage: domain.logoImage || '',
    liveSince: domain.liveSince ? formatDate(domain.liveSince.slice(0, 10)) : 'Not set',
    downSince: domain.downSince ? formatDate(domain.downSince.slice(0, 10)) : 'Not set',
    careUpdateEnabled: domain.careUpdateEnabled,
    careUpdateAt: domain.careUpdateAt,
    wordfenceDate: domain.wordfenceDate,
    recaptchaEnabled: domain.recaptchaEnabled,
    backupEnabled: domain.backupEnabled,
  }
}

const pageMeta = {
  dashboard: { eyebrow: 'OVERVIEW', title: 'Welcome back', subtitle: 'Here’s what’s happening with your domains today.' },
  domains: { eyebrow: 'DOMAIN MANAGEMENT', title: 'Your domains', subtitle: 'Manage, renew, and monitor all of your domains in one place.' },
  liveWebsites: { eyebrow: 'WEBSITE MANAGEMENT', title: 'Websites', subtitle: 'Manage hosting, developers, email accounts, and website availability.' },
  portfolio: { eyebrow: 'PORTFOLIO', title: 'Portfolio', subtitle: 'Track live websites, updates, Wordfence checks, Recaptcha, and assigned developers.' },
  subdomains: { eyebrow: 'DNS MANAGEMENT', title: 'Subdomains', subtitle: 'View and manage subdomains connected to your portfolio.' },
  notifications: { eyebrow: 'INBOX', title: 'Notifications', subtitle: 'Updates, reminders, and activity from your domain portfolio.' },
}

function userDisplayName(user) {
  return user?.name || 'User'
}

function userFirstName(user) {
  return userDisplayName(user).split(' ')[0]
}

function userInitials(user) {
  return userDisplayName(user)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U'
}

function isTeamLeadUser(user) {
  return user?.username === 'mahad' || user?.email === 'mahad@northstar.dev'
}

function Icon({ name, size = 20 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    dots: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    activity: <path d="M3 12h4l2-6 4 12 2-6h6"/>,
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></>,
    monitor: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>,
    portfolio: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18"/></>,
    archive: <><path d="M4 7h16v14H4z"/><path d="M3 3h18v4H3zM9 11h6"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    zap: <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/>,
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function AytechLogo({ compact = false }) {
  return (
    <div className={`aytech-logo ${compact ? 'compact' : ''}`}>
      <svg className="aytech-symbol" viewBox="0 0 72 58" aria-hidden="true">
        <path d="M4 34 20 8h12l8 13-8 12-8-13-10 17H4Z" fill="#3696ff" />
        <path d="m29 27 9 14h12l17-27H55L44 31l-8-13-7 9Z" fill="#ff0758" />
        <path d="m22 39 8 13h14l8-13H40l-4 6-4-6H22Z" fill="#f7b928" />
      </svg>
      <div className="aytech-wordmark">
        <strong>AY TECH</strong>
        {!compact && <small>Development team</small>}
      </div>
    </div>
  )
}

function Login({ onLogin, notice }) {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(event.currentTarget)

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: form.get('identifier'),
          password: form.get('password'),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to sign in.')
      }

      onLogin(data)
    } catch (requestError) {
      setError(requestError.message === 'Failed to fetch'
        ? 'Backend se connection nahi ho raha. Backend server start karein.'
        : requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-dev-aura" aria-hidden="true">
          <span>const portal = secure()</span>
          <span>deploy --team aytech</span>
          <span>status: operational</span>
        </div>
        <div className="login-brand">
          <AytechLogo />
        </div>
        <div className="login-copy">
          <span className="eyebrow">WELCOME BACK</span>
          <h1>Sign in to your account</h1>
          <p>Manage your domains, renewals, and notifications from one simple workspace.</p>
        </div>
        <form onSubmit={submit}>
          <label>
            Username or email
            <input name="identifier" type="text" placeholder="samiullah" defaultValue="samiullah" required />
          </label>
          <label>
            <span className="label-row"><span>Password</span><a href="#forgot">Forgot password?</a></span>
            <div className="password-wrap">
              <input name="password" type={showPassword ? 'text' : 'password'} defaultValue="samiullah" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
          </label>
          <label className="remember"><input type="checkbox" defaultChecked /> Keep me signed in</label>
          {notice && <div className="login-error">{notice}</div>}
          {error && <div className="login-error">{error}</div>}
          <button className="primary-btn login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'} {!loading && <Icon name="arrow" size={18} />}
          </button>
        </form>
        <p className="login-help">Need help? <a href="mailto:support@domainly.dev">Contact support</a></p>
      </section>
      <aside className="login-visual">
        <div className="visual-orbit orbit-one" />
        <div className="visual-orbit orbit-two" />
        <div className="login-visual-content">
          <div className="visual-icon"><Icon name="globe" size={34} /></div>
          <h2>Everything your domains need. One calm place.</h2>
          <p>Track renewals, DNS health, and important updates without hopping between registrars.</p>
          <div className="visual-card">
            <div><span className="pulse-dot" /><strong>All systems operational</strong></div>
            <span>Secure database sync</span>
          </div>
        </div>
      </aside>
    </main>
  )
}

function Sidebar({ activePage, setActivePage, mobileOpen, setMobileOpen, onLogout, unreadCount, onOpenNotifications, user }) {
  const items = [
    ['dashboard', 'grid', 'Dashboard'],
    ['domains', 'globe', 'Domains'],
    ['liveWebsites', 'monitor', 'Websites'],
    ['portfolio', 'portfolio', 'Portfolio'],
    ['subdomains', 'activity', 'Subdomains'],
    ['notifications', 'bell', 'Notifications'],
  ]

  return (
    <>
      {mobileOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <AytechLogo />
          <button className="mobile-close" onClick={() => setMobileOpen(false)}><Icon name="close" /></button>
        </div>
        <nav>
          <span className="nav-label">WORKSPACE</span>
          {items.map(([id, icon, label]) => (
            <button key={id} className={activePage === id ? 'active' : ''} onClick={() => {
              if (id === 'notifications') onOpenNotifications()
              else setActivePage(id)
              setMobileOpen(false)
            }}>
              <Icon name={icon} size={19} /><span>{label}</span>
              {id === 'notifications' && unreadCount > 0 && <em>{unreadCount}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="user-card" onClick={onLogout}>
            <span className="avatar">{userInitials(user)}</span>
            <span><strong>{userDisplayName(user)}</strong><small>Development Team Lead</small></span>
            <Icon name="logout" size={17} />
          </button>
        </div>
      </aside>
    </>
  )
}

function Header({ setMobileOpen, unreadCount, onOpenNotifications, user, searchValue, onSearchChange, onLogout }) {
  const [accountOpen, setAccountOpen] = useState(false)

  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={() => setMobileOpen(true)}><Icon name="menu" /></button>
      <div className="portal-title"><strong>AY TECH PORTAL</strong><small>Domain management system</small></div>
      <div className="search"><Icon name="search" size={18} /><input value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search domains, websites..." /></div>
      <div className="topbar-actions">
        <button className="icon-btn notification-button" aria-label="Notifications" onClick={onOpenNotifications}>
          <Icon name="bell" size={19} />{unreadCount > 0 && <span />}
        </button>
        <div className="account-menu-wrap">
          <button className={`topbar-user ${accountOpen ? 'open' : ''}`} onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen} aria-haspopup="menu">
            <span className="avatar">{userInitials(user)}</span>
            <div><strong>{userDisplayName(user)}</strong><small>Development Team Lead</small></div>
            <Icon name="chevron" size={15} />
          </button>
          {accountOpen && (
            <>
              <button className="account-menu-backdrop" aria-label="Close account menu" onClick={() => setAccountOpen(false)} />
              <div className="account-menu" role="menu">
                <button role="menuitem" onClick={() => { setAccountOpen(false); onLogout() }}>
                  <Icon name="logout" size={15} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function StatusPill({ status }) {
  return <span className={`status-pill ${status.toLowerCase()}`}><i />{status}</span>
}

function Dashboard({ setActivePage, onOpenNotifications, domains, websites, subdomains, notifications }) {
  const expiredCount = domains.filter((domain) => getDomainStatus(domain) === 'Expired').length
  const expiringCount = domains.filter((domain) => getDomainStatus(domain) === 'Expiring').length
  const stats = [
    { label: 'Total domains', value: String(domains.length), note: 'Across your hosting providers', icon: 'globe', tone: 'blue', page: 'domains' },
    { label: 'Down websites', value: String(websites.filter((website) => website.status === 'Down').length), note: 'Requires your attention', icon: 'activity', tone: 'red', page: 'liveWebsites' },
    { label: 'Expired domains', value: String(expiredCount), note: 'Action may be required', icon: 'archive', tone: 'orange', page: 'domains' },
    { label: 'Live websites', value: String(websites.filter((website) => website.status === 'Live').length), note: 'All websites operational', icon: 'monitor', tone: 'green', page: 'liveWebsites' },
    { label: 'Subdomains', value: String(subdomains.length), note: subdomains.length ? 'Managed subdomain projects' : 'No subdomains added', icon: 'activity', tone: 'purple', page: 'subdomains' },
    { label: 'Expiring soon', value: String(expiringCount), note: 'Within the next 30 days', icon: 'clock', tone: 'orange', page: 'domains' },
    { label: 'Unread alerts', value: String(notifications.filter((item) => item.unread).length), note: 'Latest domain activity', icon: 'bell', tone: 'purple', page: 'notifications' },
  ]

  return (
    <>
      <div className="stat-grid">
        {stats.map((stat) => (
          <article className={`stat-card ${stat.page ? 'clickable' : ''}`} key={stat.label} onClick={() => stat.page === 'notifications' ? onOpenNotifications() : stat.page && setActivePage(stat.page)}>
            <div className={`stat-icon ${stat.tone}`}><Icon name={stat.icon} size={21} /></div>
            <span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.note}</small>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="content-card domains-preview">
          <div className="card-heading"><div><h2>Domain overview</h2><p>Your most recently updated domains.</p></div><button className="text-btn" onClick={() => setActivePage('domains')}>View all <Icon name="arrow" size={15} /></button></div>
          <div className="domain-list">
            {domains.slice(0, 4).map((domain) => (
              <div className="domain-row" key={domain.name}>
                <div className="domain-symbol"><Icon name="globe" size={18} /></div>
                <div className="domain-name"><strong>{domain.name}</strong><span>{domain.hosting}</span></div>
                <StatusPill status={getDomainStatus(domain)} />
                <div className="expiry"><span>Expires</span><strong>{formatDate(domain.expiry)}</strong></div>
                <button className="more-btn"><Icon name="dots" /></button>
              </div>
            ))}
            {domains.length === 0 && <div className="compact-empty">No domains added yet.</div>}
          </div>
        </section>
        <section className="content-card activity-card">
          <div className="card-heading"><div><h2>Recent activity</h2><p>Latest account updates.</p></div></div>
          <div className="activity-list">
            {notifications.slice(0, 3).map((item, index) => (
              <div className="activity-item" key={item.id || `${item.title}-${index}`}>
                <span className={`activity-icon ${item.type}`}><Icon name={item.type === 'warning' ? 'clock' : item.type === 'success' ? 'check' : 'shield'} size={17} /></span>
                <div><strong>{item.title}</strong><p>{item.text}</p><small>{item.time}</small></div>
              </div>
            ))}
            {notifications.length === 0 && <div className="compact-empty">No recent notifications.</div>}
          </div>
        </section>
      </div>
    </>
  )
}

function DomainFormModal({ domain, onClose, onSave, defaultDeveloper = 'Mahad' }) {
  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSave({
      id: domain?.id || `domain-${Date.now()}`,
      name: String(form.get('name')).trim().toLowerCase(),
      hosting: String(form.get('hosting')).trim(),
      expiry: form.get('expiry'),
      emailCount: Math.max(0, Number(form.get('emailCount') || 0)),
      developer: form.get('developer'),
      websiteUrl: String(form.get('websiteUrl') || '').trim(),
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="domain-modal" role="dialog" aria-modal="true" aria-labelledby="domain-form-title">
        <div className="modal-heading">
          <div><span className="eyebrow">DOMAIN DETAILS</span><h2 id="domain-form-title">{domain ? 'Edit domain' : 'Add new domain'}</h2><p>Save the domain information used across your portal.</p></div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" size={19} /></button>
        </div>
        <form onSubmit={submit}>
          <label>Domain name<input name="name" defaultValue={domain?.name || ''} placeholder="example.com" required /></label>
          <label>Hosting provider<input name="hosting" defaultValue={domain?.hosting || ''} placeholder="Verpex, Hostinger, Vercel..." required /></label>
          <label>Expiration date<input name="expiry" type="date" defaultValue={domain?.expiry || ''} required /></label>
          <label>Email accounts<input name="emailCount" type="number" min="0" defaultValue={domain?.emailCount || 0} placeholder="0" /></label>
          <label>Developer
            <select name="developer" defaultValue={domain?.developer || defaultDeveloper}>
              <option value="Mahad">Mahad</option>
              <option value="Usman">Usman</option>
              <option value="Samiullah">Samiullah</option>
            </select>
          </label>
          <label className="full-field">Website homepage URL<input name="websiteUrl" type="url" defaultValue={domain?.websiteUrl || ''} placeholder="https://example.com" /></label>
          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn">{domain ? 'Save changes' : 'Add domain'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function DomainTable({ items, websites, emptyMessage = 'No domains found.', header, onEdit, onTag, onDelete, canManage = false, searchQuery = '', onSearchChange = () => {} }) {
  const [openMenu, setOpenMenu] = useState(null)
  const filtered = useMemo(() => items.filter((domain) => {
    const term = searchQuery.toLowerCase()
    return [
      domain.name,
      domain.hosting,
      domain.developer,
      domain.websiteStatus,
      getDomainStatus(domain),
    ].some((value) => String(value || '').toLowerCase().includes(term))
  }), [items, searchQuery])

  return (
    <section className="content-card domain-page-card">
      {header}
      <div className="table-toolbar">
        <div className="table-search"><Icon name="search" size={17} /><input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search your domains" /></div>
        <button className="filter-btn">All statuses <Icon name="chevron" size={14} /></button>
      </div>
      <div className="domains-table">
        <div className="table-row table-head domain-table-row"><span>#</span><span>Domain</span><span>Status</span><span>Hosting</span><span>Expiration</span><span>Email</span><span>{canManage ? 'Actions' : ''}</span></div>
        {filtered.map((domain, index) => (
          <div className="table-row domain-table-row" key={domain.id}>
            <span className="row-number">{index + 1}</span>
            <div className="domain-name-cell"><span className="domain-symbol"><Icon name="globe" size={18} /></span><div><strong>{domain.name}</strong><small>{websites.find((website) => website.domain === domain.name)?.status || 'Not tagged'}</small></div></div>
            <StatusPill status={getDomainStatus(domain)} />
            <span className="table-muted">{domain.hosting}</span>
            <span className={getDomainStatus(domain) === 'Expiring' ? 'expiry-warning' : 'table-muted'}>{formatDate(domain.expiry)}</span>
            <span className={`email-state ${domain.emailCount > 0 ? 'enabled' : 'disabled'}`}><i /><span>{domain.emailCount || 0}</span></span>
            <div className="row-actions">
              {canManage && (
                <>
                  <div className="direct-actions">
                    <button className="mini-action edit" onClick={() => onEdit(domain)}>Edit</button>
                    <button className="mini-action delete" onClick={() => onDelete(domain)}>Delete</button>
                    <button className="more-btn" aria-label="More domain actions" onClick={() => setOpenMenu(openMenu === domain.id ? null : domain.id)}><Icon name="dots" /></button>
                  </div>
                  {openMenu === domain.id && (
                    <div className="action-menu">
                      <button onClick={() => { onTag(domain, 'None'); setOpenMenu(null) }}><span className="menu-dot none" />No website tag (Default)</button>
                      <button onClick={() => { onTag(domain, 'Live'); setOpenMenu(null) }}><span className="menu-dot live" />Mark website live</button>
                      <button onClick={() => { onTag(domain, 'Down'); setOpenMenu(null) }}><span className="menu-dot down" />Mark website down</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="empty-state">{searchQuery ? `No domains match "${searchQuery}".` : emptyMessage}</div>}
    </section>
  )
}

function Domains({ domains, websites, onEdit, onTag, onDelete, canManage = false, searchQuery = '', onSearchChange = () => {} }) {
  const [filter, setFilter] = useState('all')
  const expired = domains.filter((domain) => getDomainStatus(domain) === 'Expired')
  const expiringSoon = domains.filter((domain) => {
    const days = daysUntil(domain.expiry)
    return days >= 0 && days <= 10
  })
  const liveCount = websites.filter((website) => website.status === 'Live').length
  const downCount = websites.filter((website) => website.status === 'Down').length
  const filteredDomains = filter === 'expired'
    ? expired
    : filter === 'expiring'
      ? expiringSoon
    : filter === 'live'
      ? domains.filter((domain) => domain.websiteStatus === 'Live')
      : filter === 'down'
        ? domains.filter((domain) => domain.websiteStatus === 'Down')
        : domains

  const tabs = (
    <div className="section-tabs">
      <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
        All Domains <span>{domains.length}</span>
      </button>
      <button className={filter === 'expired' ? 'active' : ''} onClick={() => setFilter('expired')}>
        Expired Domains <span>{expired.length}</span>
      </button>
      <button className={filter === 'expiring' ? 'active' : ''} onClick={() => setFilter('expiring')}>
        Expiring Soon <span>{expiringSoon.length}</span>
      </button>
      <button className={filter === 'live' ? 'active' : ''} onClick={() => setFilter('live')}>
        Live <span>{liveCount}</span>
      </button>
      <button className={filter === 'down' ? 'active' : ''} onClick={() => setFilter('down')}>
        Down <span>{downCount}</span>
      </button>
    </div>
  )

  return (
    <>
      <div className="domain-summary-grid domain-summary-five">
        <article className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}><span className="summary-icon blue"><Icon name="globe" size={18} /></span><div><small>Total domains</small><strong>{domains.length}</strong></div></article>
        <article className={filter === 'expired' ? 'selected' : ''} onClick={() => setFilter('expired')}><span className="summary-icon orange"><Icon name="archive" size={18} /></span><div><small>Expired domains</small><strong>{expired.length}</strong></div></article>
        <article className={filter === 'expiring' ? 'selected' : ''} onClick={() => setFilter('expiring')}><span className="summary-icon orange"><Icon name="clock" size={18} /></span><div><small>Expiring soon</small><strong>{expiringSoon.length}</strong></div></article>
        <article className={filter === 'live' ? 'selected' : ''} onClick={() => setFilter('live')}><span className="summary-icon green"><Icon name="monitor" size={18} /></span><div><small>Live websites</small><strong>{liveCount}</strong></div></article>
        <article className={filter === 'down' ? 'selected' : ''} onClick={() => setFilter('down')}><span className="summary-icon red"><Icon name="activity" size={18} /></span><div><small>Down websites</small><strong>{downCount}</strong></div></article>
      </div>
      <DomainTable
        header={tabs}
        items={filteredDomains}
        websites={websites}
        onEdit={onEdit}
        onTag={onTag}
        onDelete={onDelete}
        canManage={canManage}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        emptyMessage="No expired domains. Everything looks healthy."
      />
    </>
  )
}

function SubdomainFormModal({ subdomain, onClose, onSave }) {
  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSave({
      name: String(form.get('name')).trim().toLowerCase(),
      hosting: form.get('hosting'),
      pm: form.get('pm'),
      assignedTo: form.get('assignedTo'),
      projectDate: form.get('projectDate'),
      websiteUrl: String(form.get('websiteUrl') || '').trim(),
    })
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="domain-modal" role="dialog" aria-modal="true" aria-labelledby="subdomain-form-title">
        <div className="modal-heading">
          <div><span className="eyebrow">SUBDOMAIN DETAILS</span><h2 id="subdomain-form-title">{subdomain ? 'Edit subdomain' : 'Add new subdomain'}</h2><p>Assign hosting, project manager, developer, and project date.</p></div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" size={19} /></button>
        </div>
        <form onSubmit={submit}>
          <label>Subdomain / website name<input name="name" defaultValue={subdomain?.name || ''} placeholder="app.example.com" required /></label>
          <label>Hosting
            <select name="hosting" defaultValue={subdomain?.hosting || 'Hostinger'}>
              <option value="Hostinger">Hostinger</option>
              <option value="Verpex">Verpex</option>
            </select>
          </label>
          <label>PM
            <select name="pm" defaultValue={subdomain?.pm || 'Front'}>
              <option value="Front">Front</option>
              <option value="Steven">Steven</option>
              <option value="William">William</option>
              <option value="Samuel">Samuel</option>
            </select>
          </label>
          <label>Assign to
            <select name="assignedTo" defaultValue={subdomain?.assignedTo || 'Samiullah'}>
              <option value="Samiullah">Samiullah</option>
              <option value="Mahad">Mahad</option>
              <option value="Usman">Usman</option>
            </select>
          </label>
          <label>Project date<input name="projectDate" type="date" defaultValue={subdomain?.projectDate || ''} required /></label>
          <label>Website URL<input name="websiteUrl" type="url" defaultValue={subdomain?.websiteUrl || ''} placeholder="https://app.example.com" /></label>
          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn">{subdomain ? 'Save changes' : 'Add subdomain'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function Subdomains({ items, onEdit, onDelete, onLogoUpload, canManage = false, searchQuery = '', onSearchChange = () => {} }) {
  const [personFilter, setPersonFilter] = useState('all')
  const [summaryFilter, setSummaryFilter] = useState('all')
  const hostingerCount = items.filter((item) => item.hosting === 'Hostinger').length
  const verpexCount = items.filter((item) => item.hosting === 'Verpex').length
  const alertItems = items.filter((item) => daysSince(item.projectDate) > 30)
  const hostingerProgress = Math.min(100, Math.round((hostingerCount / 35) * 100))
  const verpexProgress = Math.min(100, Math.round((verpexCount / 20) * 100))
  const visible = items.filter((item) => {
    const term = searchQuery.toLowerCase()
    const matchesQuery = [item.name, item.hosting, item.pm, item.assignedTo].some((value) => String(value || '').toLowerCase().includes(term))
    const matchesPerson = personFilter === 'all' || item.pm === personFilter || item.assignedTo === personFilter
    const matchesSummary = summaryFilter === 'hostinger'
      ? item.hosting === 'Hostinger'
      : summaryFilter === 'verpex'
        ? item.hosting === 'Verpex'
        : summaryFilter === 'alerts'
          ? daysSince(item.projectDate) > 30
          : true
    return matchesQuery && matchesPerson && matchesSummary
  })

  function homepageUrl(item) {
    if (item.websiteUrl) return /^https?:\/\//i.test(item.websiteUrl) ? item.websiteUrl : `https://${item.websiteUrl}`
    return `https://${item.name}`
  }

  function pickLogo(item, file) {
    if (!file) return
    if (!canManage) return
    if (!file.type.startsWith('image/')) return window.alert('Please select an image file.')
    if (file.size > 1024 * 1024) return window.alert('Image must be smaller than 1 MB.')
    const reader = new FileReader()
    reader.onload = () => onLogoUpload(item, reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <>
      <div className="subdomain-toolbar">
        <div className="website-search"><Icon name="search" size={18} /><input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search subdomain or website name..." /></div>
        <select className="people-filter" value={personFilter} onChange={(event) => setPersonFilter(event.target.value)}>
          <option value="all">All PMs & Developers</option>
          <optgroup label="PM">
            <option value="Front">Front</option><option value="Steven">Steven</option><option value="William">William</option><option value="Samuel">Samuel</option>
          </optgroup>
          <optgroup label="Assigned to">
            <option value="Samiullah">Samiullah</option><option value="Mahad">Mahad</option><option value="Usman">Usman</option>
          </optgroup>
        </select>
      </div>
      <div className="domain-summary-grid subdomain-summary-grid">
        <article className={summaryFilter === 'all' ? 'selected' : ''} onClick={() => setSummaryFilter('all')}><span className="summary-icon blue"><Icon name="activity" size={18} /></span><div><small>Total subdomains</small><strong>{items.length}</strong></div></article>
        <article className={`hostinger-capacity-card ${summaryFilter === 'hostinger' ? 'selected' : ''}`} onClick={() => setSummaryFilter('hostinger')}>
          <span className="summary-icon orange"><Icon name="globe" size={18} /></span>
          <div className="capacity-content">
            <div className="capacity-heading"><div><small>Hostinger</small><strong>{hostingerCount}</strong></div><span>{hostingerProgress}%</span></div>
            <div className="capacity-track"><i style={{ width: `${hostingerProgress}%` }} /></div>
            <p>{hostingerCount} / 35 subdomains</p>
          </div>
        </article>
        <article className={`verpex-capacity-card ${summaryFilter === 'verpex' ? 'selected' : ''}`} onClick={() => setSummaryFilter('verpex')}>
          <span className="summary-icon green"><Icon name="shield" size={18} /></span>
          <div className="capacity-content">
            <div className="capacity-heading"><div><small>Verpex</small><strong>{verpexCount}</strong></div><span className="verpex-percentage">{verpexProgress}%</span></div>
            <div className="capacity-track verpex-track"><i style={{ width: `${verpexProgress}%` }} /></div>
            <p>{verpexCount} / 20 subdomains</p>
          </div>
        </article>
        <article className={summaryFilter === 'alerts' ? 'selected' : ''} onClick={() => setSummaryFilter('alerts')}><span className="summary-icon red"><Icon name="bell" size={18} /></span><div><small>Alerts · Over 1 month</small><strong>{alertItems.length}</strong></div></article>
      </div>
      <section className="content-card domain-page-card subdomain-manager">
        <div className="domains-table">
          <div className="table-row table-head"><span>#</span><span>Subdomain</span><span>Hosting</span><span>PM</span><span>Assign to</span><span>Date</span><span>{canManage ? 'Actions' : ''}</span></div>
          {visible.map((item, index) => (
            <div className="table-row" key={item.id}>
              <span className="row-number">{index + 1}</span>
              <div className="domain-name-cell">
                <label className={`website-logo-upload ${canManage ? '' : 'readonly'}`} title={canManage ? 'Upload subdomain image' : 'View subdomain image'}>
                  {item.logoImage ? <img src={item.logoImage} alt="" /> : <Icon name="activity" size={18} />}
                  {canManage && <input type="file" accept="image/*" onChange={(event) => pickLogo(item, event.target.files?.[0])} />}
                </label>
                <div><a className="website-home-link" href={homepageUrl(item)} target="_blank" rel="noreferrer">{item.name}<Icon name="arrow" size={12} /></a><small>{item.pm} · {item.assignedTo}</small></div>
              </div>
              <span className="hosting-badge">{item.hosting}</span>
              <span className="table-muted">{item.pm}</span>
              <span className="table-muted">{item.assignedTo}</span>
              <span className="table-muted">{formatDate(item.projectDate)}</span>
              <div className="direct-actions">
                {canManage && (
                  <>
                    <button className="mini-action edit" onClick={() => onEdit(item)}>Edit</button>
                    <button className="mini-action delete" onClick={() => onDelete(item)}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {visible.length === 0 && <div className="empty-state">{summaryFilter === 'alerts' ? 'No subdomains older than one month.' : searchQuery || personFilter !== 'all' ? 'No matching subdomain projects.' : 'No subdomains added yet.'}</div>}
        </div>
      </section>
    </>
  )
}

function Websites({ domains, onUpdate, onEdit, onDelete, defaultDeveloper = 'Mahad', canManage = false, searchQuery = '', onSearchChange = () => {} }) {
  const [filter, setFilter] = useState('all')
  const [developerFilter, setDeveloperFilter] = useState('all')
  const [openMenu, setOpenMenu] = useState(null)
  const websites = domains.filter((domain) => domain.websiteStatus === 'Live' || domain.websiteStatus === 'Down')
  const hostingerCount = websites.filter((domain) => domain.websiteStatus === 'Live' && domain.hosting.toLowerCase() === 'hostinger').length
  const verpexCount = websites.filter((domain) => domain.websiteStatus === 'Live' && domain.hosting.toLowerCase() === 'verpex').length
  const downCount = websites.filter((domain) => domain.websiteStatus === 'Down').length
  const selectedWebsites = websites.filter((domain) => {
    return filter === 'hostinger'
      ? domain.websiteStatus === 'Live' && domain.hosting.toLowerCase() === 'hostinger'
      : filter === 'verpex'
        ? domain.websiteStatus === 'Live' && domain.hosting.toLowerCase() === 'verpex'
        : filter === 'down'
          ? domain.websiteStatus === 'Down'
          : true
  })
  const withEmailsCount = selectedWebsites.filter((domain) => (domain.emailCount || 0) >= 1).length
  const withoutEmailsCount = selectedWebsites.filter((domain) => (domain.emailCount || 0) === 0).length
  const visible = selectedWebsites.filter((domain) => {
    const term = searchQuery.toLowerCase()
    const matchesSearch = [domain.name, domain.hosting, domain.developer, domain.websiteStatus].some((value) => String(value || '').toLowerCase().includes(term))
    const matchesDeveloper = developerFilter === 'all' || (domain.developer || defaultDeveloper) === developerFilter
    return matchesSearch && matchesDeveloper
  })

  function uploadLogo(domain, file) {
    if (!file) return
    if (!canManage) return
    if (!file.type.startsWith('image/')) {
      window.alert('Please select an image file.')
      return
    }
    if (file.size > 1024 * 1024) {
      window.alert('Image must be smaller than 1 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => onUpdate(domain, { logoImage: reader.result })
    reader.readAsDataURL(file)
  }

  function homepageUrl(domain) {
    if (domain.websiteUrl) return /^https?:\/\//i.test(domain.websiteUrl) ? domain.websiteUrl : `https://${domain.websiteUrl}`
    return `https://${domain.name}`
  }

  return (
    <>
      <div className="website-filter-toolbar">
        <div className="website-search">
          <Icon name="search" size={18} />
          <input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search website to check developer, hosting, and email accounts..." />
        </div>
        <select className="people-filter" value={developerFilter} onChange={(event) => setDeveloperFilter(event.target.value)}>
          <option value="all">All Developers</option>
          <option value="Mahad">Mahad</option>
          <option value="Usman">Usman</option>
          <option value="Samiullah">Samiullah</option>
        </select>
      </div>
      <div className="domain-summary-grid website-summary-grid">
        <article className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}><span className="summary-icon blue"><Icon name="monitor" size={18} /></span><div><small>Total websites</small><strong>{websites.length}</strong></div></article>
        <article className={filter === 'hostinger' ? 'selected' : ''} onClick={() => setFilter('hostinger')}><span className="summary-icon orange"><Icon name="globe" size={18} /></span><div><small>Hostinger websites</small><strong>{hostingerCount}</strong></div></article>
        <article className={filter === 'verpex' ? 'selected' : ''} onClick={() => setFilter('verpex')}><span className="summary-icon green"><Icon name="shield" size={18} /></span><div><small>Verpex websites</small><strong>{verpexCount}</strong></div></article>
        <article className={filter === 'down' ? 'selected' : ''} onClick={() => setFilter('down')}><span className="summary-icon red"><Icon name="activity" size={18} /></span><div><small>Down websites</small><strong>{downCount}</strong></div></article>
      </div>
      <div className="email-coverage">
        <div className="coverage-heading">
          <div><span className="eyebrow">EMAIL COVERAGE</span><strong>{filter === 'all' ? 'Total websites' : filter === 'down' ? 'Down websites' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} live websites`}</strong></div>
          <span>{selectedWebsites.length} websites</span>
        </div>
        <div className="coverage-stat with-email"><span className="coverage-icon"><Icon name="mail" size={17} /></span><div><small>With emails</small><strong>{withEmailsCount}</strong><p>1 or more email accounts</p></div></div>
        <div className="coverage-stat without-email"><span className="coverage-icon"><Icon name="mail" size={17} /></span><div><small>Without emails</small><strong>{withoutEmailsCount}</strong><p>0 email accounts</p></div></div>
      </div>
      <section className="content-card domain-page-card website-manager">
        <div className="domains-table">
          <div className="table-row table-head"><span>#</span><span>Website</span><span>Status</span><span>Hosting</span><span>Developer</span><span>Backup</span><span>Emails</span><span>{canManage ? 'Actions' : ''}</span></div>
          {visible.map((domain, index) => (
            <div className="table-row" key={domain.id}>
              <span className="row-number">{index + 1}</span>
              <div className="domain-name-cell">
                <label className={`website-logo-upload ${domain.websiteStatus === 'Down' ? 'danger' : ''} ${canManage ? '' : 'readonly'}`} title={canManage ? 'Upload website image' : 'View website image'}>
                  {domain.logoImage ? <img src={domain.logoImage} alt="" /> : <Icon name="monitor" size={18} />}
                  {canManage && <input type="file" accept="image/*" onChange={(event) => uploadLogo(domain, event.target.files?.[0])} />}
                </label>
                <div><a className="website-home-link" href={homepageUrl(domain)} target="_blank" rel="noreferrer">{domain.name}<Icon name="arrow" size={12} /></a><small>{domain.emailCount || 0} email accounts</small></div>
              </div>
              <StatusPill status={domain.websiteStatus} />
              <span className="hosting-badge">{domain.hosting}</span>
              {canManage ? (
                <select className="inline-select" value={domain.developer || defaultDeveloper} onChange={(event) => onUpdate(domain, { developer: event.target.value })}>
                  <option value="Mahad">Mahad</option>
                  <option value="Usman">Usman</option>
                  <option value="Samiullah">Samiullah</option>
                </select>
              ) : <span className="developer-name">{domain.developer || defaultDeveloper}</span>}
              {canManage ? (
                <select className="inline-select compact-select" value={domain.backupEnabled ? 'yes' : 'no'} onChange={(event) => onUpdate(domain, { backupEnabled: event.target.value === 'yes' })}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              ) : <span className={`yes-no-pill ${domain.backupEnabled ? 'enabled' : 'disabled'}`}>{domain.backupEnabled ? 'Yes' : 'No'}</span>}
              <span className={`email-state ${domain.emailCount > 0 ? 'enabled' : 'disabled'}`}><Icon name="mail" size={13} /><span>{domain.emailCount || 0}</span></span>
              <div className="row-actions">
                {canManage && (
                  <>
                    <div className="direct-actions">
                      <button className="mini-action edit" onClick={() => onEdit(domain)}>Edit</button>
                      <button className="mini-action delete" onClick={() => onDelete(domain)}>Delete</button>
                      <button className="more-btn" aria-label="More website actions" onClick={() => setOpenMenu(openMenu === domain.id ? null : domain.id)}><Icon name="dots" /></button>
                    </div>
                    {openMenu === domain.id && (
                      <div className="action-menu website-action-menu">
                        <button onClick={() => { onUpdate(domain, { hosting: 'Hostinger', status: 'Live' }); setOpenMenu(null) }}><span className="menu-dot hostinger" />Move to Hostinger</button>
                        <button onClick={() => { onUpdate(domain, { hosting: 'Verpex', status: 'Live' }); setOpenMenu(null) }}><span className="menu-dot verpex" />Move to Verpex</button>
                        <button onClick={() => { onUpdate(domain, { status: 'Down' }); setOpenMenu(null) }}><span className="menu-dot down" />Mark website down</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {visible.length === 0 && <div className="empty-state">{searchQuery || developerFilter !== 'all' ? 'No websites match this search or developer.' : 'No websites in this filter.'}</div>}
        </div>
      </section>
    </>
  )
}

function Portfolio({ domains, onUpdate, onEdit, onDelete, defaultDeveloper = 'Mahad', canManage = false, searchQuery = '', onSearchChange = () => {} }) {
  const liveWebsites = domains.filter((domain) => domain.websiteStatus === 'Live' && (domain.developer || 'Mahad') === defaultDeveloper)
  const visible = liveWebsites.filter((domain) => {
    const term = searchQuery.toLowerCase()
    return [domain.name, domain.hosting, domain.developer].some((value) => String(value || '').toLowerCase().includes(term))
  })
  const careDueCount = liveWebsites.filter((domain) => !domain.careUpdateEnabled || isPastFifteenDays(domain.careUpdateAt)).length
  const wordfenceDueCount = liveWebsites.filter((domain) => isPastFifteenDays(domain.wordfenceDate)).length
  const recaptchaCount = liveWebsites.filter((domain) => domain.recaptchaEnabled).length

  function homepageUrl(domain) {
    if (domain.websiteUrl) return /^https?:\/\//i.test(domain.websiteUrl) ? domain.websiteUrl : `https://${domain.websiteUrl}`
    return `https://${domain.name}`
  }

  function careStatus(domain) {
    return domain.careUpdateEnabled && !isPastFifteenDays(domain.careUpdateAt) ? 'yes' : 'no'
  }

  return (
    <>
      <div className="website-filter-toolbar">
        <div className="website-search">
          <Icon name="search" size={18} />
          <input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search live portfolio websites..." />
        </div>
        <div className="portfolio-count">{visible.length} live websites</div>
      </div>
      <div className="domain-summary-grid portfolio-summary-grid">
        <article><span className="summary-icon blue"><Icon name="portfolio" size={18} /></span><div><small>Live portfolio</small><strong>{liveWebsites.length}</strong></div></article>
        <article><span className="summary-icon orange"><Icon name="clock" size={18} /></span><div><small>Care update due</small><strong>{careDueCount}</strong></div></article>
        <article><span className="summary-icon red"><Icon name="shield" size={18} /></span><div><small>Wordfence due</small><strong>{wordfenceDueCount}</strong></div></article>
        <article><span className="summary-icon green"><Icon name="check" size={18} /></span><div><small>Recaptcha yes</small><strong>{recaptchaCount}</strong></div></article>
      </div>
      <section className="content-card domain-page-card portfolio-manager">
        <div className="domains-table">
          <div className="table-row table-head"><span>#</span><span>Website</span><span>Care update</span><span>Wordfence</span><span>Recaptcha</span><span>Backup</span><span>Developer</span><span>{canManage ? 'Actions' : ''}</span></div>
          {visible.map((domain, index) => (
            <div className="table-row" key={domain.id}>
              <span className="row-number">{index + 1}</span>
              <div className="domain-name-cell">
                <span className="domain-symbol"><Icon name="monitor" size={18} /></span>
                <div><a className="website-home-link" href={homepageUrl(domain)} target="_blank" rel="noreferrer">{domain.name}<Icon name="arrow" size={12} /></a><small>{domain.hosting}</small></div>
              </div>
              <div className="portfolio-control">
                <select className={`inline-select ${careStatus(domain) === 'no' ? 'needs-update' : ''}`} value={careStatus(domain)} onChange={(event) => onUpdate(domain, { careUpdateEnabled: event.target.value === 'yes' })}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <small>{domain.careUpdateAt ? `Last ${formatDate(dateInputValue(domain.careUpdateAt))}` : 'Default yes'}</small>
              </div>
              <div className="portfolio-control">
                <input className={isPastFifteenDays(domain.wordfenceDate) ? 'needs-update' : ''} type="date" value={dateInputValue(domain.wordfenceDate)} onChange={(event) => onUpdate(domain, { wordfenceDate: event.target.value })} />
                <small>{isPastFifteenDays(domain.wordfenceDate) ? 'Update required' : '15 day reminder'}</small>
              </div>
              <select className="inline-select" value={domain.recaptchaEnabled ? 'yes' : 'no'} onChange={(event) => onUpdate(domain, { recaptchaEnabled: event.target.value === 'yes' })}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              <select className="inline-select compact-select" value={domain.backupEnabled ? 'yes' : 'no'} onChange={(event) => onUpdate(domain, { backupEnabled: event.target.value === 'yes' })}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              <span className="developer-name">{domain.developer || defaultDeveloper}</span>
              <div className="direct-actions">
                {canManage && (
                  <>
                    <button className="mini-action edit" onClick={() => onEdit(domain)}>Edit</button>
                    <button className="mini-action delete" onClick={() => onDelete(domain)}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {visible.length === 0 && <div className="empty-state">{searchQuery ? 'No live websites match this search.' : 'No live websites in portfolio yet.'}</div>}
        </div>
      </section>
    </>
  )
}

function NotificationPopup({ items, setItems, onClose, onNavigate }) {
  const [tab, setTab] = useState('unread')
  const unread = items.filter((item) => item.unread).length
  const read = items.length - unread
  const visibleItems = items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => tab === 'unread' ? item.unread : !item.unread)

  function markRead(index) {
    setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, unread: false } : item))
  }

  function markUnread(index) {
    setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, unread: true } : item))
  }

  return (
    <div className="notification-popup-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="notification-popup" role="dialog" aria-modal="true" aria-labelledby="notification-popup-title">
        <div className="popup-heading">
          <div><span className="eyebrow">ACTIVITY CENTER</span><h2 id="notification-popup-title">Notifications</h2><p>{unread} unread notifications</p></div>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="popup-toolbar">
          <div className="popup-tabs">
            <button className={tab === 'unread' ? 'active' : ''} onClick={() => setTab('unread')}>Unread <span>{unread}</span></button>
            <button className={tab === 'read' ? 'active' : ''} onClick={() => setTab('read')}>Read <span>{read}</span></button>
          </div>
          <button className="text-btn" onClick={() => setItems(items.map((item) => ({ ...item, unread: false })))}><Icon name="check" size={15} /> Mark all as read</button>
        </div>
        <div className="popup-notification-list">
          {visibleItems.map(({ item, originalIndex }) => (
            <article className={`popup-notification ${item.unread ? 'unread' : ''}`} key={item.id || `${item.title}-${originalIndex}`}>
              <span className={`notification-icon ${item.type}`}><Icon name={item.type === 'warning' ? 'clock' : item.type === 'success' ? 'check' : 'shield'} size={18} /></span>
              <div className="popup-notification-copy"><strong>{item.title}</strong><p>{item.text}</p><small>{item.time}</small>
                <div className="popup-actions">
                  <button onClick={() => { if (item.unread) markRead(originalIndex); onNavigate(item.targetPage || 'domains') }}>Go to {item.targetPage === 'subdomains' ? 'Subdomains' : item.targetPage === 'portfolio' ? 'Portfolio' : 'Domains'} <Icon name="arrow" size={13} /></button>
                  {item.unread
                    ? <button onClick={() => markRead(originalIndex)}>Mark as read</button>
                    : <button onClick={() => markUnread(originalIndex)}>Mark as unread</button>}
                </div>
              </div>
              {item.unread && <i className="unread-dot" />}
            </article>
          ))}
          {visibleItems.length === 0 && <div className="empty-state">No {tab} notifications.</div>}
        </div>
      </aside>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [authNotice, setAuthNotice] = useState('')
  const [authLoading, setAuthLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [globalSearch, setGlobalSearch] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [domainItems, setDomainItems] = useState([])
  const [subdomainItems, setSubdomainItems] = useState([])
  const [notificationItems, setNotificationItems] = useState([])
  const [popupAlert, setPopupAlert] = useState(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [editingDomain, setEditingDomain] = useState(undefined)
  const [editingSubdomain, setEditingSubdomain] = useState(undefined)
  const loggedInDeveloper = session?.user ? userFirstName(session.user) : ''

  useEffect(() => {
    const token = localStorage.getItem('aytech-token')
    localStorage.removeItem('aytech-domains')
    localStorage.removeItem('aytech-websites')

    if (!token) {
      setAuthLoading(false)
      return
    }

    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Invalid session')
        return response.json()
      })
      .then((data) => setSession({ token, user: data.user }))
      .catch(() => localStorage.removeItem('aytech-token'))
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    if (!session?.token) return

    setDataLoading(true)
    Promise.all([
      fetch(`${API_URL}/api/domains`, { headers: { Authorization: `Bearer ${session.token}` } }),
      fetch(`${API_URL}/api/subdomains`, { headers: { Authorization: `Bearer ${session.token}` } }),
    ])
      .then(async ([domainResponse, subdomainResponse]) => {
        const [domainData, subdomainData] = await Promise.all([domainResponse.json(), subdomainResponse.json()])
        if (!domainResponse.ok) throw new Error(domainData.message || 'Unable to load domains.')
        if (!subdomainResponse.ok) throw new Error(subdomainData.message || 'Unable to load subdomains.')
        return { domainData, subdomainData }
      })
      .then(({ domainData, subdomainData }) => {
        setDomainItems(domainData.domains)
        setSubdomainItems(subdomainData.subdomains)
      })
      .catch((error) => setPopupAlert({ title: 'Unable to load domains', text: error.message }))
      .finally(() => setDataLoading(false))
  }, [session?.token])

  useEffect(() => {
    const expiryAlerts = domainItems.flatMap((domain) => {
      const days = daysUntil(domain.expiry)

      if (days === 2) {
        return [{
          id: `expiry-warning-${domain.id}-${domain.expiry}`,
          type: 'warning',
          title: 'Domain expires in 2 days',
          text: `${domain.name} will expire on ${formatDate(domain.expiry)}. Please review it now.`,
          time: 'Today',
          unread: true,
          targetPage: 'domains',
        }]
      }

      if (days === 0) {
        return [{
          id: `expiry-today-${domain.id}-${domain.expiry}`,
          type: 'warning',
          title: 'Domain expires today',
          text: `${domain.name} expires today. Renew or update the domain immediately.`,
          time: 'Today',
          unread: true,
          targetPage: 'domains',
        }]
      }

      return []
    })
    const subdomainAlerts = subdomainItems
      .filter((subdomain) => daysSince(subdomain.projectDate) > 30)
      .map((subdomain) => ({
        id: `subdomain-age-${subdomain.id}-${subdomain.projectDate}`,
        type: 'warning',
        title: 'Subdomain is over one month old',
        text: `${subdomain.name} has been active for ${daysSince(subdomain.projectDate)} days. Review its progress and assignment.`,
        time: 'Today',
        unread: true,
        targetPage: 'subdomains',
      }))
    const careUpdateAlerts = domainItems
      .filter((domain) => (
        domain.websiteStatus === 'Live' &&
        (domain.developer || 'Mahad') === loggedInDeveloper &&
        (!domain.careUpdateEnabled || isPastFifteenDays(domain.careUpdateAt))
      ))
      .map((domain) => ({
        id: `care-update-${domain.id}-${dateInputValue(domain.careUpdateAt) || 'new'}`,
        type: 'warning',
        title: 'Website update required',
        text: `${domain.name} care update is due. Mark it Yes after the website has been updated.`,
        time: 'Today',
        unread: true,
        targetPage: 'portfolio',
      }))
    const wordfenceAlerts = domainItems
      .filter((domain) => (
        domain.websiteStatus === 'Live' &&
        (domain.developer || 'Mahad') === loggedInDeveloper &&
        isPastFifteenDays(domain.wordfenceDate)
      ))
      .map((domain) => ({
        id: `wordfence-update-${domain.id}-${dateInputValue(domain.wordfenceDate)}`,
        type: 'warning',
        title: 'Wordfence update required',
        text: `${domain.name} Wordfence date is over 15 days old. Please update it.`,
        time: 'Today',
        unread: true,
        targetPage: 'portfolio',
      }))
    const generatedAlerts = [...expiryAlerts, ...subdomainAlerts, ...careUpdateAlerts, ...wordfenceAlerts]

    setNotificationItems((current) => {
      const currentIds = new Set(current.map((item) => item.id))
      const newAlerts = generatedAlerts.filter((item) => !currentIds.has(item.id))
      if (newAlerts.length) setPopupAlert(newAlerts[0])
      return newAlerts.length ? [...newAlerts, ...current] : current
    })
  }, [domainItems, subdomainItems, loggedInDeveloper])

  function handleLogin(data) {
    localStorage.setItem('aytech-token', data.token)
    setAuthNotice('')
    setSession(data)
  }

  function expireSession(message = 'Your session expired. Please sign in again.') {
    localStorage.removeItem('aytech-token')
    setSession(null)
    setDomainItems([])
    setSubdomainItems([])
    setNotificationItems([])
    setPopupAlert(null)
    setAuthNotice(message)
  }

  async function handleLogout() {
    const token = session?.token
    localStorage.removeItem('aytech-token')
    setSession(null)
    setDomainItems([])
    setSubdomainItems([])
    setNotificationItems([])

    if (token) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // Local session is already cleared even if the backend is unavailable.
      }
    }
  }

  async function saveDomain(domain) {
    const isEditing = Boolean(editingDomain?.id)

    try {
      const response = await fetch(`${API_URL}/api/domains${isEditing ? `/${editingDomain.id}` : ''}`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(domain),
      })
      const data = await response.json()
      if (response.status === 401) {
        expireSession()
        return
      }
      if (!response.ok) throw new Error(data.message || 'Unable to save domain.')

      setDomainItems((current) => isEditing
        ? current.map((item) => item.id === data.domain.id ? data.domain : item)
        : [data.domain, ...current])
      setEditingDomain(undefined)
    } catch (error) {
      setPopupAlert({ title: 'Domain was not saved', text: error.message })
    }
  }

  async function tagWebsite(domain, status) {
    try {
      const response = await fetch(`${API_URL}/api/domains/${domain.id}/website-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ status }),
      })
      const data = await response.json()
      if (response.status === 401) {
        expireSession()
        return
      }
      if (!response.ok) throw new Error(data.message || 'Unable to update website status.')
      setDomainItems((current) => current.map((item) => item.id === data.domain.id ? data.domain : item))
    } catch (error) {
      setPopupAlert({ title: 'Status was not updated', text: error.message })
    }
  }

  async function updateWebsite(domain, changes) {
    try {
      const response = await fetch(`${API_URL}/api/domains/${domain.id}/website`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(changes),
      })
      const data = await response.json()

      if (response.status === 401) {
        expireSession()
        return
      }
      if (!response.ok) throw new Error(data.message || 'Unable to update website.')

      setDomainItems((current) => current.map((item) => item.id === data.domain.id ? data.domain : item))
    } catch (error) {
      setPopupAlert({ title: 'Website was not updated', text: error.message })
    }
  }

  async function deleteDomain(domain) {
    const confirmed = window.confirm(`Delete ${domain.name}? This will permanently remove it from the database.`)
    if (!confirmed) return

    try {
      const response = await fetch(`${API_URL}/api/domains/${domain.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      })
      const data = await response.json()

      if (response.status === 401) {
        expireSession()
        return
      }
      if (!response.ok) throw new Error(data.message || 'Unable to delete domain.')

      setDomainItems((current) => current.filter((item) => item.id !== domain.id))
      setPopupAlert({ title: 'Domain deleted', text: `${domain.name} was permanently removed from the database.` })
    } catch (error) {
      setPopupAlert({ title: 'Domain was not deleted', text: error.message })
    }
  }

  async function saveSubdomain(subdomain) {
    const isEditing = Boolean(editingSubdomain?.id)
    try {
      const response = await fetch(`${API_URL}/api/subdomains${isEditing ? `/${editingSubdomain.id}` : ''}`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(subdomain),
      })
      const data = await response.json()
      if (response.status === 401) return expireSession()
      if (!response.ok) throw new Error(data.message || 'Unable to save subdomain.')
      setSubdomainItems((current) => isEditing
        ? current.map((item) => item.id === data.subdomain.id ? data.subdomain : item)
        : [data.subdomain, ...current])
      setEditingSubdomain(undefined)
    } catch (error) {
      setPopupAlert({ title: 'Subdomain was not saved', text: error.message })
    }
  }

  async function deleteSubdomain(subdomain) {
    if (!window.confirm(`Delete ${subdomain.name}? This will permanently remove it from the database.`)) return
    try {
      const response = await fetch(`${API_URL}/api/subdomains/${subdomain.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      })
      const data = await response.json()
      if (response.status === 401) return expireSession()
      if (!response.ok) throw new Error(data.message || 'Unable to delete subdomain.')
      setSubdomainItems((current) => current.filter((item) => item.id !== subdomain.id))
      setPopupAlert({ title: 'Subdomain deleted', text: `${subdomain.name} was removed from the database.` })
    } catch (error) {
      setPopupAlert({ title: 'Subdomain was not deleted', text: error.message })
    }
  }

  async function uploadSubdomainLogo(subdomain, logoImage) {
    try {
      const response = await fetch(`${API_URL}/api/subdomains/${subdomain.id}/logo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ logoImage }),
      })
      const data = await response.json()
      if (response.status === 401) return expireSession()
      if (!response.ok) throw new Error(data.message || 'Unable to update image.')
      setSubdomainItems((current) => current.map((item) => item.id === data.subdomain.id ? data.subdomain : item))
    } catch (error) {
      setPopupAlert({ title: 'Image was not uploaded', text: error.message })
    }
  }

  if (authLoading) return <div className="auth-loader"><div className="brand-mark"><Icon name="zap" size={22} /></div><span>Checking session...</span></div>
  if (!session) return <Login onLogin={handleLogin} notice={authNotice} />

  const currentUser = session.user
  const currentUserName = userDisplayName(currentUser)
  const currentUserFirstName = userFirstName(currentUser)
  const canManagePortal = isTeamLeadUser(currentUser)
  const meta = {
    ...pageMeta[activePage],
    title: activePage === 'dashboard' ? `Welcome back, ${currentUserName}` : pageMeta[activePage].title,
  }
  const websiteItems = domainItems
    .filter((domain) => domain.websiteStatus === 'Live' || domain.websiteStatus === 'Down')
    .map((domain) => toWebsite(domain, currentUserFirstName))
  const unreadCount = notificationItems.filter((item) => item.unread).length
  function navigateFromNotification(page) {
    setActivePage(page)
    setNotificationsOpen(false)
  }

  function matchesSearch(values, term) {
    return values.some((value) => String(value || '').toLowerCase().includes(term))
  }

  function domainMatches(domain, term) {
    return matchesSearch([
      domain.name,
      domain.hosting,
      domain.developer,
      domain.websiteStatus,
      getDomainStatus(domain),
    ], term)
  }

  function websiteMatches(domain, term) {
    return (domain.websiteStatus === 'Live' || domain.websiteStatus === 'Down') && matchesSearch([
      domain.name,
      domain.hosting,
      domain.developer,
      domain.websiteStatus,
    ], term)
  }

  function portfolioMatches(domain, term) {
    return domain.websiteStatus === 'Live' && (domain.developer || 'Mahad') === currentUserFirstName && matchesSearch([
      domain.name,
      domain.hosting,
      domain.developer,
    ], term)
  }

  function subdomainMatches(subdomain, term) {
    return matchesSearch([
      subdomain.name,
      subdomain.hosting,
      subdomain.pm,
      subdomain.assignedTo,
    ], term)
  }

  function handleGlobalSearch(value) {
    setGlobalSearch(value)
    const term = value.trim().toLowerCase()
    if (term.length < 2) return

    const pageHasMatch = {
      dashboard: false,
      domains: domainItems.some((domain) => domainMatches(domain, term)),
      liveWebsites: domainItems.some((domain) => websiteMatches(domain, term)),
      portfolio: domainItems.some((domain) => portfolioMatches(domain, term)),
      subdomains: subdomainItems.some((subdomain) => subdomainMatches(subdomain, term)),
    }

    if (pageHasMatch[activePage]) return

    const wantsSubdomains = term.includes('subdomain') || term.includes('sub domain') || term === 'sub'
    const wantsWebsites = term.includes('website') || term.includes('web site') || term.includes('live web') || term === 'web' || term === 'live'

    if (wantsSubdomains && subdomainItems.length) {
      setActivePage('subdomains')
    } else if (wantsWebsites && domainItems.some((domain) => domain.websiteStatus === 'Live' || domain.websiteStatus === 'Down')) {
      setActivePage('liveWebsites')
    } else if (domainItems.some((domain) => websiteMatches(domain, term))) {
      setActivePage('liveWebsites')
    } else if (subdomainItems.some((subdomain) => subdomainMatches(subdomain, term))) {
      setActivePage('subdomains')
    } else if (domainItems.some((domain) => portfolioMatches(domain, term))) {
      setActivePage('portfolio')
    } else if (domainItems.some((domain) => domainMatches(domain, term))) {
      setActivePage('domains')
    }
  }

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} setActivePage={setActivePage} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onLogout={handleLogout} unreadCount={unreadCount} onOpenNotifications={() => setNotificationsOpen(true)} user={currentUser} />
      <div className="main-shell">
        <Header setMobileOpen={setMobileOpen} unreadCount={unreadCount} onOpenNotifications={() => setNotificationsOpen(true)} user={currentUser} searchValue={globalSearch} onSearchChange={handleGlobalSearch} onLogout={handleLogout} />
        <main className="page-content">
          <section className="page-heading">
            <div><span className="eyebrow">{meta.eyebrow}</span><h1>{meta.title}</h1><p>{meta.subtitle}</p></div>
            {canManagePortal && activePage === 'domains' && <button className="primary-btn" onClick={() => setEditingDomain(null)}><Icon name="plus" size={18} /> Add domain</button>}
            {canManagePortal && activePage === 'subdomains' && <button className="primary-btn" onClick={() => setEditingSubdomain(null)}><Icon name="plus" size={18} /> Add subdomain</button>}
          </section>
          {dataLoading && <div className="data-loading">Loading your database records...</div>}
          {!dataLoading && activePage === 'dashboard' && <Dashboard setActivePage={setActivePage} onOpenNotifications={() => setNotificationsOpen(true)} domains={domainItems} websites={websiteItems} subdomains={subdomainItems} notifications={notificationItems} />}
          {!dataLoading && activePage === 'domains' && <Domains domains={domainItems} websites={websiteItems} onEdit={setEditingDomain} onTag={tagWebsite} onDelete={deleteDomain} canManage={canManagePortal} searchQuery={globalSearch} onSearchChange={handleGlobalSearch} />}
          {!dataLoading && activePage === 'liveWebsites' && <Websites domains={domainItems} onUpdate={updateWebsite} onEdit={setEditingDomain} onDelete={deleteDomain} defaultDeveloper={currentUserFirstName} canManage={canManagePortal} searchQuery={globalSearch} onSearchChange={handleGlobalSearch} />}
          {!dataLoading && activePage === 'portfolio' && <Portfolio domains={domainItems} onUpdate={updateWebsite} onEdit={setEditingDomain} onDelete={deleteDomain} defaultDeveloper={currentUserFirstName} canManage={canManagePortal} searchQuery={globalSearch} onSearchChange={handleGlobalSearch} />}
          {!dataLoading && activePage === 'subdomains' && <Subdomains items={subdomainItems} onEdit={setEditingSubdomain} onDelete={deleteSubdomain} onLogoUpload={uploadSubdomainLogo} canManage={canManagePortal} searchQuery={globalSearch} onSearchChange={handleGlobalSearch} />}
        </main>
      </div>
      {editingDomain !== undefined && <DomainFormModal domain={editingDomain} onClose={() => setEditingDomain(undefined)} onSave={saveDomain} defaultDeveloper={currentUserFirstName} />}
      {editingSubdomain !== undefined && <SubdomainFormModal subdomain={editingSubdomain} onClose={() => setEditingSubdomain(undefined)} onSave={saveSubdomain} />}
      {notificationsOpen && <NotificationPopup items={notificationItems} setItems={setNotificationItems} onClose={() => setNotificationsOpen(false)} onNavigate={navigateFromNotification} />}
      {popupAlert && (
        <aside className="alert-toast">
          <span className="notification-icon warning"><Icon name="clock" size={19} /></span>
          <div><strong>{popupAlert.title}</strong><p>{popupAlert.text}</p></div>
          <button onClick={() => setPopupAlert(null)}><Icon name="close" size={16} /></button>
        </aside>
      )}
    </div>
  )
}

export default App
