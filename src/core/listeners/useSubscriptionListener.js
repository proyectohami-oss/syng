import { useEffect, useRef } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { CORE_ACTIONS } from '../store/coreActions'
import { ensureSubscription, DEFAULT_PLAN_ID } from '../services/subscriptions.service'

export function useSubscriptionListener(uid, dispatch) {
  const unsubPlanRef = useRef(null)

  useEffect(() => {
    if (unsubPlanRef.current) {
      unsubPlanRef.current()
      unsubPlanRef.current = null
    }

    if (!uid) {
      dispatch({ type: CORE_ACTIONS.SET_SUBSCRIPTION, subscription: null })
      dispatch({ type: CORE_ACTIONS.SET_PLAN, plan: null })
      return
    }

    ensureSubscription(uid).catch(error => {
      console.error('[SubscriptionListener] ensureSubscription:', error)
    })

    const unsubSub = onSnapshot(
      doc(db, 'subscriptions', uid),
      (snap) => {
        if (unsubPlanRef.current) {
          unsubPlanRef.current()
          unsubPlanRef.current = null
        }

        if (!snap.exists()) {
          dispatch({ type: CORE_ACTIONS.SET_SUBSCRIPTION, subscription: null })
          dispatch({ type: CORE_ACTIONS.SET_PLAN, plan: null })
          return
        }

        const subscription = { id: snap.id, ...snap.data() }
        dispatch({ type: CORE_ACTIONS.SET_SUBSCRIPTION, subscription })

        const planId = subscription.planId || DEFAULT_PLAN_ID
        unsubPlanRef.current = onSnapshot(
          doc(db, 'subscription_plans', planId),
          (planSnap) => {
            dispatch({
              type: CORE_ACTIONS.SET_PLAN,
              plan: planSnap.exists() ? { id: planSnap.id, ...planSnap.data() } : null,
            })
          },
          (error) => console.error('[SubscriptionListener] plan snapshot:', error),
        )
      },
      (error) => console.error('[SubscriptionListener] subscription snapshot:', error),
    )

    return () => {
      unsubSub()
      if (unsubPlanRef.current) {
        unsubPlanRef.current()
        unsubPlanRef.current = null
      }
    }
  }, [uid, dispatch])
}
