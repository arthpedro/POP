import {
  ACCEPTED_DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_SIZE_MB,
  MAX_DOCUMENT_SIZE_BYTES,
} from '@/features/document-upload/constants'
import type { DocumentValidationResult } from '@/features/document-upload/types'

function getExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

export function makeDocumentSignature(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

export function validateDocument(file: File): DocumentValidationResult {
  const extension = getExtension(file.name)

  if (!ACCEPTED_DOCUMENT_EXTENSIONS.includes(extension as (typeof ACCEPTED_DOCUMENT_EXTENSIONS)[number])) {
    return {
      isValid: false,
      extension,
      message: `${file.name}: extensão não suportada.`,
    }
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return {
      isValid: false,
      extension,
      message: `${file.name}: tamanho acima de ${MAX_DOCUMENT_SIZE_MB} MB.`,
    }
  }

  return {
    isValid: true,
    extension,
  }
}
