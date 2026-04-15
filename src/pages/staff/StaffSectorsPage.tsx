import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { DocumentDropzone } from '@/features/document-upload/components/DocumentDropzone'
import { UploadedDocumentsList } from '@/features/document-upload/components/UploadedDocumentsList'
import { useStaffNotifications } from '@/features/staff/context/StaffNotificationsContext'
import {
  readSectorDocumentsStore,
  saveSectorDocumentsStore,
  type SectorDocumentsStore,
} from '@/features/document-upload/storage/sectorDocumentsStorage'
import type { UploadedDocument } from '@/features/document-upload/types'
import { makeDocumentSignature, validateDocument } from '@/features/document-upload/utils'
import { useSectors } from '@/features/sectors/context/SectorsContext'
import type { Sector } from '@/features/sectors/types/sector'

const STAFF_SECTORS_DRAFT_STORAGE_KEY = 'pops.staff.sectors.draft'

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getNextCustomSectorId(currentSectors: Sector[], sectorName: string) {
  let baseId = slugify(sectorName)

  if (!baseId) {
    baseId = `setor-${Date.now()}`
  }

  let nextId = baseId
  let suffix = 1

  while (currentSectors.some((item) => item.id === nextId || item.path === `/setores/${nextId}`)) {
    suffix += 1
    nextId = `${baseId}-${suffix}`
  }

  return nextId
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error(`Falha ao ler ${file.name}.`))

    reader.readAsDataURL(file)
  })
}

function buildDisplayFileName(
  baseName: string,
  extension: string,
  index: number,
  totalFiles: number,
) {
  const trimmedBaseName = baseName.trim()
  const normalizedExtension = extension.toLowerCase()
  const extensionSuffix = normalizedExtension ? `.${normalizedExtension}` : ''
  const hasExtension = extensionSuffix
    ? trimmedBaseName.toLowerCase().endsWith(extensionSuffix)
    : false
  const normalizedBaseName = hasExtension
    ? trimmedBaseName.slice(0, -extensionSuffix.length)
    : trimmedBaseName

  if (totalFiles === 1) {
    return hasExtension ? trimmedBaseName : `${trimmedBaseName}${extensionSuffix}`
  }

  return `${normalizedBaseName} (${index + 1})${extensionSuffix}`
}

function removeExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf('.')

  if (lastDot <= 0) {
    return fileName
  }

  return fileName.slice(0, lastDot)
}

function isValidSector(candidate: unknown): candidate is Sector {
  if (!candidate || typeof candidate !== 'object') {
    return false
  }

  const record = candidate as Record<string, unknown>

  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.path === 'string' &&
    typeof record.view === 'string' &&
    typeof record.isCore === 'boolean'
  )
}

function readDraftSectors() {
  const rawValue = localStorage.getItem(STAFF_SECTORS_DRAFT_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue)

    if (!Array.isArray(parsed)) {
      return null
    }

    const validSectors = parsed.filter(isValidSector)

    return validSectors.length > 0 ? validSectors : null
  } catch {
    localStorage.removeItem(STAFF_SECTORS_DRAFT_STORAGE_KEY)
    return null
  }
}

export function StaffSectorsPage() {
  const { sectors, replaceSectors } = useSectors()
  const { notify } = useStaffNotifications()
  const [newSectorName, setNewSectorName] = useState('')
  const [isAddSectorModalOpen, setIsAddSectorModalOpen] = useState(false)
  const [addSectorError, setAddSectorError] = useState<string | null>(null)
  const [workingSectors, setWorkingSectors] = useState<Sector[]>(() => readDraftSectors() ?? sectors)
  const [documentsBySector, setDocumentsBySector] = useState<SectorDocumentsStore>(() =>
    readSectorDocumentsStore(),
  )
  const [activeSectorId, setActiveSectorId] = useState<string | null>(null)
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false)
  const [fileMessages, setFileMessages] = useState<string[]>([])

  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([])
  const [isFileNameModalOpen, setIsFileNameModalOpen] = useState(false)
  const [fileDisplayNameInput, setFileDisplayNameInput] = useState('')
  const [fileNameInputError, setFileNameInputError] = useState<string | null>(null)

  const hasPendingChanges = useMemo(
    () => JSON.stringify(workingSectors) !== JSON.stringify(sectors),
    [workingSectors, sectors],
  )

  const activeSector = useMemo(
    () => workingSectors.find((item) => item.id === activeSectorId) ?? null,
    [activeSectorId, workingSectors],
  )

  const activeSectorDocuments = activeSectorId
    ? documentsBySector[activeSectorId] ?? []
    : []

  useEffect(() => {
    if (!hasPendingChanges) {
      localStorage.removeItem(STAFF_SECTORS_DRAFT_STORAGE_KEY)
      return
    }

    localStorage.setItem(STAFF_SECTORS_DRAFT_STORAGE_KEY, JSON.stringify(workingSectors))
  }, [hasPendingChanges, workingSectors])

  const openAddSectorModal = () => {
    setIsAddSectorModalOpen(true)
    setAddSectorError(null)
  }

  const closeAddSectorModal = () => {
    setIsAddSectorModalOpen(false)
    setNewSectorName('')
    setAddSectorError(null)
  }

  const handleAddSectorSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = newSectorName.trim()

    if (!trimmedName) {
      setAddSectorError('Informe um nome para o setor.')
      return
    }

    const nextId = getNextCustomSectorId(workingSectors, trimmedName)

    const nextSector: Sector = {
      id: nextId,
      name: trimmedName,
      path: `/setores/${nextId}`,
      view: 'custom',
      isCore: false,
    }

    setWorkingSectors((currentSectors) => [...currentSectors, nextSector])
    closeAddSectorModal()
    notify({
      type: 'success',
      message: 'Setor adicionado ao rascunho. Clique em Salvar alterações para confirmar.',
    })
  }

  const handleSectorNameChange = (sectorId: string, nextName: string) => {
    setWorkingSectors((currentSectors) =>
      currentSectors.map((sector) =>
        sector.id === sectorId ? { ...sector, name: nextName } : sector,
      ),
    )
  }

  const handleRemoveSector = (sectorId: string) => {
    if (workingSectors.length <= 1) {
      notify({
        type: 'error',
        message: 'Pelo menos um setor deve permanecer.',
      })
      return
    }

    const nextSectors = workingSectors.filter((sector) => sector.id !== sectorId)

    setWorkingSectors(nextSectors)
    notify({
      type: 'success',
      message: 'Setor removido do rascunho. Clique em Salvar alterações para confirmar.',
    })
  }

  const handleSaveChanges = () => {
    const result = replaceSectors(workingSectors)

    notify({
      type: result.ok ? 'success' : 'error',
      message: result.message ?? 'Não foi possível salvar as alterações.',
    })

    if (result.ok) {
      localStorage.removeItem(STAFF_SECTORS_DRAFT_STORAGE_KEY)
    }
  }

  const handleDiscardChanges = () => {
    setWorkingSectors(sectors)
    localStorage.removeItem(STAFF_SECTORS_DRAFT_STORAGE_KEY)
    notify({
      type: 'success',
      message: 'Alterações locais descartadas.',
    })
  }

  const resetPendingUploadFlow = () => {
    setPendingUploadFiles([])
    setIsFileNameModalOpen(false)
    setFileDisplayNameInput('')
    setFileNameInputError(null)
  }

  const openFilesModal = (sectorId: string) => {
    setActiveSectorId(sectorId)
    setIsFilesModalOpen(true)
    setFileMessages([])
    resetPendingUploadFlow()
  }

  const closeFilesModal = () => {
    setIsFilesModalOpen(false)
    setActiveSectorId(null)
    setFileMessages([])
    resetPendingUploadFlow()
  }

  const appendFileMessages = (messages: string[]) => {
    if (messages.length === 0) {
      return
    }

    setFileMessages((currentMessages) => [...currentMessages, ...messages])
  }

  const openFileNameModal = (files: File[]) => {
    if (files.length === 0) {
      return
    }

    setPendingUploadFiles(files)
    setFileDisplayNameInput(removeExtension(files[0].name))
    setFileNameInputError(null)
    setIsFileNameModalOpen(true)
  }

  const closeFileNameModal = () => {
    resetPendingUploadFlow()
  }

  const uploadFilesToSector = async (
    targetSectorId: string,
    files: File[],
    baseDisplayName: string,
  ) => {
    const currentDocuments = documentsBySector[targetSectorId] ?? []
    const signatures = new Set(currentDocuments.map((item) => item.uniqueSignature))
    const nextDocuments: UploadedDocument[] = []
    const nextMessages: string[] = []

    for (const [index, file] of files.entries()) {
      const validation = validateDocument(file)

      if (!validation.isValid) {
        if (validation.message) {
          nextMessages.push(validation.message)
        }
        continue
      }

      const uniqueSignature = makeDocumentSignature(file)

      if (signatures.has(uniqueSignature)) {
        nextMessages.push(`${file.name}: este arquivo já foi carregado neste setor.`)
        continue
      }

      signatures.add(uniqueSignature)

      let previewDataUrl: string | undefined

      try {
        previewDataUrl = await fileToDataUrl(file)
      } catch {
        nextMessages.push(`${file.name}: não foi possível gerar pré-visualização.`)
      }

      nextDocuments.push({
        id: crypto.randomUUID(),
        name: buildDisplayFileName(
          baseDisplayName,
          validation.extension ?? '',
          index,
          files.length,
        ),
        size: file.size,
        extension: validation.extension ?? '',
        mimeType: file.type || 'application/octet-stream',
        previewDataUrl,
        uploadedAt: new Date().toISOString(),
        status: 'pronto',
        uniqueSignature,
      })
    }

    if (nextMessages.length > 0) {
      appendFileMessages(nextMessages)
    }

    if (nextDocuments.length === 0) {
      return 0
    }

    const nextStore: SectorDocumentsStore = {
      ...documentsBySector,
      [targetSectorId]: [...nextDocuments, ...currentDocuments],
    }

    try {
      setDocumentsBySector(nextStore)
      saveSectorDocumentsStore(nextStore)
    } catch {
      appendFileMessages([
        'Não foi possível salvar os arquivos neste navegador. Tente arquivos menores.',
      ])
      return 0
    }

    return nextDocuments.length
  }

  const handleSaveNamedUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = fileDisplayNameInput.trim()

    if (!trimmedName) {
      setFileNameInputError('Informe o nome do arquivo.')
      return
    }

    if (!activeSectorId || pendingUploadFiles.length === 0) {
      setFileNameInputError('Nenhum arquivo selecionado.')
      return
    }

    const addedDocumentsCount = await uploadFilesToSector(
      activeSectorId,
      pendingUploadFiles,
      trimmedName,
    )

    if (addedDocumentsCount > 0) {
      notify({
        type: 'success',
        message:
          addedDocumentsCount === 1
            ? '1 arquivo adicionado ao setor.'
            : `${addedDocumentsCount} arquivos adicionados ao setor.`,
      })
    }

    closeFileNameModal()
  }

  const handleRemoveFileFromSector = (documentId: string) => {
    if (!activeSectorId) {
      return
    }

    const currentDocuments = documentsBySector[activeSectorId] ?? []
    const nextDocuments = currentDocuments.filter((item) => item.id !== documentId)

    const nextStore: SectorDocumentsStore = {
      ...documentsBySector,
      [activeSectorId]: nextDocuments,
    }

    setDocumentsBySector(nextStore)
    saveSectorDocumentsStore(nextStore)
    notify({
      type: 'success',
      message: 'Arquivo removido do setor.',
    })
  }

  return (
    <>
      <section className="staff-overview">
        <article className="surface-card staff-overview-card">
          <p className="staff-overview-label">Setores ativos</p>
          <p className="staff-overview-value">{workingSectors.length}</p>
        </article>
        <article className="surface-card staff-overview-card">
          <p className="staff-overview-label">Status</p>
          <p className="staff-overview-value staff-overview-value-text">
            {hasPendingChanges ? 'Alterações pendentes' : 'Tudo sincronizado'}
          </p>
        </article>
      </section>

      <section className="table-card staff-management-card">
        <div className="staff-management-head">
          <div>
            <h3>Gestão de setores</h3>
          </div>
          <div className="staff-toolbar-main">
            <button type="button" className="primary-button" onClick={openAddSectorModal}>
              Novo setor
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={handleDiscardChanges}
              disabled={!hasPendingChanges}
            >
              Descartar
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={handleSaveChanges}
              disabled={!hasPendingChanges}
            >
              Salvar alterações
            </button>
          </div>
        </div>

        <div className="staff-sectors-list" role="list" aria-label="Lista de setores">
          {workingSectors.map((sector) => (
            <article key={sector.id} className="staff-sector-item" role="listitem">
              <label className="field staff-sector-field">
                <span>Nome do setor</span>
                <input
                  value={sector.name}
                  onChange={(event) => handleSectorNameChange(sector.id, event.target.value)}
                />
              </label>

              <div className="staff-sector-actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => openFilesModal(sector.id)}
                >
                  Arquivos
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => handleRemoveSector(sector.id)}
                >
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {isAddSectorModalOpen ? (
        <div className="modal-backdrop" onClick={closeAddSectorModal}>
          <section
            className="staff-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-sector-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="alert-headline">
              <h3 id="add-sector-modal-title">Novo setor</h3>
            </div>

            <p className="modal-description">
              Informe o nome do setor. A mudança vai para rascunho e só será aplicada ao clicar em
              Salvar alterações.
            </p>

            <form className="staff-form" onSubmit={handleAddSectorSubmit}>
              <label className="field">
                <span>Nome do setor</span>
                <input
                  value={newSectorName}
                  onChange={(event) => setNewSectorName(event.target.value)}
                  placeholder="Ex.: Setor Patrimonial"
                  autoFocus
                />
              </label>

              {addSectorError ? <p className="feedback-error">{addSectorError}</p> : null}

              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={closeAddSectorModal}>
                  Cancelar
                </button>
                <button type="submit" className="primary-button">
                  Criar setor
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {isFilesModalOpen && activeSector ? (
        <div className="modal-backdrop" onClick={closeFilesModal}>
          <section
            className="staff-modal staff-modal-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="files-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="alert-headline">
              <h3 id="files-modal-title">Arquivos do setor: {activeSector.name}</h3>
              <button type="button" className="link-button" onClick={closeFilesModal}>
                Fechar
              </button>
            </div>

            <DocumentDropzone
              onFilesAccepted={openFileNameModal}
              onFilesRejected={appendFileMessages}
            />

            {fileMessages.length > 0 ? (
              <article className="alert-card" role="alert">
                <div className="alert-headline">
                  <h3>Validação</h3>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setFileMessages([])}
                  >
                    Limpar alertas
                  </button>
                </div>
                <ul className="list">
                  {fileMessages.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </article>
            ) : null}

            <UploadedDocumentsList
              documents={activeSectorDocuments}
              onRemove={handleRemoveFileFromSector}
            />
          </section>
        </div>
      ) : null}

      {isFileNameModalOpen ? (
        <div className="modal-backdrop" onClick={closeFileNameModal}>
          <section
            className="staff-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="file-name-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="alert-headline">
              <h3 id="file-name-modal-title">Nome do arquivo</h3>
            </div>

            <form className="staff-form" onSubmit={handleSaveNamedUpload}>
              <label className="field">
                <span>Nome</span>
                <input
                  value={fileDisplayNameInput}
                  onChange={(event) => {
                    setFileDisplayNameInput(event.target.value)
                    if (fileNameInputError) {
                      setFileNameInputError(null)
                    }
                  }}
                  placeholder="Ex.: Balancete Março 2026"
                  autoFocus
                />
              </label>

              {fileNameInputError ? <p className="feedback-error">{fileNameInputError}</p> : null}

              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={closeFileNameModal}>
                  Cancelar
                </button>
                <button type="submit" className="primary-button">
                  Salvar
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  )
}
