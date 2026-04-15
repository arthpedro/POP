export type StaffUser = {
  id: string
  username: string
  password: string
  displayName: string
}

export type StaffSession = Pick<StaffUser, 'id' | 'username' | 'displayName'>

export type AuthResult = {
  ok: boolean
  message?: string
}
