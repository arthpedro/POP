# Portal POPS (Frontend)

Base frontend para escritorio de contabilidade, com arquitetura organizada, upload de documentos e painel Staff para gestao de setores.

## Stack

- React 19 + TypeScript
- Vite
- React Router
- React Dropzone
- ESLint

## Estrutura principal

```txt
src/
  app/
    App.tsx
    router.tsx
    layouts/
      AppLayout.tsx
    providers/
      AppProviders.tsx
  data/
    default-sectors.json
    staff-users.json
  features/
    document-upload/
    sectors/
    staff/
  pages/
    dashboard/
    documents/
    clients/
    settings/
    setor-custom/
    staff/
    not-found/
```

## Rotas

- `/` -> setor base fiscal
- `/documentos` -> setor base contabil + upload PDF/DOC/DOCX
- `/clientes` -> setor base pessoal
- `/configuracoes` -> setor base societario
- `/setores/:sectorId` -> setores customizados criados no Staff
- `/staff` -> autenticacao e gestao de setores

## Staff e JSON

- Usuarios de login estao em `src/data/staff-users.json`.
- Setores iniciais estao em `src/data/default-sectors.json`.
- Sessao e lista de setores sao persistidas em `localStorage` em formato JSON.
- Nao existe banco de dados nesta etapa.

Usuario padrao atual:

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
