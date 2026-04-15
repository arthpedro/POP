import { useState, type FormEvent } from 'react'
import { Outlet } from 'react-router-dom'
import staffUsersData from '@/data/staff-users.json'
import { StaffLoginPanel } from '@/features/staff/components/StaffLoginPanel'
import {
  StaffNotificationsProvider,
  StaffNotificationsViewport,
} from '@/features/staff/context/StaffNotificationsContext'
import { StaffSectionNav } from '@/features/staff/components/StaffSectionNav'
import { useStaffAuth } from '@/features/staff/context/StaffAuthContext'
import { PageHeader } from '@/shared/components/PageHeader'

type MessageState = {
  type: 'success' | 'error'
  text: string
}

export function StaffLayoutPage() {
  const { currentUser, isAuthenticated, isUsersLoading, loadError, login, logout } = useStaffAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<MessageState | null>(null)

  const defaultUser = staffUsersData.users[0] ?? {
    username: 'admin',
    password: '123456',
  }
  const loginMessage = message ?? (loadError ? { type: 'error', text: loadError } : null)

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = await login(username, password)

    setMessage({
      type: result.ok ? 'success' : 'error',
      text: result.message ?? 'Não foi possível autenticar.',
    })

    if (result.ok) {
      setPassword('')
    }
  }

  if (isUsersLoading) {
    return (
      <StaffNotificationsProvider>
        <div className="page-stack">
          <PageHeader
            title="Painel administrativo"
            description="Carregando usuarios administrativos na nuvem..."
          />
        </div>
        <StaffNotificationsViewport />
      </StaffNotificationsProvider>
    )
  }

  if (!isAuthenticated) {
    return (
      <StaffNotificationsProvider>
        <div className="page-stack">
          <PageHeader
            title="Painel administrativo"
            description="Autenticação necessária para gerenciar setores e configurações administrativas."
          />
          <StaffLoginPanel
            defaultUser={defaultUser}
            username={username}
            password={password}
            message={loginMessage}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onSubmit={handleLoginSubmit}
          />
        </div>
        <StaffNotificationsViewport />
      </StaffNotificationsProvider>
    )
  }

  return (
    <StaffNotificationsProvider>
      <div className="page-stack">
        <PageHeader
          title="Painel administrativo"
          actions={
            <button type="button" className="ghost-button" onClick={logout}>
              Sair ({currentUser?.displayName})
            </button>
          }
        />

        <StaffSectionNav />

        <Outlet />
      </div>
      <StaffNotificationsViewport />
    </StaffNotificationsProvider>
  )
}
