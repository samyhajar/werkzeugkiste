import Image from 'next/image'

const topRowLogos = [
  { src: 'https://res.cloudinary.com/dqmofjqca/image/upload/v1757084221/BKA_Logo_srgb_exrmsd.png', alt: 'Bundeskanzleramt', width: 220, height: 100 },
  { src: 'https://res.cloudinary.com/dqmofjqca/image/upload/v1757084194/Digital_Austria_Logo_RGB_lkk5by.png', alt: 'Digital Austria', width: 220, height: 100 },
  { src: 'https://res.cloudinary.com/dqmofjqca/image/upload/v1757084209/OeAD_Logo_DK_RGB_Kompatkversion_yr0jxw.png', alt: 'OeAD', width: 220, height: 100 },
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
            className="object-contain h-28 md:h-32 max-w-[220px] md:max-w-[280px]"
          />
        ))}
      </div>

      {/* Funding text */}
      <div className="space-y-6 max-w-4xl leading-relaxed text-center text-foreground/70 px-4">
        <p>
          Das Projekt Digi+ wurde 03/2020 bis 02/2022 von der Arbeiterkammer NÖ im Rahmen des Projektfonds&nbsp;4.0 gefördert.
        </p>
        <p>
          Die Finanzierung der „digitalen Werkzeugkiste plus" erfolgt durch das Bundeskanzleramt, die Koordination übernimmt der OeAD (Geschäftsstelle Digitale Kompetenzen).
        </p>
      </div>

    </section>
  )
}