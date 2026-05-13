import { useContext } from 'react'
import {
  CoreStateContext,
  CoreDispatchContext,
  CoreAuthContext,
  CoreTasksContext,
  CoreGroupsContext,
  CoreSyncContext,
} from '../CoreDataProvider'

function assertContext(ctx, name) {
  if (!ctx) throw new Error(`${name} must be used inside <CoreDataProvider>`)
  return ctx
}

// Contexto completo (compatibilidad con código existente)
export function useCoreState()    { return assertContext(useContext(CoreStateContext),    'useCoreState') }
export function useCoreDispatch() { return assertContext(useContext(CoreDispatchContext), 'useCoreDispatch') }
export function useCoreData()     { return { state: useCoreState(), dispatch: useCoreDispatch() } }

// Contextos granulares — usar en componentes nuevos para menos re-renders
export function useCoreAuth()   { return assertContext(useContext(CoreAuthContext),   'useCoreAuth') }
export function useCoreTasks()  { return assertContext(useContext(CoreTasksContext),  'useCoreTasks') }
export function useCoreGroups() { return assertContext(useContext(CoreGroupsContext), 'useCoreGroups') }
export function useCoreSync()   { return assertContext(useContext(CoreSyncContext),   'useCoreSync') }
