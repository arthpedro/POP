import { DocumentDropzone } from '@/features/document-upload/components/DocumentDropzone'
import { UploadedDocumentsList } from '@/features/document-upload/components/UploadedDocumentsList'
import { useDocumentUpload } from '@/features/document-upload/hooks/useDocumentUpload'
import { PageHeader } from '@/shared/components/PageHeader'
import { StatCard } from '@/shared/components/StatCard'

export function DocumentsPage() {
  const {
    documents,
    messages,
    totalDocuments,
    addDocuments,
    addFeedbackMessages,
    removeDocument,
    clearDocuments,
    clearMessages,
  } = useDocumentUpload()

  return (
    <div className="page-stack">
      <PageHeader
        title="Documentos"
        description="Carregue arquivos PDF e Word para triagem inicial antes da etapa de lançamento contábil."
        actions={
          <button
            type="button"
            className="ghost-button"
            disabled={totalDocuments === 0}
            onClick={clearDocuments}
          >
            Limpar lista
          </button>
        }
      />

      <section className="stats-grid">
        <StatCard
          label="Total carregado"
          value={String(totalDocuments)}
          footnote="Arquivos válidos em memória"
        />
        <StatCard
          label="Status da validação"
          value={messages.length > 0 ? 'Atenção' : 'OK'}
          footnote={
            messages.length > 0
              ? `${messages.length} alerta(s) encontrado(s)`
              : 'Sem inconsistências'
          }
        />
      </section>

      <DocumentDropzone
        onFilesAccepted={addDocuments}
        onFilesRejected={addFeedbackMessages}
      />

      {messages.length > 0 ? (
        <article className="alert-card" role="alert">
          <div className="alert-headline">
            <h3>Validação local</h3>
            <button type="button" className="link-button" onClick={clearMessages}>
              Limpar alertas
            </button>
          </div>
          <ul className="list">
            {messages.map((message, index) => (
              <li key={`${message}-${index}`}>{message}</li>
            ))}
          </ul>
        </article>
      ) : null}

      <UploadedDocumentsList documents={documents} onRemove={removeDocument} />
    </div>
  )
}
