'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300) // show after 300px
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-[9999] rounded-full bg-background p-3 shadow-lg ring-1 ring-foreground/10 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition"
    >
      <ArrowUp className="h-5 w-5 text-foreground" />
    </button>
  )
}