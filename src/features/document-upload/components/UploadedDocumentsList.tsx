import type { UploadedDocument } from '@/features/document-upload/types'
import { formatFileSize } from '@/shared/utils/formatters'

type UploadedDocumentsListProps = {
  documents: UploadedDocument[]
  onRemove: (id: string) => void
}

export function UploadedDocumentsList({
  documents,
  onRemove,
}: UploadedDocumentsListProps) {
  if (documents.length === 0) {
    return (
      <article className="empty-card">
        <h3>Nenhum documento carregado</h3>
        <p>
          Assim que você enviar um arquivo, ele será listado aqui com tamanho,
          extensão e horário de entrada.
        </p>
      </article>
    )
  }

  return (
    <section className="table-card" aria-label="Lista de documentos carregados">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Arquivo</th>
              <th>Tipo</th>
              <th>Tamanho</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id}>
                <td>{document.name}</td>
                <td>{document.extension.toUpperCase()}</td>
                <td>{formatFileSize(document.size)}</td>
                <td>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => onRemove(document.id)}
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
