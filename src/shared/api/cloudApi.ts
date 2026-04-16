import type { SectorDocumentsStore } from '@/features/document-upload/storage/sectorDocumentsStorage'
import type { Sector } from '@/features/sectors/types/sector'
import type { StaffUser } from '@/features/staff/types/staff'

type ApiErrorPayload = {
  message?: string
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    let message = 'Falha ao acessar dados em nuvem.'

    try {
      const payload = (await response.json()) as ApiErrorPayload
      if (payload.message) {
        message = payload.message
      }
    } catch {
      // ignore JSON parse errors and keep fallback message
    }

    throw new Error(message)
  }

  return (await response.json()) as T
}

export async function getCloudSectors() {
  const payload = await requestJson<{ sectors: Sector[] }>('/api/cloud/sectors')
  return payload.sectors
}

export async function saveCloudSectors(sectors: Sector[]) {
  const payload = await requestJson<{ sectors: Sector[] }>('/api/cloud/sectors', {
    method: 'PUT',
    body: JSON.stringify({ sectors }),
  })

  return payload.sectors
}

export async function getCloudStaffUsers() {
  const payload = await requestJson<{ staffUsers: StaffUser[] }>('/api/cloud/staff-users')
  return payload.staffUsers
}

export async function saveCloudStaffUsers(staffUsers: StaffUser[]) {
  const payload = await requestJson<{ staffUsers: StaffUser[] }>('/api/cloud/staff-users', {
    method: 'PUT',
    body: JSON.stringify({ staffUsers }),
  })

  return payload.staffUsers
}

export async function getCloudDocumentsBySector() {
  const payload = await requestJson<{ documentsBySector: SectorDocumentsStore }>(
    '/api/cloud/documents',
  )
  return payload.documentsBySector
}

export async function saveCloudDocumentsBySector(documentsBySector: SectorDocumentsStore) {
  const payload = await requestJson<{ documentsBySector: SectorDocumentsStore }>(
    '/api/cloud/documents',
    {
      method: 'PUT',
      body: JSON.stringify({ documentsBySector }),
    },
  )

  return payload.documentsBySector
}

export async function deleteCloudBlob(url: string) {
  const payload = await requestJson<{ ok: boolean }>('/api/cloud/blob-delete', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })

  return payload.ok
}
