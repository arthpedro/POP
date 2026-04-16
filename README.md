# Portal POPS (Frontend)

Portal interno para escritorio de contabilidade, com setores criados no Staff, usuarios administrativos e documentos persistidos em nuvem.

## Stack

- React 19 + TypeScript
- Vite
- React Router
- React Dropzone
- Vercel Serverless Functions (`/api/cloud/*`)
- Upstash Redis (dados centralizados na nuvem)
- Vercel Blob (arquivos enviados pelos setores)

## Estrutura principal

```txt
src/
  app/
  data/
  features/
    document-upload/
    sectors/
    staff/
  pages/
  shared/
    api/
api/
  _lib/
    cloud-store.js
  cloud/
    sectors.js
    staff-users.js
    documents.js
```

## Rotas

- `/` -> redireciona para o primeiro setor criado ou mostra estado vazio
- `/setores/:sectorId` -> setores criados no Staff
- `/staff` -> autenticacao e gestao de setores

## Persistencia em nuvem

Os dados sao salvos na nuvem e compartilhados entre todos os acessos. A aplicacao nao usa `localStorage` como persistencia final.

- setores
- usuarios administrativos
- metadados de documentos por setor
- arquivos enviados para os setores

Endpoints usados pelo frontend:

- `GET/PUT /api/cloud/sectors`
- `GET/PUT /api/cloud/staff-users`
- `GET/PUT /api/cloud/documents`
- `POST /api/cloud/blob-upload`
- `POST /api/cloud/blob-delete`

## Setup na Vercel

1. No projeto da Vercel, adicione a integracao **Upstash Redis** (Marketplace).
2. Adicione tambem **Vercel Blob** ao projeto.
3. Confirme que as variaveis foram criadas no projeto:
   - recomendado: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
   - alternativo (legado): `KV_REST_API_URL` + `KV_REST_API_TOKEN`
   - arquivos: `BLOB_READ_WRITE_TOKEN`
4. Faca novo deploy.

Sem essas variaveis, a API retorna erro de configuracao da nuvem e as alteracoes nao sao salvas.

## Staff e usuarios iniciais

Usuario inicial padrao (seed):

- usuario: `admin`
- senha: `123456`

## Upload de documentos

Funcionalidades atuais:

- Drag-and-drop e selecao manual.
- Tipos permitidos: `.pdf`, `.doc`, `.docx`.
- Limite por arquivo: `300 MB`.
- Prevencao de duplicidade.
- Arquivo salvo no Vercel Blob.
- Metadados salvos no Upstash Redis.
- Lista de arquivos com metadados e remocao.

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run build
```

Para testar a versao final localmente com as rotas `/api/*`, Redis e Blob, use `vercel dev` com as variaveis da Vercel carregadas. O comando `npm run dev` sobe apenas o Vite e nao executa as Serverless Functions.
