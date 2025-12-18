import { createFileRoute } from '@tanstack/react-router'

import DataManagerPage from '@/features/data-manager/components/DataManagerPage'

export const Route = createFileRoute('/_authenticated/admin/data-sources')({
  component: DataManagerPage,
})

