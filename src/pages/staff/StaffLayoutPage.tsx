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
  const { currentUser, isAuthenticated, login, logout } = useStaffAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<MessageState | null>(null)

  const defaultUser = staffUsersData.users[0] ?? {
    username: 'admin',
    password: '123456',
  }

  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = login(username, password)

    setMessage({
      type: result.ok ? 'success' : 'error',
      text: result.message ?? 'Não foi possível autenticar.',
    })

    if (result.ok) {
      setPassword('')
    }
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
            message={message}
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
