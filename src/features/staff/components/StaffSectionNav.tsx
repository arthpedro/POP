import { NavLink } from 'react-router-dom'

export function StaffSectionNav() {
  return (
    <nav className="staff-section-nav" aria-label="Navegação do staff">
      <NavLink
        to="/staff/setores"
        className={({ isActive }) => `staff-section-link${isActive ? ' is-active' : ''}`}
      >
        Manutenção de setores
      </NavLink>
      <NavLink
        to="/staff/usuarios"
        className={({ isActive }) => `staff-section-link${isActive ? ' is-active' : ''}`}
      >
        Manutenção de usuários
      </NavLink>
    </nav>
  )
}
