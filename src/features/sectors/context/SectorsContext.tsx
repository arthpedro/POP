/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getCloudSectors, saveCloudSectors } from '@/shared/api/cloudApi'
import type { Sector, SectorMutationResult } from '@/features/sectors/types/sector'

type SectorsContextValue = {
  sectors: Sector[]
  isLoading: boolean
  replaceSectors: (nextSectors: Sector[]) => Promise<SectorMutationResult>
}

const SectorsContext = createContext<SectorsContextValue | null>(null)

const LEGACY_CORE_SECTOR_PATHS = new Set(['/', '/documentos', '/clientes', '/configuracoes'])
const LEGACY_CORE_SECTOR_VIEWS = new Set(['dashboard', 'documents', 'clients', 'settings'])

function normalizeSector(candidate: unknown): Sector | null {
  if (!candidate || typeof candidate !== 'object') {
    return null
  }

  const record = candidate as Record<string, unknown>

  if (
    record.isCore === true ||
    (typeof record.view === 'string' && LEGACY_CORE_SECTOR_VIEWS.has(record.view)) ||
    (typeof record.path === 'string' && LEGACY_CORE_SECTOR_PATHS.has(record.path))
  ) {
    return null
  }

  if (
    typeof record.id !== 'string' ||
    typeof record.name !== 'string' ||
    typeof record.path !== 'string'
  ) {
    return null
  }

  const id = record.id.trim()
  const name = record.name.trim()
  const path = record.path.trim()

  if (!id || !name || !path) {
    return null
  }

  if (path !== `/setores/${id}`) {
    return null
  }

  return {
    id,
    name,
    path,
  }
}

function normalizeSectors(nextSectors: unknown) {
  if (!Array.isArray(nextSectors)) {
    return []
  }

  return nextSectors
    .map(normalizeSector)
    .filter((sector): sector is Sector => sector !== null)
}

export function SectorsProvider({ children }: { children: ReactNode }) {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadSectors = useCallback(async () => {
    try {
      const cloudSectors = await getCloudSectors()
      setSectors(normalizeSectors(cloudSectors))
    } catch {
      setSectors([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSectors()
  }, [loadSectors])

  const replaceSectors = async (nextSectors: Sector[]): Promise<SectorMutationResult> => {
    const normalizedSectors = normalizeSectors(nextSectors)

    if (normalizedSectors.length !== nextSectors.length) {
      return {
        ok: false,
        message: 'A lista contem setores invalidos.',
      }
    }

    const idSet = new Set<string>()
    const pathSet = new Set<string>()

    for (const sector of normalizedSectors) {
      if (idSet.has(sector.id)) {
        return {
          ok: false,
          message: 'IDs de setor duplicados detectados.',
        }
      }

      if (pathSet.has(sector.path)) {
        return {
          ok: false,
          message: 'Rotas de setor duplicadas detectadas.',
        }
      }

      idSet.add(sector.id)
      pathSet.add(sector.path)
    }

    try {
      const savedSectors = await saveCloudSectors(normalizedSectors)
      setSectors(normalizeSectors(savedSectors))

      return {
        ok: true,
        message: 'Alteracoes salvas com sucesso na nuvem.',
      }
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel salvar alteracoes na nuvem.',
      }
    }
  }

  const value: SectorsContextValue = {
    sectors,
    isLoading,
    replaceSectors,
  }

  return <SectorsContext.Provider value={value}>{children}</SectorsContext.Provider>
}

export function useSectors() {
  const context = useContext(SectorsContext)

  if (!context) {
    throw new Error('useSectors must be used within SectorsProvider')
  }

  return context
}
