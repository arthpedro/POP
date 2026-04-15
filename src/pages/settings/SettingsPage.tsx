import { PageHeader } from '@/shared/components/PageHeader'

const settingsItems = [
  {
    title: 'Política de retenção',
    description: 'Defina por quantos dias os arquivos ficam disponíveis no painel.',
  },
  {
    title: 'Integração com ERP',
    description: 'Conecte o sistema de gestão para envio automatizado de lançamentos.',
  },
  {
    title: 'Controle de acessos',
    description: 'Gerencie permissões por perfil: fiscal, pessoal e societário.',
  },
]

export function SettingsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Configurações"
        description="Parâmetros iniciais para segurança, integração e governança de documentos."
      />

      <section className="settings-grid">
        {settingsItems.map((item) => (
          <article key={item.title} className="surface-card">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
