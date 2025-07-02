import Image from 'next/image'
import ScrollToTopButton from './ScrollToTopButton'

const topRowLogos = [
  { src: '/small_arbeitplus_NOe.jpg', alt: 'arbeit plus NÖ' },
  { src: '/small_fhstp.jpg', alt: 'FH St. Pölten' },
  { src: '/ak-noe-logo-e1644578170238.jpg', alt: 'AK Niederösterreich' },
  { src: '/small_AK_EXTRA_LOGO_JPG.jpg', alt: 'AK extra' },
]

const bottomRowLogos = [
  { src: '/DSM-Mini-Web-Banner_quer_de_klein.png', alt: 'Digital Skills Map' },
  { src: '/B-WISE-Banner-mini.png', alt: 'B-WISE' },
  { src: '/erwachsenenbildung-Banner.png', alt: 'erwachsenenbildung.at' },
]

export default function Footer() {
  return (
    <footer className="mt-20 w-full flex flex-col items-center gap-12 pb-0 text-center text-sm text-foreground/80 md:gap-16 relative bg-white">
      <div className="w-full max-w-7xl px-4 flex flex-col items-center gap-12">
      {/* Top row logos */}
      <div className="flex flex-wrap md:flex-nowrap justify-center items-center gap-10 md:gap-16 lg:gap-24 max-w-6xl">
        {topRowLogos.map((logo) => (
          <Image
            key={logo.src}
            src={logo.src}
            alt={logo.alt}
            width={220}
            height={100}
            className="object-contain h-20 md:h-24 w-auto max-w-[160px] md:max-w-[220px]"
            priority={false}
          />
        ))}
      </div>

      {/* Funding text */}
      <div className="space-y-8 max-w-4xl leading-relaxed">
        <p>
          Das Projekt Digi+ wurde 03/2020 bis 02/2022 von der Arbeiterkammer NÖ im Rahmen des Projektfonds&nbsp;4.0 gefördert.
        </p>
        <p>
          Ab 03/2022 erfolgt die Finanzierung durch das Landesnetzwerk von arbeit plus&nbsp;NÖ.
        </p>
      </div>

      {/* Bottom row logos */}
      <div className="flex flex-wrap md:flex-nowrap justify-center items-center gap-10 md:gap-16 lg:gap-24 max-w-5xl">
        {bottomRowLogos.map((logo) => (
          <Image
            key={logo.src}
            src={logo.src}
            alt={logo.alt}
            width={260}
            height={100}
            className="object-contain h-24 w-auto max-w-[200px] md:max-w-[260px]"
          />
        ))}
      </div>
      </div>

      {/* Bottom legal bar */}
      <div className="w-full bg-[#486681] text-white py-10 mt-12 flex flex-col items-center gap-6 text-sm">
        <p className="max-w-5xl px-4">
          Alle Rechte vorbehalten arbeit&nbsp;plus &ndash; Soziale Unternehmen Niederösterreich.
          Dieses Werk ist lizenziert unter einer Creative Commons Namensnennung 4.0 International Lizenz.
        </p>
        <div className="flex flex-wrap justify-center gap-6 font-medium">
          <a href="#impressum" className="hover:underline">Impressum</a>
          <a href="#datenschutz" className="hover:underline">Datenschutz</a>
          <a href="#kontakt" className="hover:underline">Kontakt</a>
        </div>
      </div>

      {/* Scroll to top button */}
      <ScrollToTopButton />
    </footer>
  )
}