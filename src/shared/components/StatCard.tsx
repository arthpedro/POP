type StatCardProps = {
  label: string
  value: string
  footnote: string
}

export function StatCard({ label, value, footnote }: StatCardProps) {
  return (
    <article className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-footnote">{footnote}</p>
    </article>
  )
}
