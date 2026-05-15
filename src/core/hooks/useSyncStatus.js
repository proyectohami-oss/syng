import { useContext } from 'react'
import { CoreSyncContext } from '../CoreDataProvider'

export function useSyncStatus() {
  const sync = useContext(CoreSyncContext)
  if (!sync) return { status: 'online', label: 'Sincronizado' }

  const { online, fromCache, hasPendingWrites } = sync
  if (!online)          return { status: 'offline',  label: 'Sin conexión' }
  if (hasPendingWrites) return { status: 'syncing',  label: 'Guardando...' }
  if (fromCache)        return { status: 'cached',   label: 'Sincronizado' }
  return                       { status: 'online',   label: 'Sincronizado' }
}
