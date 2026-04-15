/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import defaultSectorsData from '@/data/default-sectors.json'
import type { Sector, SectorMutationResult } from '@/features/sectors/types/sector'

const SECTORS_STORAGE_KEY = 'pops.sectors'

type SectorsContextValue = {
  sectors: Sector[]
  replaceSectors: (nextSectors: Sector[]) => SectorMutationResult
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

function readStoredSectors() {
  const rawValue = localStorage.getItem(SECTORS_STORAGE_KEY)

  if (!rawValue) {
    return DEFAULT_SECTORS
  }

  try {
    const parsed = JSON.parse(rawValue)

    if (!Array.isArray(parsed)) {
      return DEFAULT_SECTORS
    }

    const validSectors = parsed.filter(isValidSector)

    return validSectors.length > 0 ? validSectors : DEFAULT_SECTORS
  } catch {
    localStorage.removeItem(SECTORS_STORAGE_KEY)
    return DEFAULT_SECTORS
  }
}

function saveSectors(nextSectors: Sector[]) {
  localStorage.setItem(SECTORS_STORAGE_KEY, JSON.stringify(nextSectors))
}

export function SectorsProvider({ children }: { children: ReactNode }) {
  const [sectors, setSectors] = useState<Sector[]>(() => readStoredSectors())

  const replaceSectors = (nextSectors: Sector[]): SectorMutationResult => {
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

    setSectors(normalizedSectors)
    saveSectors(normalizedSectors)

    return {
      ok: true,
      message: 'Alterações salvas com sucesso.',
    }
  }

  const value: SectorsContextValue = {
    sectors,
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
