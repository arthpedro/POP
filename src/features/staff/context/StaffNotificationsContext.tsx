/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

type StaffNotificationType = 'success' | 'error'

type StaffNotification = {
  id: string
  type: StaffNotificationType
  message: string
  durationMs: number
}

type StaffNotificationInput = {
  type: StaffNotificationType
  message: string
  durationMs?: number
}

type StaffNotificationsContextValue = {
  notifications: StaffNotification[]
  notify: (input: StaffNotificationInput) => void
  dismiss: (id: string) => void
}

const DEFAULT_NOTIFICATION_DURATION_MS = 4200

const StaffNotificationsContext = createContext<StaffNotificationsContextValue | null>(null)

export function StaffNotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<StaffNotification[]>([])
  const timeoutIdsRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current

    return () => {
      timeoutIds.forEach((timeoutId) => {
        window.clearTimeout(timeoutId)
      })
      timeoutIds.clear()
    }
  }, [])

  const dismiss = (id: string) => {
    const timeoutId = timeoutIdsRef.current.get(id)

    if (timeoutId) {
      window.clearTimeout(timeoutId)
      timeoutIdsRef.current.delete(id)
    }

    setNotifications((currentItems) => currentItems.filter((item) => item.id !== id))
  }

  const notify = (input: StaffNotificationInput) => {
    const nextId = crypto.randomUUID()
    const durationMs = input.durationMs ?? DEFAULT_NOTIFICATION_DURATION_MS

    const nextNotification: StaffNotification = {
      id: nextId,
      type: input.type,
      message: input.message,
      durationMs,
    }

    setNotifications((currentItems) => [...currentItems, nextNotification])

    const timeoutId = window.setTimeout(() => {
      dismiss(nextId)
    }, durationMs)

    timeoutIdsRef.current.set(nextId, timeoutId)
  }

  const value: StaffNotificationsContextValue = {
    notifications,
    notify,
    dismiss,
  }

  return (
    <StaffNotificationsContext.Provider value={value}>
      {children}
    </StaffNotificationsContext.Provider>
  )
}

export function useStaffNotifications() {
  const context = useContext(StaffNotificationsContext)

  if (!context) {
    throw new Error('useStaffNotifications must be used within StaffNotificationsProvider')
  }

  return context
}

export function StaffNotificationsViewport() {
  const { notifications } = useStaffNotifications()

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="staff-toast-viewport" aria-live="polite" aria-atomic="false">
      {notifications.map((notification) => (
        <article
          key={notification.id}
          className={`staff-toast staff-toast-${notification.type}`}
          role="status"
          style={
            {
              '--staff-toast-duration': `${notification.durationMs}ms`,
            } as CSSProperties
          }
        >
          <p className="staff-toast-message">{notification.message}</p>
          <div className="staff-toast-progress" />
        </article>
      ))}
    </div>
  )
}
