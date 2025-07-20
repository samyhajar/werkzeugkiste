import Link from 'next/link'
import ScrollToTopButton from './ScrollToTopButton'

export default function Footer() {
  return (
    <footer className="w-full flex flex-col items-center text-center text-sm text-foreground/80 bg-white relative">
      {/* Legal bar */}
      <div className="w-full bg-gradient-to-b from-brand-primary to-brand-primary-hover text-white py-12 flex flex-col items-center gap-6 text-sm">
        <div className="text-center max-w-4xl px-4">
          <p className="mb-2">
            Alle Rechte vorbehalten arbeit.plus – Soziale Unternehmen Niederösterreich.
            Dieses Werk ist lizenziert unter einer Creative Commons Namensnennung 4.0 International Lizenz.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-blue-100">
          <Link href="/impressum" className="hover:text-white transition-colors">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-white transition-colors">
            Datenschutz
          </Link>
          <Link href="/kontakt" className="hover:text-white transition-colors">
            Kontakt
          </Link>
        </div>
      </div>

      <ScrollToTopButton />
    </footer>
  )
}