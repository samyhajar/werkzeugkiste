'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'

const links = [
  { href: '/digi-sammlung', label: 'Digi-Sammlung' },
  { href: '/fragen', label: 'Fragen' },
  { href: '/ueber-uns', label: 'Über Uns' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return (
    <header className="w-full bg-[#486681] text-background">
      <div className="w-full flex items-center justify-between py-3 px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Digi+ site-logo" width={120} height={32} priority />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 ml-auto mr-4 relative">
          {/* Suche link first */}
          <Link href="/#search" className={`text-sm hover:underline ${pathname === '/#search' ? 'font-semibold' : ''}`}>Suche</Link>
          {/* Lernmodule dropdown */}
          <div
            className="relative"
            ref={dropdownRef}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-sm hover:underline focus:outline-none">
              <span className="whitespace-nowrap">Lernmodule</span>
              <svg className="h-4 w-4 transition-transform" style={{transform: open ? 'rotate(180deg)' : 'rotate(0deg)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {open && (
              <ul className="absolute top-full left-0 mt-2 w-64 bg-[#486681] shadow-lg rounded p-4 space-y-4 z-50">
                {['Modul 1 – Einstieg in die digitale Welt','Modul 2 – Internet & E-Mails','Modul 3 – Digitale Sicherheit','Modul 4 – Jobs digital'].map((title, idx) => (
                  <li key={idx}>
                    <Link href="#" className="block text-background hover:underline">
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm hover:underline ${pathname === href ? 'font-semibold' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <Button asChild size="sm" variant="secondary">
          <Link href="/login">Einloggen</Link>
        </Button>
      </div>
    </header>
  )
}