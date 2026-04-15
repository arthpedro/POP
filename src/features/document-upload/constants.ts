export const ACCEPTED_DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx'] as const

export const MAX_DOCUMENT_SIZE_MB = 300
export const MAX_DOCUMENT_SIZE_BYTES = MAX_DOCUMENT_SIZE_MB * 1024 * 1024

export const DROPZONE_ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
} as const
