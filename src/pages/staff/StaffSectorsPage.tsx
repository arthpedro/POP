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

export function StaffSectorsPage() {
  const { sectors, isLoading: isSectorsLoading, replaceSectors } = useSectors()
  const { notify } = useStaffNotifications()
  const [newSectorName, setNewSectorName] = useState('')
  const [isAddSectorModalOpen, setIsAddSectorModalOpen] = useState(false)
  const [addSectorError, setAddSectorError] = useState<string | null>(null)
  const [workingSectors, setWorkingSectors] = useState<Sector[]>([])
  const [isSavingSectors, setIsSavingSectors] = useState(false)
  const [documentsBySector, setDocumentsBySector] = useState<SectorDocumentsStore>({})
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true)
  const [activeSectorId, setActiveSectorId] = useState<string | null>(null)
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false)
  const [fileMessages, setFileMessages] = useState<string[]>([])

  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([])
  const [isFileNameModalOpen, setIsFileNameModalOpen] = useState(false)
  const [fileDisplayNameInput, setFileDisplayNameInput] = useState('')
  const [fileNameInputError, setFileNameInputError] = useState<string | null>(null)

  const hasPendingChanges = useMemo(() => {
    if (workingSectors.length === 0) {
      return false
    }

    return JSON.stringify(workingSectors) !== JSON.stringify(sectors)
  }, [workingSectors, sectors])

  const activeSector = useMemo(
    () => workingSectors.find((item) => item.id === activeSectorId) ?? null,
    [activeSectorId, workingSectors],
  )

  const activeSectorDocuments = activeSectorId
    ? documentsBySector[activeSectorId] ?? []
    : []

  useEffect(() => {
    setWorkingSectors((currentSectors) => {
      if (currentSectors.length === 0) {
        return sectors
      }

      const isDirty = JSON.stringify(currentSectors) !== JSON.stringify(sectors)
      return isDirty ? currentSectors : sectors
    })
  }, [sectors])

  useEffect(() => {
    let isMounted = true

    const loadCloudDocuments = async () => {
      try {
        const cloudStore = await readSectorDocumentsStore()

        if (!isMounted) {
          return
        }

        setDocumentsBySector(cloudStore)
      } catch {
        if (!isMounted) {
          return
        }

        setDocumentsBySector({})
      } finally {
        if (isMounted) {
          setIsDocumentsLoading(false)
        }
      }
    }

    loadCloudDocuments()

    return () => {
      isMounted = false
    }
  }, [])

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
      message: 'Setor adicionado ao rascunho. Clique em Salvar alteracoes para confirmar.',
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
      message: 'Setor removido do rascunho. Clique em Salvar alteracoes para confirmar.',
    })
  }

  const handleSaveChanges = async () => {
    setIsSavingSectors(true)
    const result = await replaceSectors(workingSectors)
    setIsSavingSectors(false)

    notify({
      type: result.ok ? 'success' : 'error',
      message: result.message ?? 'Nao foi possivel salvar as alteracoes.',
    })
  }

  const handleDiscardChanges = () => {
    setWorkingSectors(sectors)
    notify({
      type: 'success',
      message: 'Alteracoes locais descartadas.',
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
        nextMessages.push(`${file.name}: este arquivo ja foi carregado neste setor.`)
        continue
      }

      signatures.add(uniqueSignature)

      let previewDataUrl: string | undefined

      try {
        previewDataUrl = await fileToDataUrl(file)
      } catch {
        nextMessages.push(`${file.name}: nao foi possivel gerar pre-visualizacao.`)
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
      const savedStore = await saveSectorDocumentsStore(nextStore)
      setDocumentsBySector(savedStore)
    } catch {
      appendFileMessages([
        'Nao foi possivel salvar os arquivos na nuvem. Tente novamente.',
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

  const handleRemoveFileFromSector = async (documentId: string) => {
    if (!activeSectorId) {
      return
    }

    const currentDocuments = documentsBySector[activeSectorId] ?? []
    const nextDocuments = currentDocuments.filter((item) => item.id !== documentId)

    const nextStore: SectorDocumentsStore = {
      ...documentsBySector,
      [activeSectorId]: nextDocuments,
    }

    try {
      const savedStore = await saveSectorDocumentsStore(nextStore)
      setDocumentsBySector(savedStore)
      notify({
        type: 'success',
        message: 'Arquivo removido do setor.',
      })
    } catch {
      notify({
        type: 'error',
        message: 'Nao foi possivel remover o arquivo na nuvem.',
      })
    }
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
            {isSectorsLoading || isDocumentsLoading
              ? 'Sincronizando nuvem...'
              : hasPendingChanges
                ? 'Alteracoes pendentes'
                : 'Tudo sincronizado'}
          </p>
        </article>
      </section>

      <section className="table-card staff-management-card">
        <div className="staff-management-head">
          <div>
            <h3>Gestao de setores</h3>
          </div>
          <div className="staff-toolbar-main">
            <button type="button" className="primary-button" onClick={openAddSectorModal}>
              Novo setor
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={handleDiscardChanges}
              disabled={!hasPendingChanges || isSavingSectors}
            >
              Descartar
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={handleSaveChanges}
              disabled={!hasPendingChanges || isSavingSectors}
            >
              {isSavingSectors ? 'Salvando...' : 'Salvar alteracoes'}
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
              Informe o nome do setor. A mudanca vai para rascunho e so sera aplicada ao clicar em
              Salvar alteracoes.
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
                  <h3>Validacao</h3>
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
                  placeholder="Ex.: Balancete Marco 2026"
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
