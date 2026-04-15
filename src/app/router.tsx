import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/app/layouts/AppLayout'
import { ClientsPage } from '@/pages/clients/ClientsPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { DocumentsPage } from '@/pages/documents/DocumentsPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { CustomSectorPage } from '@/pages/setor-custom/CustomSectorPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { StaffLayoutPage } from '@/pages/staff/StaffLayoutPage'
import { StaffSectorsPage } from '@/pages/staff/StaffSectorsPage'
import { StaffUsersPage } from '@/pages/staff/StaffUsersPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'documentos', element: <DocumentsPage /> },
      { path: 'clientes', element: <ClientsPage /> },
      { path: 'configuracoes', element: <SettingsPage /> },
      { path: 'setores/:sectorId', element: <CustomSectorPage /> },
      {
        path: 'staff',
        element: <StaffLayoutPage />,
        children: [
          { index: true, element: <Navigate to="setores" replace /> },
          { path: 'setores', element: <StaffSectorsPage /> },
          { path: 'usuarios', element: <StaffUsersPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
