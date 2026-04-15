/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState, type ReactNode } from 'react'
import staffUsersData from '@/data/staff-users.json'
import type { AuthResult, StaffSession, StaffUser } from '@/features/staff/types/staff'

const STAFF_SESSION_STORAGE_KEY = 'pops.staff.session'
const STAFF_USERS_STORAGE_KEY = 'pops.staff.users'

type StaffAuthContextValue = {
  currentUser: StaffSession | null
  isAuthenticated: boolean
  staffUsers: StaffUser[]
  login: (username: string, password: string) => AuthResult
  createUser: (input: { displayName: string; username: string; password: string }) => AuthResult
  updateUser: (input: {
    id: string
    displayName: string
    username: string
    password?: string
  }) => AuthResult
  removeUser: (id: string) => AuthResult
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

function readStoredUsers() {
  const rawValue = localStorage.getItem(STAFF_USERS_STORAGE_KEY)

  if (!rawValue) {
    return DEFAULT_USERS
  }

  try {
    const parsed = JSON.parse(rawValue)

    if (!Array.isArray(parsed)) {
      return DEFAULT_USERS
    }

    const validUsers = parsed.filter(isValidStaffUser)

    return validUsers.length > 0 ? validUsers : DEFAULT_USERS
  } catch {
    localStorage.removeItem(STAFF_USERS_STORAGE_KEY)
    return DEFAULT_USERS
  }
}

function saveUsers(nextUsers: StaffUser[]) {
  localStorage.setItem(STAFF_USERS_STORAGE_KEY, JSON.stringify(nextUsers))
}

function readStoredSession() {
  const rawValue = localStorage.getItem(STAFF_SESSION_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as StaffSession
  } catch {
    localStorage.removeItem(STAFF_SESSION_STORAGE_KEY)
    return null
  }
}

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => readStoredUsers())
  const [currentUser, setCurrentUser] = useState<StaffSession | null>(() => readStoredSession())

  const login = (username: string, password: string): AuthResult => {
    const normalizedUsername = username.trim()
    const normalizedPassword = password.trim()

    if (!normalizedUsername || !normalizedPassword) {
      return {
        ok: false,
        message: 'Informe usuário e senha.',
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
        message: 'Credenciais inválidas.',
      }
    }

    const nextSession: StaffSession = {
      id: matchedUser.id,
      username: matchedUser.username,
      displayName: matchedUser.displayName,
    }

    localStorage.setItem(STAFF_SESSION_STORAGE_KEY, JSON.stringify(nextSession))
    setCurrentUser(nextSession)

    return {
      ok: true,
      message: 'Login realizado com sucesso.',
    }
  }

  const createUser = (input: {
    displayName: string
    username: string
    password: string
  }): AuthResult => {
    const normalizedDisplayName = input.displayName.trim()
    const normalizedUsername = input.username.trim().toLowerCase()
    const normalizedPassword = input.password.trim()

    if (!normalizedDisplayName || !normalizedUsername || !normalizedPassword) {
      return {
        ok: false,
        message: 'Informe nome, usuário e senha.',
      }
    }

    if (normalizedUsername.length < 3) {
      return {
        ok: false,
        message: 'O usuário deve ter pelo menos 3 caracteres.',
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
        message: 'Já existe um usuário com este login.',
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

    setStaffUsers(nextUsers)
    saveUsers(nextUsers)

    return {
      ok: true,
      message: 'Usuário criado com permissão administrativa.',
    }
  }

  const updateUser = (input: {
    id: string
    displayName: string
    username: string
    password?: string
  }): AuthResult => {
    const normalizedDisplayName = input.displayName.trim()
    const normalizedUsername = input.username.trim().toLowerCase()
    const normalizedPassword = input.password?.trim() ?? ''

    if (!normalizedDisplayName || !normalizedUsername) {
      return {
        ok: false,
        message: 'Informe nome e usuário.',
      }
    }

    if (normalizedUsername.length < 3) {
      return {
        ok: false,
        message: 'O usuário deve ter pelo menos 3 caracteres.',
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
        message: 'Usuário não encontrado.',
      }
    }

    if (
      staffUsers.some(
        (user) =>
          user.id !== input.id &&
          user.username.toLowerCase() === normalizedUsername,
      )
    ) {
      return {
        ok: false,
        message: 'Já existe um usuário com este login.',
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

    setStaffUsers(nextUsers)
    saveUsers(nextUsers)

    if (currentUser?.id === input.id) {
      const nextSession: StaffSession = {
        id: input.id,
        username: normalizedUsername,
        displayName: normalizedDisplayName,
      }

      setCurrentUser(nextSession)
      localStorage.setItem(STAFF_SESSION_STORAGE_KEY, JSON.stringify(nextSession))
    }

    return {
      ok: true,
      message: 'Usuário atualizado com sucesso.',
    }
  }

  const removeUser = (id: string): AuthResult => {
    if (staffUsers.length <= 1) {
      return {
        ok: false,
        message: 'Pelo menos um usuário administrador deve permanecer.',
      }
    }

    if (currentUser?.id === id) {
      return {
        ok: false,
        message: 'Não é possível remover o usuário atualmente logado.',
      }
    }

    const targetUser = staffUsers.find((user) => user.id === id)

    if (!targetUser) {
      return {
        ok: false,
        message: 'Usuário não encontrado.',
      }
    }

    const nextUsers = staffUsers.filter((user) => user.id !== id)

    setStaffUsers(nextUsers)
    saveUsers(nextUsers)

    return {
      ok: true,
      message: 'Usuário removido com sucesso.',
    }
  }

  const logout = () => {
    localStorage.removeItem(STAFF_SESSION_STORAGE_KEY)
    setCurrentUser(null)
  }

  const value: StaffAuthContextValue = {
    currentUser,
    isAuthenticated: currentUser !== null,
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
