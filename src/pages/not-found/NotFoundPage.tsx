import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="content-card">
      <h3>Página não encontrada</h3>
      <p>O endereço informado não existe no portal atual.</p>
      <p>
        <Link to="/" className="inline-link">
          Voltar ao painel principal
        </Link>
      </p>
    </section>
  )
}
