import { Link, Navigate } from 'react-router-dom'
import { useSectors } from '@/features/sectors/context/SectorsContext'

export function SectorsHomePage() {
  const { sectors, isLoading } = useSectors()
  const firstSector = sectors[0]

  if (isLoading) {
    return (
      <section className="content-card">
        <h3>Carregando setores</h3>
        <p>Sincronizando a lista criada no painel Staff.</p>
      </section>
    )
  }

  if (firstSector) {
    return <Navigate to={firstSector.path} replace />
  }

  return (
    <section className="content-card">
      <h3>Nenhum setor criado</h3>
      <p>Crie setores no painel Staff para que eles aparecam na navegacao.</p>
      <p>
        <Link className="inline-link" to="/staff">
          Ir para Staff
        </Link>
      </p>
    </section>
  )
}
