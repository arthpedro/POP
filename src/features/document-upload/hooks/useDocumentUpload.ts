import { useMemo, useState } from 'react'
import type { UploadedDocument } from '@/features/document-upload/types'
import { makeDocumentSignature, validateDocument } from '@/features/document-upload/utils'

type UploadState = {
  documents: UploadedDocument[]
  messages: string[]
}

export function useDocumentUpload() {
  const [state, setState] = useState<UploadState>({
    documents: [],
    messages: [],
  })

  const { documents, messages } = state

  const totalDocuments = useMemo(() => documents.length, [documents])

  const addFeedbackMessages = (newMessages: string[]) => {
    if (newMessages.length === 0) {
      return
    }

    setState((currentState) => ({
      ...currentState,
      messages: [...currentState.messages, ...newMessages],
    }))
  }

  const addDocuments = (files: File[]) => {
    if (files.length === 0) {
      return
    }

    setState((currentState) => {
      const signatures = new Set(currentState.documents.map((item) => item.uniqueSignature))
      const nextDocuments: UploadedDocument[] = []
      const nextMessages: string[] = []

      files.forEach((file) => {
        const signature = makeDocumentSignature(file)
        const validation = validateDocument(file)

        if (!validation.isValid) {
          if (validation.message) {
            nextMessages.push(validation.message)
          }
          return
        }

        if (signatures.has(signature)) {
          nextMessages.push(`${file.name}: este arquivo já foi carregado.`)
          return
        }

        signatures.add(signature)

        nextDocuments.push({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          extension: validation.extension ?? '',
          mimeType: file.type || 'application/octet-stream',
          uploadedAt: new Date().toISOString(),
          status: 'pronto',
          uniqueSignature: signature,
        })
      })

      return {
        documents:
          nextDocuments.length > 0
            ? [...nextDocuments, ...currentState.documents]
            : currentState.documents,
        messages: [...currentState.messages, ...nextMessages],
      }
    })
  }

  const removeDocument = (id: string) => {
    setState((currentState) => ({
      ...currentState,
      documents: currentState.documents.filter((item) => item.id !== id),
    }))
  }

  const clearDocuments = () => {
    setState((currentState) => ({
      ...currentState,
      documents: [],
    }))
  }

  const clearMessages = () => {
    setState((currentState) => ({
      ...currentState,
      messages: [],
    }))
  }

  return {
    documents,
    messages,
    totalDocuments,
    addDocuments,
    addFeedbackMessages,
    removeDocument,
    clearDocuments,
    clearMessages,
  }
}
