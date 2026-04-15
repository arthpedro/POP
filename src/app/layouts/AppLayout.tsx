import { useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSectors } from '@/features/sectors/context/SectorsContext'
import { useStaffAuth } from '@/features/staff/context/StaffAuthContext'

const currentDateLabel = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'full',
}).format(new Date())

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sectors } = useSectors()
  const { isAuthenticated, login } = useStaffAuth()

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const isOnHomePage = location.pathname === '/'

  const openStaffModal = () => {
    if (isAuthenticated) {
      navigate('/staff')
      return
    }

    setIsStaffModalOpen(true)
    setLoginError(null)
  }

  const closeStaffModal = () => {
    setIsStaffModalOpen(false)
    setPassword('')
    setLoginError(null)
  }

  const handleStaffLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = login(username, password)

    if (!result.ok) {
      setLoginError(result.message ?? 'Falha ao autenticar.')
      return
    }

    closeStaffModal()
    navigate('/staff')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <div className="brand-logo-wrapper">
            <Link to="/" className="brand-logo-link" aria-label="Ir para página inicial">
              <img src="/logo.jpg" alt="Logo do escritório" className="brand-logo" />
            </Link>
          </div>
          <p className="brand-description">
            <strong>Setores</strong>
          </p>
        </div>

        <nav className="main-nav" aria-label="Navegação principal">
          {sectors.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `main-nav-link${isActive ? ' is-active' : ''}`}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="compliance-note">
          <p className="note-title">Equipe de T.I.</p>
          <p>
            Desenvolvido pelo setor de T.I. da JV Contabilidade em 2026.
            Solução interna para apoiar as rotinas operacionais do escritório.
          </p>
        </div>
      </aside>

      <section className="content-shell">
        {isOnHomePage ? (
          <header className="topbar">
            <div className="topbar-left">
              <p className="topbar-kicker">Bem-vindo ao POPS</p>
              <p className="topbar-caption">Central de operações e documentos por setor</p>
            </div>

            <div className="topbar-right">
              <p className="topbar-date">{currentDateLabel}</p>
              <button type="button" className="staff-button" onClick={openStaffModal}>
                Staff
              </button>
            </div>
          </header>
        ) : null}

        <main className="page-content">
          <div className="page-content-body">
            <Outlet />
          </div>
        </main>
      </section>

      {isStaffModalOpen ? (
        <div className="modal-backdrop" onClick={closeStaffModal}>
          <section
            className="staff-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="alert-headline">
              <h3 id="staff-modal-title">Login Staff</h3>
            </div>

            <p className="modal-description">
              Acesse com suas credenciais para gerenciar setores e configurações administrativas.
            </p>

            <form className="staff-form" onSubmit={handleStaffLoginSubmit}>
              <label className="field">
                <span>Usuário</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="Digite o usuário"
                />
              </label>

              <label className="field">
                <span>Senha</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Digite a senha"
                />
              </label>

              {loginError ? <p className="feedback-error">{loginError}</p> : null}

              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={closeStaffModal}>
                  Cancelar
                </button>
                <button type="submit" className="primary-button">
                  Entrar
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  )
}
