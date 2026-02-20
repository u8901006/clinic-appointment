import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '/dashboard', label: '今日看診', hint: '櫃台待辦與快速操作' },
    { path: '/appointments', label: '預約總覽', hint: '查找、篩選、更新狀態' },
    { path: '/patients', label: '病患管理', hint: '聯絡資料與預約次數' },
    { path: '/doctors', label: '醫師與時段', hint: '醫師資料與門診安排' },
    { path: '/reports', label: '報表統計', hint: '日報與月報檢視' },
  ]

  const pageTitle = navItems.find((item) => location.pathname === item.path)?.label || '管理端'

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen bg-app-surface text-app-text">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:font-semibold"
      >
        跳到主要內容
      </a>

      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-muted">AI Schedule</p>
            <h1 className="text-lg font-bold text-app-text">{pageTitle}</h1>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? '關閉選單' : '開啟選單'}
            aria-expanded={mobileMenuOpen}
            className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl border border-app-border bg-white text-app-text shadow-soft transition-colors hover:bg-app-panel"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d={mobileMenuOpen ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} />
            </svg>
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1480px] gap-4 px-3 py-4 md:px-6 md:py-6">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[296px] transform border-r border-app-border bg-app-sidebar px-5 py-6 text-white transition-transform duration-200 md:static md:translate-x-0 md:rounded-3xl md:border md:shadow-soft ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-8 border-b border-white/15 pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/90">Clinic Console</p>
            <h1 className="mt-2 text-2xl font-bold leading-tight">診所行政管理</h1>
            <p className="mt-2 text-sm text-cyan-100/85">即時掌握今日看診與預約處理。</p>
          </div>

          <nav aria-label="主選單" className="space-y-2">
            {navItems.map((item) => {
              const active = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={`block cursor-pointer rounded-2xl border px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/90 ${
                    active
                      ? 'border-cyan-200/60 bg-white/15 text-white shadow-soft'
                      : 'border-transparent text-cyan-100 hover:border-white/20 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <p className="text-base font-semibold">{item.label}</p>
                  <p className="mt-1 text-xs text-cyan-100/80">{item.hint}</p>
                </Link>
              )
            })}
          </nav>
        </aside>

        {mobileMenuOpen && (
          <button
            type="button"
            aria-label="關閉選單遮罩"
            className="fixed inset-0 z-30 bg-slate-950/45 md:hidden"
            onClick={closeMobileMenu}
          />
        )}

        <main
          id="main-content"
          className="relative z-10 flex-1 rounded-3xl border border-app-border bg-white/92 p-4 shadow-soft backdrop-blur md:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
