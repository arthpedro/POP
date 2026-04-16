/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import staffUsersData from '@/data/staff-users.json'
import { getCloudStaffUsers, saveCloudStaffUsers } from '@/shared/api/cloudApi'
import type { AuthResult, StaffSession, StaffUser } from '@/features/staff/types/staff'

type StaffAuthContextValue = {
  currentUser: StaffSession | null
  isAuthenticated: boolean
  isUsersLoading: boolean
  loadError: string | null
  staffUsers: StaffUser[]
  login: (username: string, password: string) => Promise<AuthResult>
  createUser: (input: { displayName: string; username: string; password: string }) => Promise<AuthResult>
  updateUser: (input: {
    id: string
    displayName: string
    username: string
    password?: string
  }) => Promise<AuthResult>
  removeUser: (id: string) => Promise<AuthResult>
  logout: () => void
}

const StaffAuthContext = createContext<StaffAuthContextValue | null>(null)

const DEFAULT_USERS = (staffUsersData.users ?? []) as StaffUser[]

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isValidStaffUser(candidate: unknown): candidate is StaffUser {
  if (!candidate || typeof candidate !== 'object') {
    return false
  }

  const record = candidate as Record<string, unknown>

  return (
    typeof record.id === 'string' &&
    typeof record.username === 'string' &&
    typeof record.password === 'string' &&
    typeof record.displayName === 'string'
  )
}

function normalizeStaffUsers(users: StaffUser[]) {
  const validUsers = users.filter(isValidStaffUser)
  return validUsers.length > 0 ? validUsers : DEFAULT_USERS
}

function syncSessionWithUsers(session: StaffSession | null, users: StaffUser[]) {
  if (!session) {
    return null
  }

  const matchedUser = users.find((user) => user.id === session.id)

  if (!matchedUser) {
    return null
  }

  return {
    id: matchedUser.id,
    username: matchedUser.username,
    displayName: matchedUser.displayName,
  }
}

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(DEFAULT_USERS)
  const [currentUser, setCurrentUser] = useState<StaffSession | null>(null)
  const [isUsersLoading, setIsUsersLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadUsers = async () => {
      try {
        const cloudUsers = await getCloudStaffUsers()

        if (!isMounted) {
          return
        }

        const normalizedUsers = normalizeStaffUsers(cloudUsers)
        setStaffUsers(normalizedUsers)
        setLoadError(null)
        setCurrentUser((session) => syncSessionWithUsers(session, normalizedUsers))
      } catch {
        if (!isMounted) {
          return
        }

        setStaffUsers([])
        setCurrentUser(null)
        setLoadError('Nao foi possivel carregar os usuarios da nuvem.')
      } finally {
        if (isMounted) {
          setIsUsersLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      isMounted = false
    }
  }, [])

  const login = async (username: string, password: string): Promise<AuthResult> => {
    const normalizedUsername = username.trim()
    const normalizedPassword = password.trim()

    if (!normalizedUsername || !normalizedPassword) {
      return {
        ok: false,
        message: 'Informe usuario e senha.',
      }
    }

    if (isUsersLoading) {
      return {
        ok: false,
        message: 'Aguarde. Usuarios ainda estao sendo carregados da nuvem.',
      }
    }

    if (loadError) {
      return {
        ok: false,
        message: loadError,
      }
    }

    const matchedUser = staffUsers.find(
      (user) =>
        user.username.toLowerCase() === normalizedUsername.toLowerCase() &&
        user.password === normalizedPassword,
    )

    if (!matchedUser) {
      return {
        ok: false,
        message: 'Credenciais invalidas.',
      }
    }

    const nextSession: StaffSession = {
      id: matchedUser.id,
      username: matchedUser.username,
      displayName: matchedUser.displayName,
    }

    setCurrentUser(nextSession)

    return {
      ok: true,
      message: 'Login realizado com sucesso.',
    }
  }

  const createUser = async (input: {
    displayName: string
    username: string
    password: string
  }): Promise<AuthResult> => {
    const normalizedDisplayName = input.displayName.trim()
    const normalizedUsername = input.username.trim().toLowerCase()
    const normalizedPassword = input.password.trim()

    if (!normalizedDisplayName || !normalizedUsername || !normalizedPassword) {
      return {
        ok: false,
        message: 'Informe nome, usuario e senha.',
      }
    }

    if (normalizedUsername.length < 3) {
      return {
        ok: false,
        message: 'O usuario deve ter pelo menos 3 caracteres.',
      }
    }

    if (normalizedPassword.length < 6) {
      return {
        ok: false,
        message: 'A senha deve ter pelo menos 6 caracteres.',
      }
    }

    if (staffUsers.some((user) => user.username.toLowerCase() === normalizedUsername)) {
      return {
        ok: false,
        message: 'Ja existe um usuario com este login.',
      }
    }

    let baseId = slugify(normalizedUsername)

    if (!baseId) {
      baseId = `staff-${Date.now()}`
    }

    let nextId = baseId
    let suffix = 1

    while (staffUsers.some((user) => user.id === nextId)) {
      suffix += 1
      nextId = `${baseId}-${suffix}`
    }

    const nextUser: StaffUser = {
      id: nextId,
      username: normalizedUsername,
      password: normalizedPassword,
      displayName: normalizedDisplayName,
    }

    const nextUsers = [...staffUsers, nextUser]

    try {
      const savedUsers = await saveCloudStaffUsers(nextUsers)
      setStaffUsers(normalizeStaffUsers(savedUsers))

      return {
        ok: true,
        message: 'Usuario criado com permissao administrativa.',
      }
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error ? error.message : 'Nao foi possivel criar o usuario na nuvem.',
      }
    }
  }

  const updateUser = async (input: {
    id: string
    displayName: string
    username: string
    password?: string
  }): Promise<AuthResult> => {
    const normalizedDisplayName = input.displayName.trim()
    const normalizedUsername = input.username.trim().toLowerCase()
    const normalizedPassword = input.password?.trim() ?? ''

    if (!normalizedDisplayName || !normalizedUsername) {
      return {
        ok: false,
        message: 'Informe nome e usuario.',
      }
    }

    if (normalizedUsername.length < 3) {
      return {
        ok: false,
        message: 'O usuario deve ter pelo menos 3 caracteres.',
      }
    }

    if (normalizedPassword && normalizedPassword.length < 6) {
      return {
        ok: false,
        message: 'A senha deve ter pelo menos 6 caracteres.',
      }
    }

    const targetUser = staffUsers.find((user) => user.id === input.id)

    if (!targetUser) {
      return {
        ok: false,
        message: 'Usuario nao encontrado.',
      }
    }

    if (
      staffUsers.some(
        (user) =>
          user.id !== input.id && user.username.toLowerCase() === normalizedUsername,
      )
    ) {
      return {
        ok: false,
        message: 'Ja existe um usuario com este login.',
      }
    }

    const nextUsers = staffUsers.map((user) =>
      user.id === input.id
        ? {
            ...user,
            displayName: normalizedDisplayName,
            username: normalizedUsername,
            password: normalizedPassword || user.password,
          }
        : user,
    )

    try {
      const savedUsers = normalizeStaffUsers(await saveCloudStaffUsers(nextUsers))
      setStaffUsers(savedUsers)

      if (currentUser?.id === input.id) {
        const updatedCurrentUser = savedUsers.find((user) => user.id === input.id)

        if (updatedCurrentUser) {
          setCurrentUser({
            id: updatedCurrentUser.id,
            username: updatedCurrentUser.username,
            displayName: updatedCurrentUser.displayName,
          })
        }
      }

      return {
        ok: true,
        message: 'Usuario atualizado com sucesso.',
      }
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel atualizar o usuario na nuvem.',
      }
    }
  }

  const removeUser = async (id: string): Promise<AuthResult> => {
    if (staffUsers.length <= 1) {
      return {
        ok: false,
        message: 'Pelo menos um usuario administrador deve permanecer.',
      }
    }

    if (currentUser?.id === id) {
      return {
        ok: false,
        message: 'Nao e possivel remover o usuario atualmente logado.',
      }
    }

    const targetUser = staffUsers.find((user) => user.id === id)

    if (!targetUser) {
      return {
        ok: false,
        message: 'Usuario nao encontrado.',
      }
    }

    const nextUsers = staffUsers.filter((user) => user.id !== id)

    try {
      const savedUsers = normalizeStaffUsers(await saveCloudStaffUsers(nextUsers))
      setStaffUsers(savedUsers)

      return {
        ok: true,
        message: 'Usuario removido com sucesso.',
      }
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error ? error.message : 'Nao foi possivel remover o usuario na nuvem.',
      }
    }
  }

  const logout = () => {
    setCurrentUser(null)
  }

  const value: StaffAuthContextValue = {
    currentUser,
    isAuthenticated: currentUser !== null,
    isUsersLoading,
    loadError,
    staffUsers,
    login,
    createUser,
    updateUser,
    removeUser,
    logout,
  }

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>
}

export function useStaffAuth() {
  const context = useContext(StaffAuthContext)

  if (!context) {
    throw new Error('useStaffAuth must be used within StaffAuthProvider')
  }

  return context
}
