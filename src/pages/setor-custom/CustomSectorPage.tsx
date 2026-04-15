import { useEffect, useState } from 'react'
import * as mammoth from 'mammoth'
import { Link, useParams } from 'react-router-dom'
import { readSectorDocumentsStore } from '@/features/document-upload/storage/sectorDocumentsStorage'
import type { UploadedDocument } from '@/features/document-upload/types'
import { useSectors } from '@/features/sectors/context/SectorsContext'
import { PageHeader } from '@/shared/components/PageHeader'

type ThumbTone = 'pdf' | 'word' | 'excel' | 'powerpoint' | 'image' | 'archive' | 'generic'

type ThumbBadge = {
  label: string
  tone: ThumbTone
}

function getThumbBadge(document: UploadedDocument): ThumbBadge {
  const extension = document.extension.toLowerCase()

  if (extension === 'pdf') {
    return { label: 'PDF', tone: 'pdf' }
  }

  if (extension === 'doc' || extension === 'docx') {
    return { label: 'Word', tone: 'word' }
  }

  if (extension === 'xls' || extension === 'xlsx' || extension === 'csv') {
    return { label: 'Excel', tone: 'excel' }
  }

  if (extension === 'ppt' || extension === 'pptx') {
    return { label: 'PPT', tone: 'powerpoint' }
  }

  if (
    extension === 'png' ||
    extension === 'jpg' ||
    extension === 'jpeg' ||
    extension === 'webp' ||
    extension === 'svg'
  ) {
    return { label: 'IMG', tone: 'image' }
  }

  if (extension === 'zip' || extension === 'rar' || extension === '7z') {
    return { label: 'ZIP', tone: 'archive' }
  }

  return { label: (extension || 'doc').toUpperCase(), tone: 'generic' }
}

function DocumentThumbnail({ document }: { document: UploadedDocument }) {
  const badge = getThumbBadge(document)

  return (
    <div className={`sector-doc-thumb-label sector-doc-thumb-label-${badge.tone}`}>
      {badge.label}
    </div>
  )
}

async function dataUrlToArrayBuffer(dataUrl: string) {
  const response = await fetch(dataUrl)
  return response.arrayBuffer()
}

export function CustomSectorPage() {
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [docxHtml, setDocxHtml] = useState<string | null>(null)
  const [docxError, setDocxError] = useState<string | null>(null)
  const [isDocxLoading, setIsDocxLoading] = useState(false)
  const { sectorId } = useParams()
  const { sectors } = useSectors()

  const sector = sectors.find((item) => item.id === sectorId)
  const documentsStore = readSectorDocumentsStore()
  const sectorDocuments = sector ? documentsStore[sector.id] ?? [] : []
  const selectedDocument = sectorDocuments.find((item) => item.id === selectedDocumentId) ?? null
  const selectedExtension = selectedDocument?.extension.toLowerCase() ?? ''
  const selectedDocumentDataUrl = selectedDocument?.previewDataUrl ?? null

  const canPreviewPdf = selectedExtension === 'pdf' && Boolean(selectedDocument?.previewDataUrl)
  const isDocx = selectedExtension === 'docx'

  useEffect(() => {
    if (!isViewerOpen || !selectedDocumentId) {
      setDocxHtml(null)
      setDocxError(null)
      setIsDocxLoading(false)
      return
    }

    if (!isDocx) {
      setDocxHtml(null)
      setDocxError(null)
      setIsDocxLoading(false)
      return
    }

    if (!selectedDocumentDataUrl) {
      setDocxHtml(null)
      setDocxError('Não foi possível carregar o arquivo DOCX para visualização.')
      setIsDocxLoading(false)
      return
    }

    let cancelled = false

    const renderDocx = async () => {
      setIsDocxLoading(true)
      setDocxError(null)

      try {
        const arrayBuffer = await dataUrlToArrayBuffer(selectedDocumentDataUrl)
        const result = await mammoth.convertToHtml({ arrayBuffer })

        if (cancelled) {
          return
        }

        setDocxHtml(result.value)
      } catch {
        if (cancelled) {
          return
        }

        setDocxHtml(null)
        setDocxError('Não foi possível renderizar este DOCX no navegador.')
      } finally {
        if (!cancelled) {
          setIsDocxLoading(false)
        }
      }
    }

    renderDocx()

    return () => {
      cancelled = true
    }
    }, [isDocx, isViewerOpen, selectedDocumentDataUrl, selectedDocumentId])

  if (!sector) {
    return (
      <section className="content-card">
        <h3>Setor não encontrado</h3>
        <p>O setor pode ter sido removido pelo painel Staff.</p>
        <p>
          <Link className="inline-link" to="/staff">
            Ir para Staff
          </Link>
        </p>
      </section>
    )
  }

  const viewerContent = (() => {
    if (!selectedDocument) {
      return <p>Selecione um arquivo para visualizar.</p>
    }

    if (canPreviewPdf) {
      return (
        <iframe
          src={selectedDocument.previewDataUrl}
          className="sector-viewer-frame"
          title={`Visualização ${selectedDocument.name}`}
        />
      )
    }

    if (isDocx) {
      if (isDocxLoading) {
        return <p>Carregando visualização do DOCX...</p>
      }

      if (docxError) {
        return <p>{docxError}</p>
      }

      if (docxHtml) {
        return (
          <article
            className="sector-viewer-docx"
            dangerouslySetInnerHTML={{ __html: docxHtml }}
          />
        )
      }
    }

    return <p>Este formato ainda não possui renderização inline. Use o botão Baixar.</p>
  })()

  return (
    <div className="page-stack sector-page-stack">
      <PageHeader title={sector.name} />

      {sectorDocuments.length === 0 ? (
        <section className="content-card">
          <h3>Nenhum arquivo neste setor</h3>
          <p>Vá para a página Staff, abra o setor e realize upload de PDF ou Word.</p>
        </section>
      ) : (
        <section className="sector-documents-layout">
          <p className="muted-text">
            Clique no arquivo para abrir a visualização em tela cheia.
          </p>

          <aside className="sector-documents-list">
            {sectorDocuments.map((document) => (
              <button
                key={document.id}
                type="button"
                className={`sector-doc-item${
                  selectedDocument?.id === document.id ? ' is-active' : ''
                }`}
                onClick={() => {
                  setSelectedDocumentId(document.id)
                  setIsViewerOpen(true)
                }}
              >
                <div className="sector-doc-thumb">
                  <DocumentThumbnail document={document} />
                </div>
                <span className="sector-doc-name">{document.name}</span>
              </button>
            ))}
          </aside>
        </section>
      )}

      {isViewerOpen && selectedDocument ? (
        <div className="modal-backdrop" onClick={() => setIsViewerOpen(false)}>
          <section
            className="sector-viewer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sector-viewer-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="sector-viewer-header">
              <h3 id="sector-viewer-title">{selectedDocument.name}</h3>
              <div className="sector-viewer-actions">
                {selectedDocument.previewDataUrl ? (
                  <a
                    className="inline-link"
                    href={selectedDocument.previewDataUrl}
                    download={selectedDocument.name}
                  >
                    Baixar
                  </a>
                ) : null}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setIsViewerOpen(false)}
                >
                  Fechar
                </button>
              </div>
            </header>

            {viewerContent}
          </section>
        </div>
      ) : null}
    </div>
  )
}
