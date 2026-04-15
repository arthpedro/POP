import { PageHeader } from '@/shared/components/PageHeader'

const clients = [
  { name: 'Alfa Transporte LTDA', regime: 'Lucro Presumido', status: 'Ativo' },
  { name: 'Mercado Sol Nascente', regime: 'Simples Nacional', status: 'Ativo' },
  { name: 'Auto Peças Gomes', regime: 'Lucro Real', status: 'Pendência documental' },
]

export function ClientsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Clientes"
        description="Cadastro resumido para conferência rápida de regime tributário e situação operacional."
      />

      <section className="table-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Regime</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.name}>
                  <td>{client.name}</td>
                  <td>{client.regime}</td>
                  <td>{client.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
