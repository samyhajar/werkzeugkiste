import ScrollToTopButton from './ScrollToTopButton'

export default function Footer() {
  return (
    <footer className="w-full flex flex-col items-center text-center text-sm text-foreground/80 bg-white relative">
      {/* Legal bar */}
      <div className="w-full bg-gradient-to-b from-[#486681] to-[#37536a] text-white py-12 flex flex-col items-center gap-6 text-sm">
        <p className="max-w-5xl px-4">
          Alle Rechte vorbehalten arbeit&nbsp;plus &ndash; Soziale Unternehmen Niederösterreich.
          Dieses Werk ist lizenziert unter einer Creative Commons Namensnennung 4.0 International Lizenz.
        </p>
        <div className="flex flex-wrap justify-center gap-8 font-semibold tracking-wide">
          <a href="#impressum" className="hover:underline">Impressum</a>
          <a href="#datenschutz" className="hover:underline">Datenschutz</a>
          <a href="#kontakt" className="hover:underline">Kontakt</a>
        </div>
      </div>

      <ScrollToTopButton />
    </footer>
  )
}