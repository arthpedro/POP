import { Redis } from '@upstash/redis'

const APP_STATE_KEY = 'pops:app-state:v1'

const DEFAULT_SECTORS = [
  {
    id: 'fiscal',
    name: 'Setor Fiscal',
    path: '/',
    view: 'dashboard',
    isCore: true,
  },
  {
    id: 'contabil',
    name: 'Setor Contabil',
    path: '/documentos',
    view: 'documents',
    isCore: true,
  },
  {
    id: 'pessoal',
    name: 'Setor Pessoal',
    path: '/clientes',
    view: 'clients',
    isCore: true,
  },
  {
    id: 'societario',
    name: 'Setor Societario',
    path: '/configuracoes',
    view: 'settings',
    isCore: true,
  },
]

const DEFAULT_STAFF_USERS = [
  {
    id: 'admin',
    username: 'admin',
    password: '123456',
    displayName: 'Administrador',
  },
]

const DEFAULT_STATE = {
  sectors: DEFAULT_SECTORS,
  staffUsers: DEFAULT_STAFF_USERS,
  documentsBySector: {},
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidSector(value) {
  if (!isPlainObject(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.path === 'string' &&
    typeof value.view === 'string' &&
    typeof value.isCore === 'boolean'
  )
}

function isValidStaffUser(value) {
  if (!isPlainObject(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.username === 'string' &&
    typeof value.password === 'string' &&
    typeof value.displayName === 'string'
  )
}

function isValidUploadedDocument(value) {
  if (!isPlainObject(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.size === 'number' &&
    typeof value.extension === 'string' &&
    typeof value.mimeType === 'string' &&
    (typeof value.previewDataUrl === 'string' || typeof value.previewDataUrl === 'undefined') &&
    typeof value.uploadedAt === 'string' &&
    typeof value.status === 'string' &&
    typeof value.uniqueSignature === 'string'
  )
}

export function normalizeSectors(value) {
  if (!Array.isArray(value)) {
    return DEFAULT_SECTORS
  }

  const normalized = value.filter(isValidSector)
  return normalized.length > 0 ? normalized : DEFAULT_SECTORS
}

export function normalizeStaffUsers(value) {
  if (!Array.isArray(value)) {
    return DEFAULT_STAFF_USERS
  }

  const normalized = value.filter(isValidStaffUser)
  return normalized.length > 0 ? normalized : DEFAULT_STAFF_USERS
}

export function normalizeDocumentsBySector(value) {
  if (!isPlainObject(value)) {
    return {}
  }

  const nextStore = {}

  Object.entries(value).forEach(([sectorId, documents]) => {
    if (!Array.isArray(documents)) {
      return
    }

    const validDocuments = documents
      .filter(isValidUploadedDocument)
      .map((document) => ({
        ...document,
        mimeType:
          typeof document.mimeType === 'string' && document.mimeType.length > 0
            ? document.mimeType
            : 'application/octet-stream',
      }))

    nextStore[sectorId] = validDocuments
  })

  return nextStore
}

function normalizeState(value) {
  if (!isPlainObject(value)) {
    return DEFAULT_STATE
  }

  return {
    sectors: normalizeSectors(value.sectors),
    staffUsers: normalizeStaffUsers(value.staffUsers),
    documentsBySector: normalizeDocumentsBySector(value.documentsBySector),
  }
}

function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.KV_REST_API_TOKEN ??
    process.env.KV_REST_API_READ_ONLY_TOKEN

  if (!url || !token) {
    throw new Error(
      'Redis/KV nao configurado. Defina UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (ou KV_REST_API_URL + KV_REST_API_TOKEN/KV_REST_API_READ_ONLY_TOKEN).',
    )
  }

  return new Redis({
    url,
    token,
  })
}

export async function readCloudState() {
  const redis = getRedisClient()

  const rawState = await redis.get(APP_STATE_KEY)

  if (!rawState) {
    await redis.set(APP_STATE_KEY, DEFAULT_STATE)
    return DEFAULT_STATE
  }

  return normalizeState(rawState)
}

export async function writeCloudState(nextState) {
  const redis = getRedisClient()

  const normalizedState = normalizeState(nextState)
  await redis.set(APP_STATE_KEY, normalizedState)

  return normalizedState
}
