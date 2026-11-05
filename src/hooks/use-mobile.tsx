import * as React from "react"

const MOBILE_BREAKPOINT = 768

const mobileQuery = () => window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
const subscribe = (notify: () => void) => {
  const query = mobileQuery()
  query.addEventListener("change", notify)
  return () => query.removeEventListener("change", notify)
}
const getSnapshot = () => mobileQuery().matches
const getServerSnapshot = () => false

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
