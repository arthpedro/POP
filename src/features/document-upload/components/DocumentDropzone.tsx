import { useDropzone, type FileRejection } from 'react-dropzone'
import {
  DROPZONE_ACCEPTED_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_DOCUMENT_SIZE_MB,
} from '@/features/document-upload/constants'

type DocumentDropzoneProps = {
  onFilesAccepted: (files: File[]) => void
  onFilesRejected: (messages: string[]) => void
}

function mapRejectionError(code: string) {
  if (code === 'file-too-large') {
    return `arquivo acima de ${MAX_DOCUMENT_SIZE_MB} MB`
  }

  if (code === 'file-invalid-type') {
    return 'tipo de arquivo não permitido'
  }

  return 'arquivo rejeitado pela validação'
}

function getRejectionMessages(rejections: FileRejection[]) {
  return rejections.map(({ file, errors }) => {
    const issue = errors.map((error) => mapRejectionError(error.code)).join(', ')
    return `${file.name}: ${issue}.`
  })
}

export function DocumentDropzone({
  onFilesAccepted,
  onFilesRejected,
}: DocumentDropzoneProps) {
  const { getRootProps, getInputProps, open } = useDropzone({
    accept: DROPZONE_ACCEPTED_TYPES,
    maxSize: MAX_DOCUMENT_SIZE_BYTES,
    multiple: true,
    noClick: true,
    noKeyboard: true,
    onDropAccepted: onFilesAccepted,
    onDropRejected: (rejections) => onFilesRejected(getRejectionMessages(rejections)),
  })

  return (
    <section className="add-file-area" {...getRootProps()}>
      <input {...getInputProps()} />
      <p className="add-file-hint">Arraste arquivos ou clique em adicionar.</p>
      <button type="button" className="add-file-button" onClick={open}>
        Adicionar
      </button>
    </section>
  )
}
