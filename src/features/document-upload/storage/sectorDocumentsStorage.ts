import type { UploadedDocument } from '@/features/document-upload/types'

const SECTOR_DOCUMENTS_STORAGE_KEY = 'pops.sectors.documents'

export type SectorDocumentsStore = Record<string, UploadedDocument[]>

function isUploadedDocument(value: unknown): value is UploadedDocument {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.size === 'number' &&
    typeof candidate.extension === 'string' &&
    (typeof candidate.mimeType === 'string' || typeof candidate.mimeType === 'undefined') &&
    typeof candidate.uploadedAt === 'string' &&
    typeof candidate.status === 'string' &&
    typeof candidate.uniqueSignature === 'string' &&
    (typeof candidate.previewDataUrl === 'string' || typeof candidate.previewDataUrl === 'undefined')
  )
}

export function readSectorDocumentsStore(): SectorDocumentsStore {
  const rawValue = localStorage.getItem(SECTOR_DOCUMENTS_STORAGE_KEY)

  if (!rawValue) {
    return {}
  }

  try {
    const parsed = JSON.parse(rawValue)

    if (!parsed || typeof parsed !== 'object') {
      return {}
    }

    const normalizedStore: SectorDocumentsStore = {}

    Object.entries(parsed as Record<string, unknown>).forEach(([sectorId, documents]) => {
      if (!Array.isArray(documents)) {
        return
      }

      const validDocuments = documents
        .filter(isUploadedDocument)
        .map((item) => ({
          ...item,
          mimeType:
            item.mimeType ??
            (item.extension.toLowerCase() === 'pdf'
              ? 'application/pdf'
              : 'application/octet-stream'),
        }))

      normalizedStore[sectorId] = validDocuments
    })

    return normalizedStore
  } catch {
    localStorage.removeItem(SECTOR_DOCUMENTS_STORAGE_KEY)
    return {}
  }
}

export function saveSectorDocumentsStore(store: SectorDocumentsStore) {
  localStorage.setItem(SECTOR_DOCUMENTS_STORAGE_KEY, JSON.stringify(store))
}
