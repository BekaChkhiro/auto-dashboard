import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

/**
 * Hook that returns true after the component has mounted on the client.
 * Useful for preventing hydration mismatches with Radix UI components
 * that generate dynamic IDs.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)
}
