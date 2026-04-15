import type { FormEvent } from 'react'

type MessageState = {
  type: 'success' | 'error'
  text: string
}

type StaffLoginPanelProps = {
  defaultUser: {
    username: string
    password: string
  }
  username: string
  password: string
  message: MessageState | null
  onUsernameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function StaffLoginPanel({
  defaultUser,
  username,
  password,
  message,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: StaffLoginPanelProps) {
  return (
    <section className="content-card staff-login-card">
      <div className="staff-login-head">
        <h3>Acesso do Staff</h3>
        <p>Entre para editar setores, organizar arquivos e aplicar alterações administrativas.</p>
      </div>

      <div className="staff-login-credentials">
        <p className="staff-login-credentials-title">Credenciais de referência</p>
        <p>
          <strong>Usuário:</strong> {defaultUser.username}
        </p>
        <p>
          <strong>Senha:</strong> {defaultUser.password}
        </p>
      </div>

      <form className="staff-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Usuário</span>
          <input
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            autoComplete="username"
            placeholder="Digite o usuário"
          />
        </label>

        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            autoComplete="current-password"
            placeholder="Digite a senha"
          />
        </label>

        <button type="submit" className="primary-button">
          Entrar
        </button>
      </form>

      {message ? (
        <p
          className={`staff-feedback ${message.type === 'error' ? 'feedback-error' : 'feedback-success'}`}
        >
          {message.text}
        </p>
      ) : null}
    </section>
  )
}
