/**
 * CoreDataProvider — fuente única de verdad.
 *
 * OPTIMIZACIÓN DE RE-RENDERS:
 * Se usan 4 contextos separados en lugar de 1:
 *   - CoreAuthContext   → solo re-renderiza cuando cambia auth
 *   - CoreTasksContext  → solo cuando cambian tasks
 *   - CoreGroupsContext → solo cuando cambian groups
 *   - CoreDispatchContext → nunca re-renderiza (dispatch es estable)
 *
 * Un componente que solo lee tareas no re-renderiza cuando cambia un grupo.
 */
import { createContext, useReducer, useMemo, useEffect } from 'react'
import { coreReducer }              from './store/coreReducer'
import { initialState }             from './store/initialState'
import { useUserListener }          from './listeners/useUserListener'
import { usePersonalTasksListener } from './listeners/usePersonalTasksListener'
import { useGroupTasksListener }    from './listeners/useGroupTasksListener'
import { useGroupsListener }        from './listeners/useGroupsListener'
import { useOnlineStatus }          from './hooks/useOnlineStatus'
import { useRollover }              from './hooks/useRollover'

export const CoreDispatchContext = createContext(null)
export const CoreAuthContext     = createContext(null)
export const CoreTasksContext    = createContext(null)
export const CoreGroupsContext   = createContext(null)
export const CoreSyncContext     = createContext(null)

// Contexto combinado para compatibilidad con código existente
export const CoreStateContext    = createContext(null)

export function CoreDataProvider({ children }) {
  const [state, dispatch] = useReducer(coreReducer, initialState)

  const uid = state.auth.user?.uid ?? null

  const groupIdsKey = useMemo(
    () => Array.from(state.groups.list.keys()).sort().join(','),
    [state.groups.list]
  )

  useUserListener(dispatch)
  usePersonalTasksListener(uid, dispatch)
  useGroupTasksListener(groupIdsKey, dispatch)
  useGroupsListener(uid, dispatch)
  useOnlineStatus(dispatch)

  /* Rollover — mueve tareas personales vencidas al día actual */
  useRollover(uid)



  // Slices memoizados — cada contexto solo cambia cuando su slice cambia
  const authValue   = useMemo(() => state.auth,   [state.auth])
  const tasksValue  = useMemo(() => state.tasks,  [state.tasks])
  const groupsValue = useMemo(() => state.groups, [state.groups])
  const syncValue   = useMemo(() => state.sync,   [state.sync])

  return (
    <CoreDispatchContext.Provider value={dispatch}>
      <CoreStateContext.Provider value={state}>
        <CoreAuthContext.Provider value={authValue}>
          <CoreTasksContext.Provider value={tasksValue}>
            <CoreGroupsContext.Provider value={groupsValue}>
              <CoreSyncContext.Provider value={syncValue}>
                {children}
              </CoreSyncContext.Provider>
            </CoreGroupsContext.Provider>
          </CoreTasksContext.Provider>
        </CoreAuthContext.Provider>
      </CoreStateContext.Provider>
    </CoreDispatchContext.Provider>
  )
}
