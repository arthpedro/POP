import { useState, type FormEvent } from 'react'
import { useStaffNotifications } from '@/features/staff/context/StaffNotificationsContext'
import type { StaffUser } from '@/features/staff/types/staff'
import { useStaffAuth } from '@/features/staff/context/StaffAuthContext'

export function StaffUsersPage() {
  const { currentUser, staffUsers, createUser, updateUser, removeUser } = useStaffAuth()
  const { notify } = useStaffNotifications()
  const [createUserError, setCreateUserError] = useState<string | null>(null)
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editUserError, setEditUserError] = useState<string | null>(null)
  const [newUserDisplayName, setNewUserDisplayName] = useState('')
  const [newUserUsername, setNewUserUsername] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [editUserDisplayName, setEditUserDisplayName] = useState('')
  const [editUserUsername, setEditUserUsername] = useState('')
  const [editUserPassword, setEditUserPassword] = useState('')
  const [userToRemove, setUserToRemove] = useState<StaffUser | null>(null)

  const openCreateUserModal = () => {
    setIsCreateUserModalOpen(true)
    setCreateUserError(null)
  }

  const closeCreateUserModal = () => {
    setIsCreateUserModalOpen(false)
    setCreateUserError(null)
    setNewUserDisplayName('')
    setNewUserUsername('')
    setNewUserPassword('')
  }

  const openEditUserModal = (user: StaffUser) => {
    setEditingUserId(user.id)
    setEditUserDisplayName(user.displayName)
    setEditUserUsername(user.username)
    setEditUserPassword('')
    setEditUserError(null)
    setIsEditUserModalOpen(true)
  }

  const closeEditUserModal = () => {
    setIsEditUserModalOpen(false)
    setEditingUserId(null)
    setEditUserDisplayName('')
    setEditUserUsername('')
    setEditUserPassword('')
    setEditUserError(null)
  }

  const handleCreateUserSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = await createUser({
      displayName: newUserDisplayName,
      username: newUserUsername,
      password: newUserPassword,
    })

    if (!result.ok) {
      setCreateUserError(result.message ?? 'Não foi possível criar o usuário.')
      return
    }

    notify({
      type: 'success',
      message: result.message ?? 'Usuário criado com sucesso.',
    })
    closeCreateUserModal()
  }

  const handleEditUserSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingUserId) {
      setEditUserError('Usuário não encontrado.')
      return
    }

    const result = await updateUser({
      id: editingUserId,
      displayName: editUserDisplayName,
      username: editUserUsername,
      password: editUserPassword,
    })

    if (!result.ok) {
      setEditUserError(result.message ?? 'Não foi possível atualizar o usuário.')
      return
    }

    notify({
      type: 'success',
      message: result.message ?? 'Usuário atualizado com sucesso.',
    })
    closeEditUserModal()
  }

  const handleRemoveUser = (user: StaffUser) => {
    setUserToRemove(user)
  }

  const closeRemoveUserModal = () => {
    setUserToRemove(null)
  }

  const handleConfirmRemoveUser = async () => {
    if (!userToRemove) {
      return
    }

    const result = await removeUser(userToRemove.id)

    notify({
      type: result.ok ? 'success' : 'error',
      message: result.message ?? 'Não foi possível remover o usuário.',
    })

    closeRemoveUserModal()
  }

  return (
    <section className="table-card staff-users-card">
      <div className="staff-users-head staff-users-head-row">
        <div>
          <h3>Usuários administrativos</h3>
        </div>
        <button type="button" className="primary-button" onClick={openCreateUserModal}>
          Novo usuário
        </button>
      </div>

      <div className="staff-users-list" role="list" aria-label="Usuários administrativos">
        {staffUsers.map((user) => (
          <article key={user.id} className="staff-user-item" role="listitem">
            <p className="staff-user-name">{user.displayName}</p>
            <p className="staff-user-username">@{user.username}</p>
            <p className="staff-user-role">Permissão: Admin</p>
            <div className="staff-user-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => openEditUserModal(user)}
              >
                Editar
              </button>
              {currentUser?.id !== user.id ? (
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => handleRemoveUser(user)}
                >
                  Remover
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {isCreateUserModalOpen ? (
        <div className="modal-backdrop" onClick={closeCreateUserModal}>
          <section
            className="staff-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="alert-headline">
              <h3 id="create-user-modal-title">Novo usuário administrativo</h3>
            </div>

            <p className="modal-description">
              O usuário criado terá as mesmas permissões administrativas do perfil principal.
            </p>

            <form className="staff-form" onSubmit={handleCreateUserSubmit}>
              <label className="field">
                <span>Nome de exibição</span>
                <input
                  value={newUserDisplayName}
                  onChange={(event) => setNewUserDisplayName(event.target.value)}
                  placeholder="Ex.: Maria Oliveira"
                  autoFocus
                />
              </label>

              <label className="field">
                <span>Usuário</span>
                <input
                  value={newUserUsername}
                  onChange={(event) => setNewUserUsername(event.target.value)}
                  placeholder="Ex.: maria.oliveira"
                  autoComplete="off"
                />
              </label>

              <label className="field">
                <span>Senha</span>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(event) => setNewUserPassword(event.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  autoComplete="new-password"
                />
              </label>

              {createUserError ? <p className="feedback-error">{createUserError}</p> : null}

              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={closeCreateUserModal}>
                  Cancelar
                </button>
                <button type="submit" className="primary-button">
                  Criar usuário
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {isEditUserModalOpen ? (
        <div className="modal-backdrop" onClick={closeEditUserModal}>
          <section
            className="staff-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="alert-headline">
              <h3 id="edit-user-modal-title">Editar usuário</h3>
            </div>

            <form className="staff-form" onSubmit={handleEditUserSubmit}>
              <label className="field">
                <span>Nome de exibição</span>
                <input
                  value={editUserDisplayName}
                  onChange={(event) => setEditUserDisplayName(event.target.value)}
                  placeholder="Ex.: Maria Oliveira"
                  autoFocus
                />
              </label>

              <label className="field">
                <span>Usuário</span>
                <input
                  value={editUserUsername}
                  onChange={(event) => setEditUserUsername(event.target.value)}
                  placeholder="Ex.: maria.oliveira"
                  autoComplete="off"
                />
              </label>

              <label className="field">
                <span>Nova senha (opcional)</span>
                <input
                  type="password"
                  value={editUserPassword}
                  onChange={(event) => setEditUserPassword(event.target.value)}
                  placeholder="Somente se desejar alterar"
                  autoComplete="new-password"
                />
              </label>

              {editUserError ? <p className="feedback-error">{editUserError}</p> : null}

              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={closeEditUserModal}>
                  Cancelar
                </button>
                <button type="submit" className="primary-button">
                  Salvar alterações
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {userToRemove ? (
        <div className="modal-backdrop" onClick={closeRemoveUserModal}>
          <section
            className="staff-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-user-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="alert-headline">
              <h3 id="remove-user-modal-title">Confirmar exclusão</h3>
            </div>

            <p className="modal-description">
              Deseja remover o usuário <strong>{userToRemove.displayName}</strong>?
            </p>

            <div className="modal-actions">
              <button type="button" className="ghost-button" onClick={closeRemoveUserModal}>
                Cancelar
              </button>
              <button type="button" className="danger-button" onClick={handleConfirmRemoveUser}>
                Remover usuário
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}
