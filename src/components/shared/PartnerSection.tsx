import Image from 'next/image'

const topRowLogos = [
  { src: '/small_arbeitplus_NOe.jpg', alt: 'arbeit plus NÖ', width: 220, height: 100 },
  { src: '/small_fhstp.jpg', alt: 'FH St. Pölten', width: 220, height: 100 },
  { src: '/ak-noe-logo-e1644578170238.jpg', alt: 'AK Niederösterreich', width: 220, height: 100 },
  { src: '/small_AK_EXTRA_LOGO_JPG.jpg', alt: 'AK extra', width: 220, height: 100 },
]

const bottomRowLogos = [
  { src: '/DSM-Mini-Web-Banner_quer_de_klein.png', alt: 'Digital Skills Map', width: 260, height: 100 },
  { src: '/B-WISE-Banner-mini.png', alt: 'B-WISE', width: 260, height: 100 },
  { src: '/erwachsenenbildung-Banner.png', alt: 'erwachsenenbildung.at', width: 260, height: 100 },
]

export default function PartnerSection() {
  return (
    <section className="w-full flex flex-col items-center gap-12 py-16 bg-white">
      {/* Top logos */}
      <div className="flex flex-wrap md:flex-nowrap justify-center items-center gap-10 md:gap-16 lg:gap-24 max-w-6xl w-full px-4">
        {topRowLogos.map((logo) => (
          <Image
            key={logo.src}
            src={logo.src}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            className="object-contain h-20 md:h-24 w-auto max-w-[160px] md:max-w-[220px]"
          />
        ))}
      </div>

      {/* Funding text */}
      <div className="space-y-6 max-w-4xl leading-relaxed text-center text-foreground/70 px-4">
        <p>
          Das Projekt Digi+ wurde 03/2020 bis 02/2022 von der Arbeiterkammer NÖ im Rahmen des Projektfonds&nbsp;4.0 gefördert.
        </p>
        <p>
          Ab 03/2022 erfolgt die Finanzierung durch das Landesnetzwerk von arbeit plus&nbsp;NÖ.
        </p>
      </div>

      {/* Bottom logos */}
      <div className="flex flex-wrap md:flex-nowrap justify-center items-center gap-10 md:gap-16 lg:gap-24 max-w-5xl w-full px-4">
        {bottomRowLogos.map((logo) => (
          <Image
            key={logo.src}
            src={logo.src}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            className="object-contain h-24 w-auto max-w-[200px] md:max-w-[260px]"
          />
        ))}
      </div>
    </section>
  )
}