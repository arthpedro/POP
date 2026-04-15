export type UploadedDocumentStatus = 'pronto'

export type UploadedDocument = {
  id: string
  name: string
  size: number
  extension: string
  mimeType: string
  previewDataUrl?: string
  uploadedAt: string
  status: UploadedDocumentStatus
  uniqueSignature: string
}

export type DocumentValidationResult = {
  isValid: boolean
  message?: string
  extension?: string
}
