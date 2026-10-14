'use client'

import * as React from 'react'

const emptySubscribe = () => () => {}

/**
 * Standard React 19 hook to detect client-side mounting without setState in useEffect.
 */
export function useIsMounted(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}
