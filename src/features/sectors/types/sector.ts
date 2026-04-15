export type SectorView = 'dashboard' | 'documents' | 'clients' | 'settings' | 'custom'

export type Sector = {
  id: string
  name: string
  path: string
  view: SectorView
  isCore: boolean
}

export type SectorMutationResult = {
  ok: boolean
  message?: string
}
