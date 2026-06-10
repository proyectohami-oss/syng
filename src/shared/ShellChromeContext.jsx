import { createContext, useContext, useState } from 'react'

const ShellChromeContext = createContext({
  hideBottomNav: false,
  setHideBottomNav: () => {},
})

export function ShellChromeProvider({ children }) {
  const [hideBottomNav, setHideBottomNav] = useState(false)
  return (
    <ShellChromeContext.Provider value={{ hideBottomNav, setHideBottomNav }}>
      {children}
    </ShellChromeContext.Provider>
  )
}

export function useShellChrome() {
  return useContext(ShellChromeContext)
}
