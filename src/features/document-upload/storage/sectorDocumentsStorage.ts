import { getCloudDocumentsBySector, saveCloudDocumentsBySector } from '@/shared/api/cloudApi'
import type { UploadedDocument } from '@/features/document-upload/types'

export type SectorDocumentsStore = Record<string, UploadedDocument[]>

export async function readSectorDocumentsStore(): Promise<SectorDocumentsStore> {
  return getCloudDocumentsBySector()
}

export async function saveSectorDocumentsStore(store: SectorDocumentsStore): Promise<SectorDocumentsStore> {
  return saveCloudDocumentsBySector(store)
}
