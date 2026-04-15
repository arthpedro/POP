# Portal POPS (Frontend)

Base frontend para escritorio de contabilidade, com arquitetura organizada, upload de documentos e painel Staff para gestao de setores.

## Stack

- React 19 + TypeScript
- Vite
- React Router
- React Dropzone
- Vercel Serverless Functions (`/api/cloud/*`)
- Upstash Redis (dados centralizados na nuvem)

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

- `/` -> setor base fiscal
- `/documentos` -> setor base contabil + upload PDF/DOC/DOCX
- `/clientes` -> setor base pessoal
- `/configuracoes` -> setor base societario
- `/setores/:sectorId` -> setores customizados criados no Staff
- `/staff` -> autenticacao e gestao de setores

## Persistencia em nuvem

Os dados agora sao salvos na nuvem e compartilhados entre todos os acessos (sem `localStorage`):

- setores
- usuarios administrativos
- documentos por setor

Endpoints usados pelo frontend:

- `GET/PUT /api/cloud/sectors`
- `GET/PUT /api/cloud/staff-users`
- `GET/PUT /api/cloud/documents`

## Setup na Vercel

1. No projeto da Vercel, adicione a integracao **Upstash Redis** (Marketplace).
2. Confirme que as variaveis foram criadas no projeto:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Faça novo deploy.

Sem essas variaveis, a API retorna erro de configuracao da nuvem.

## Staff e usuarios iniciais

Usuario inicial padrao (seed):

- usuario: `admin`
- senha: `123456`

## Upload de documentos

Funcionalidades atuais:

- Drag-and-drop e selecao manual.
- Tipos permitidos: `.pdf`, `.doc`, `.docx`.
- Limite por arquivo: `20 MB`.
- Prevencao de duplicidade.
- Lista de arquivos com metadados e remocao.

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run build
```

Para testar API serverless localmente com as rotas `/api/*`, prefira `vercel dev`.
