/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import defaultSectorsData from '@/data/default-sectors.json'
import { getCloudSectors, saveCloudSectors } from '@/shared/api/cloudApi'
import type { Sector, SectorMutationResult } from '@/features/sectors/types/sector'

type SectorsContextValue = {
  sectors: Sector[]
  isLoading: boolean
  replaceSectors: (nextSectors: Sector[]) => Promise<SectorMutationResult>
}

const SectorsContext = createContext<SectorsContextValue | null>(null)

const DEFAULT_SECTORS = (defaultSectorsData.sectors ?? []) as Sector[]

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

function normalizeSectors(nextSectors: Sector[]) {
  const validSectors = nextSectors.filter(isValidSector)

  return validSectors.length > 0 ? validSectors : DEFAULT_SECTORS
}

export function SectorsProvider({ children }: { children: ReactNode }) {
  const [sectors, setSectors] = useState<Sector[]>(DEFAULT_SECTORS)
  const [isLoading, setIsLoading] = useState(true)

  const loadSectors = useCallback(async () => {
    try {
      const cloudSectors = await getCloudSectors()
      setSectors(normalizeSectors(cloudSectors))
    } catch {
      setSectors(DEFAULT_SECTORS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSectors()
  }, [loadSectors])

  const replaceSectors = async (nextSectors: Sector[]): Promise<SectorMutationResult> => {
    if (nextSectors.length === 0) {
      return {
        ok: false,
        message: 'Pelo menos um setor deve permanecer.',
      }
    }

    const normalizedSectors = nextSectors.map((sector) => ({
      ...sector,
      name: sector.name.trim(),
    }))

    if (normalizedSectors.some((sector) => sector.name.length === 0)) {
      return {
        ok: false,
        message: 'Todos os setores precisam ter nome.',
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
