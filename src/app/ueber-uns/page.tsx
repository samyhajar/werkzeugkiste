import Image from 'next/image'

export const metadata = { title: 'Über Uns' }

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'

export default function UeberUnsPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      {/* Header Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-[#de0449] mb-8">Digi +</h1>
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="md:w-2/3">
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>arbeit plus – Soziale Unternehmen Niederösterreich</strong> entwickelte gemeinsam
              mit der <strong>FH St. Pölten</strong> (Ilse Arlt Institut für Soziale Inklusionsforschung) im
              Rahmen des Projektfonds Arbeit 4.0 der <strong>Arbeiterkammer Niederösterreich</strong> das
              Projekt <strong>Digi +</strong> für Soziale Unternehmen.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Die Mitarbeiter:innen, also <strong>Schlüsselarbeitskräfte</strong> (Berater:innen,
              Arbeitsanleiter:innen) und deren <strong>Klient:innen</strong> (Transitmitarbeiter:innen,
              Teilnehmer:innen, zu Beratende), treten dabei in einen Lernprozess, der den
              (Wieder-)Einstieg in den Arbeitsmarkt erleichtert. Im Zuge dessen werden selbst
              erarbeitete, digitale Kenntnisse erlernt und vertieft und voneinander gelernt.
              Dadurch leistet Digi + einen wertvollen Beitrag zu <strong>(digitaler) Inklusion</strong> und
              <strong>gesellschaftlicher Teilhabe</strong>.
            </p>
          </div>
          <div className="md:w-1/3">
            <Image
              src="/Modul-1-Digitalisierung-e1655816152674.png"
              alt="Digitale Werkzeugkiste"
              width={400}
              height={250}
              className="rounded-lg shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Project Development Section */}
      <div className="mb-16">
        <p className="text-gray-700 leading-relaxed mb-6">
          Zu Beginn des Projekts wurden vorhandene technischen Ressourcen analysiert. Die Ergebnisse kombinierten wir dann mit den Ergebnissen einer
          Nutzer:innenbefragung und vorhandenem Wissen aus der Literatur. Auf diesen Faktoren basierend wurden Konzepte zur <strong>Steigerung der digitalen
          Grundkompetenzen</strong> bei den Schlüsselarbeitskräften und Klient:innen entwickelt.
        </p>

        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="md:w-1/2">
            <Image
              src="/Modul-1-Digitalisierung-e1655816152674.png"
              alt="Digitalisierung Module"
              width={400}
              height={200}
              className="rounded-lg shadow-md"
            />
          </div>
          <div className="md:w-1/2">
            <p className="text-gray-700 leading-relaxed mb-4">
              Im Rahmen von Digi + erhielten Klient:innen der Sozialen Unternehmen in
              regionalen Workshops die Möglichkeit, ihre digitalen Kompetenzen zu steigern
              und eventuell vorhandene Abwehrhaltungen zu hinterfragen. Darüber hinaus
              wurden auch <strong>Weiterbildungsseminare (train-the-trainer)</strong> für
              Schlüsselarbeitskräfte angeboten.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Im Sinne der Nachhaltigkeit wurde die <strong>digitale Werkzeugkiste</strong> erarbeitet. Die
              <strong>online Lernplattform</strong> ist <strong>kostenfrei zugänglich</strong>. Den Kern bilden die
              Lernmodule, die sowohl im individuellen Selbststudium als auch unter
              Anleitung von Schlüsselarbeitskräften erarbeitet werden können. Darüber
              hinaus bietet die Werkzeugkiste eine Sammlung nützlicher Links,
              Hintergrundinformationen, Hinweise zu Fördermöglichkeiten, zu
              Weiterbildungsanbietern u.v.m. rund um das Thema Digitalisierung.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 italic">
            Florian Zahorka, Johannes Pflegerl, Maria Nirnsee, Alois Huber
          </p>
        </div>
      </div>

      {/* Goal Section */}
      <div className="bg-gray-50 rounded-lg p-8 mb-16">
        <h2 className="text-2xl font-bold text-[#de0449] mb-4">Ziel</h2>
        <p className="text-gray-700 leading-relaxed">
          Alle Arbeitsschritte und Angebote sollen der Steigerung der Wiedereinstiegschancen in den Arbeitsmarkt dienen.
        </p>
      </div>

      {/* Services Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-[#de0449] mb-6">Services</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span>Folder "Werkzeugkiste" </span>
            <strong>als PDF</strong>
            <a href="#" className="text-blue-600 underline ml-2">herunterladen</a>
          </div>
          <div className="flex items-center gap-2">
            <span>Digi + Logo als </span>
            <strong>JPG</strong>
            <a href="#" className="text-blue-600 underline ml-2">herunterladen</a>
          </div>
          <p className="text-gray-700">
            Bei Fragen, Anregungen oder Beschwerden wenden Sie sich bitte an <strong>digiplus@arbeitplus.at</strong>.
          </p>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-[#de0449] mb-12">Ablauf</h2>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-300"></div>

          {/* Timeline Items */}
          <div className="space-y-16">

            {/* March 2020 - Projektstart Digi + */}
            <div className="flex items-center">
              <div className="w-1/2 pr-8 text-right">
                <div className="text-[#de0449] font-bold">März 2020</div>
                <div className="text-gray-500 text-sm">Projektstart</div>
              </div>
              <div className="relative z-10">
                <div className="w-4 h-4 bg-[#de0449] rounded-full border-4 border-white shadow-lg"></div>
              </div>
              <div className="w-1/2 pl-8">
                <div className="bg-[#486681] text-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-bold mb-2">Projektstart Digi +</h3>
                  <p className="text-sm">
                    Das Projekt Digi + erhält eine Förderzusage im Rahmen des
                    Projektfonds 4.0 der AK Niederösterreich.
                  </p>
                </div>
              </div>
            </div>

            {/* March 2020 - Research */}
            <div className="flex items-center">
              <div className="w-1/2 pr-8">
                <div className="bg-[#486681] text-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-bold mb-2">Recherche und vorbereitende Erhebungen</h3>
                                     <p className="text-sm">
                     Für die Erstellung der Schulungsmaterialien wird eine
                     vorbereitende Erhebung per Telefoninterviews, einem
                     Onlinefragebogen, sowie eine umfangreiche Quellenrecherche
                     durchgeführt. Die gewonnenen Informationen dienen als
                     Ausgangsbasis für das zu erstellende Schulungskonzept.
                   </p>
                </div>
              </div>
              <div className="relative z-10">
                <div className="w-4 h-4 bg-[#de0449] rounded-full border-4 border-white shadow-lg"></div>
              </div>
              <div className="w-1/2 pl-8 text-left">
                <div className="text-[#de0449] font-bold">März 2020</div>
                <div className="text-gray-500 text-sm">Projektstart</div>
              </div>
            </div>

            {/* July 2020 - First Training */}
            <div className="flex items-center">
              <div className="w-1/2 pr-8 text-right">
                <div className="text-[#de0449] font-bold">Juli 2020</div>
                <div className="text-gray-500 text-sm">Digi+ Schulungen</div>
              </div>
              <div className="relative z-10">
                <div className="w-4 h-4 bg-[#de0449] rounded-full border-4 border-white shadow-lg"></div>
              </div>
              <div className="w-1/2 pl-8">
                <div className="bg-[#486681] text-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-bold mb-2">Digi + Schulungen Teil 1</h3>
                                     <p className="text-sm">
                     Die ersten Digi + Schulungen finden in insgesamt acht
                     sozialintegrativen Unternehmen in Niederösterreich statt. Dabei
                     werden 13 Schlüsselarbeitskräfte und 50 Klient:innen bei
                     insgesamt 35 Terminen erreicht:
                   </p>
                </div>
              </div>
            </div>

            {/* September 2020 - Evaluation */}
            <div className="flex items-center">
              <div className="w-1/2 pr-8">
                <div className="bg-[#486681] text-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-bold mb-2">Evaluation</h3>
                  <p className="text-sm">
                    In Gruppendiskussionen werden die Erkenntnisse aus den Digi +
                    Schulungen Teil 1 mit Teilnehmer:innen reflektiert. Es zeigt sich,
                    dass ein digitales Tool, sowie eine digitale Assistenz für Soziale
                    Unternehmen notwendig sind.
                  </p>
                </div>
              </div>
              <div className="relative z-10">
                <div className="w-4 h-4 bg-[#de0449] rounded-full border-4 border-white shadow-lg"></div>
              </div>
              <div className="w-1/2 pl-8 text-left">
                <div className="text-[#de0449] font-bold">September 2020</div>
                <div className="text-gray-500 text-sm">Evaluation</div>
              </div>
            </div>

            {/* November 2020 - Second Training */}
            <div className="flex items-center">
              <div className="w-1/2 pr-8 text-right">
                <div className="text-[#de0449] font-bold">November 2020</div>
                <div className="text-gray-500 text-sm">Digi+ Schulungen Teil 2</div>
              </div>
              <div className="relative z-10">
                <div className="w-4 h-4 bg-[#de0449] rounded-full border-4 border-white shadow-lg"></div>
              </div>
              <div className="w-1/2 pl-8">
                <div className="bg-[#486681] text-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-bold mb-2">Digi + Schulungen Teil 2</h3>
                                     <p className="text-sm">
                     Mit einem adaptierten Schulungskonzept finden die Digi +
                     Schulungen Teil 2 in 13 Sozialen Unternehmen statt. Dabei
                     werden 41 Schlüsselarbeitskräfte und 45 Klient:innen bei
                     insgesamt 53 Terminen erreicht:
                   </p>
                </div>
              </div>
            </div>

            {/* February 2021 - Evaluation 2 */}
            <div className="flex items-center">
              <div className="w-1/2 pr-8">
                <div className="bg-[#486681] text-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-bold mb-2">Evaluation 2</h3>
                  <p className="text-sm">
                    Ebenso werden die zweiten Schulungen evaluiert. Die bereits
                    gewonnenen Erkenntnisse hinsichtlich digitalem Tool und
                    Assistenz werden verfeinert.
                  </p>
                </div>
              </div>
              <div className="relative z-10">
                <div className="w-4 h-4 bg-[#de0449] rounded-full border-4 border-white shadow-lg"></div>
              </div>
              <div className="w-1/2 pl-8 text-left">
                <div className="text-[#de0449] font-bold">Februar 2021</div>
                <div className="text-gray-500 text-sm">Evaluation 2</div>
              </div>
            </div>

            {/* March 2021 - Start der Werkzeugkiste */}
            <div className="flex items-center">
              <div className="w-1/2 pr-8 text-right">
                <div className="text-[#de0449] font-bold">März 2021</div>
                <div className="text-gray-500 text-sm">Digi+ Werkzeugkiste</div>
              </div>
              <div className="relative z-10">
                <div className="w-4 h-4 bg-[#de0449] rounded-full border-4 border-white shadow-lg"></div>
              </div>
              <div className="w-1/2 pl-8">
                <div className="bg-[#486681] text-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-bold mb-2">Start der Werkzeugkiste</h3>
                                     <p className="text-sm">
                     Das Team einigt sich auf ein Tool zur Erstellung der Werkzeugkiste,
                     welche unter werkzeugkiste.arbeitplus.at realisiert wird.
                   </p>
                </div>
              </div>
            </div>

            {/* February 2022 - Abschluss Digi + */}
            <div className="flex items-center">
              <div className="w-1/2 pr-8">
                <div className="bg-[#486681] text-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-bold mb-2">Abschluss Digi +</h3>
                                     <p className="text-sm">
                     Im Rahmen der Abschlussveranstaltung wird auf die Bedeutung
                     der digitalen Assistenz hingewiesen, sowie die Digi +
                     Werkzeugkiste vorgestellt.
                   </p>
                </div>
              </div>
              <div className="relative z-10">
                <div className="w-4 h-4 bg-[#de0449] rounded-full border-4 border-white shadow-lg"></div>
              </div>
              <div className="w-1/2 pl-8 text-left">
                <div className="text-[#de0449] font-bold">Februar 2022</div>
                <div className="text-gray-500 text-sm">Digi + Werkzeugkiste & Digitale Assistenz</div>
              </div>
            </div>

            {/* August 2022 - Final */}
            <div className="flex items-center">
              <div className="w-1/2 pr-8 text-right">
                <div className="text-[#de0449] font-bold">August 2022</div>
                <div className="text-gray-500 text-sm">Digitale Werkzeugkiste</div>
              </div>
              <div className="relative z-10">
                <div className="w-4 h-4 bg-[#486681] rounded-full border-4 border-white shadow-lg"></div>
              </div>
              <div className="w-1/2 pl-8">
                <div className="bg-[#486681] text-white p-6 rounded-lg shadow-md">
                                     <h3 className="text-lg font-bold mb-2">Digitale Assistenz & Abschluss Werkzeugkiste</h3>
                   <p className="text-sm mb-4">
                     Alle Module der Werkzeugkiste sind befüllt. Die Inhalte werden
                     weiterhin fortlaufend aktualisiert.
                   </p>
                   <p className="text-sm">
                     Darüber hinaus erfolgen Vor-Ort-Kurse und Online-
                     Veranstaltungen im Rahmen der <strong>Digitalen Assistenz</strong>.
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </main>
  )
}