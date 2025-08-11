'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getBrowserClient } from '@/lib/supabase/browser-client'

interface FAQItemProps {
  question: string
  answer: React.ReactNode
  isOpen?: boolean
}

function FAQItem({ question, answer, isOpen = false }: FAQItemProps) {
  const [open, setOpen] = useState(isOpen)

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        className="flex w-full items-center justify-between text-left focus:outline-none"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="text-gray-800">{question}</span>
        <svg
          className={`h-5 w-5 text-gray-600 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="mt-4 pr-8">
          <div className="text-gray-700 text-sm leading-relaxed">{answer}</div>
        </div>
      )}
    </div>
  )
}

export default function FragenPage() {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Fragen'
    ;(async () => {
      try {
        const supabase = getBrowserClient()
        const { data } = await supabase
          .from('static_pages')
          .select('content_html')
          .eq('slug', 'fragen')
          .single()
        if (data?.content_html) setHtml(data.content_html as string)
      } catch {}
    })()
  }, [])

  if (html) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        { }
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </main>
    )
  }
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* Header Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[#de0449] mb-6">Ungeklärte Fragen?</h1>
        <p className="text-gray-700">
          Schreib&apos; eine E-Mail an <a href="mailto:digiplus@arbeitplus.at" className="text-blue-600 underline">digiplus@arbeitplus.at</a>!
        </p>
      </div>

      {/* Neu hier? Einführung! Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-[#de0449] mb-8">Neu hier? Einführung!</h2>

        <div className="space-y-0">
          <FAQItem
            question="Muss ich mich registrieren?"
            answer={
              <div>
                <p className="mb-4">Nein, du kannst die gesamte Werkzeugkiste auch ohne Konto benutzen.</p>
                <p>Möchtest du am Kursende Zertifikate erhalten? Soll dein Lernfortschritt gespeichert werden? Dann lege hier ein Konto an.</p>
              </div>
            }
          />

          <FAQItem
            question="Wie starte ich den Kurs?"
            answer="Klicke/Tippe einfach auf eines der Module auf der Startseite."
          />

          <FAQItem
            question="Für wen ist der Kurs?"
            answer="Für alle, die Computer, Smartphones und das Internet privat oder beruflich nutzen wollen."
          />

          <FAQItem
            question="Ist der Kurs kostenlos?"
            answer="Ja. Alle Inhalte sind kostenlos! Das Projekt wurde von der Arbeiterkammer im Rahmen von Arbeit 4.0 finanziert."
          />

          <FAQItem
            question="Ich habe noch nie Computer/Smartphones benutzt. Kann ich den Kurs trotzdem machen?"
            answer="Ja, jeder und jede können den Kurs machen. Du benötigst für den Kurs kein Vorwissen."
          />

          <FAQItem
            question="Für welche Computer/Smartphones ist der Kurs geeignet?"
            answer={
              <div>
                <p className="mb-2">Im Moment sind die Inhalte für folgende Geräte geeignet:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Computer mit Microsoft Windows</li>
                  <li>Smartphones mit Google Android</li>
                </ul>
                <p className="mt-3">Inhalte für Apple iPhone kommen vielleicht später dazu.</p>
              </div>
            }
          />

          <FAQItem
            question="Wie ist der Kurs aufgebaut?"
            answer={
              <div>
                <p className="mb-2">Es gibt Module, Kurse und Lektionen:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Module (z. B. &quot;Modul 1 – Einstieg in die digitale Welt&quot;)</li>
                  <li>Kurse (z. B. &quot;Kurs 1 – Digitalisierung Basis&quot;)</li>
                  <li>Lektion 1 (z. B. &quot;Lektion 1 – Digital | Analog&quot;)</li>
                  <li>Lektion 2 (z. B. &quot;Lektion 2 – Dein digitaler Nutzen&quot;)</li>
                  <li>…</li>
                </ul>
              </div>
            }
          />

          <FAQItem
            question="Warum sind manche Wörter mit Punkten unterstrichen?"
            answer={
              <div>
                <p className="mb-3">Das ist das Kennzeichen für einen Fachbegriff. Wenn du den Mauszeiger hinziehst (Computer) bzw. drauf tippst (Smartphone) dann bekommst du sofort eine Erklärung des Wortes angezeigt.</p>
                <p>Ein Beispiel dafür ist: <span className="border-b border-dotted border-gray-600">Router</span>.</p>
              </div>
            }
          />
        </div>
      </section>

      {/* Während des Kurses Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-[#de0449] mb-8">Während des Kurses</h2>

        <div className="space-y-0">
          <FAQItem
            question="Wie kann ich den Text größer machen oder die Helligkeit einstellen?"
            answer={
              <div className="flex items-center gap-4">
                <p>Das funktioniert über das Zahnrad rechts oben</p>
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>Computer: Bewege den Mauszeiger darauf. Smartphone: Tippe darauf.</p>
              </div>
            }
          />

          <FAQItem
            question="Wie kann ich ein anderes Modul wählen?"
            answer={
              <div>
                <p className="mb-2">Computer: Bewege den Mauszeiger im oberen Bereich auf <span className="bg-blue-100 px-2 py-1 rounded text-sm">Lernmodule</span> und klicke auf ein Modul.</p>
                <p>Smartphone: Tippe rechts oben auf die drei Punkte <span className="text-xl">⋮</span> und dann auf &quot;Lernmodule&quot;.</p>
              </div>
            }
          />

          <FAQItem
            question="Wie komme ich zur nächsten Lektion oder zu einem anderen Kurs?"
            answer={
              <div>
                <p className="mb-2">Computer: Auf der linken Seite siehst du alle Kurse/Lektionen. Klick&apos; einfach auf den gewünschten Inhalt.</p>
                <p>Smartphone: wischst du von links nach rechts. Damit erscheinen alle Kurse/Lektionen. Tipp&apos; einfach auf den gewünschten Inhalt.</p>
              </div>
            }
          />
        </div>
      </section>

      {/* Für Trainer:innen Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-[#de0449] mb-8">Für Trainer:innen</h2>

        <div className="space-y-0">
          <FAQItem
            question="Wo bekomme ich didaktische Tips?"
            answer={
              <div>
                <p className="mb-4">Am Beginn jeder Modulseite gibt es einen Reiter &quot;Unterlagen für Vortragende&quot;:</p>

                                 <div className="mb-4">
                   <Image
                     src="/download (3).png"
                     alt="Unterlagen für Vortragende Tab"
                     width={400}
                     height={100}
                     className="rounded"
                   />
                 </div>

                <p>Hier findest du Ressourcen, Tipps, Hintergründe, Übungen und vieles mehr. Dieser Bereich steckt voller Unterstützung. Schau mal rein!</p>
              </div>
            }
          />

                     <FAQItem
             question="Wie kann ich Zertifikate erstellen?"
             answer={
               <div>
                 <p className="mb-4">Dafür müssen die Lernenden angemeldet sein! Nur so kann der Lernfortschritt dokumentiert werden.</p>
                 <p className="mb-4">Es gibt für jedes Modul ein eigenes Zertifikat, das automatisch nach Abschluss ALLER (!) Kurse des Moduls erstellt wird. Die Lernenden können es dann auf der jeweiligen Modulseite als PDF herunterladen.</p>
                 <div className="mb-4">
                   <Image
                     src="/allinhaltejedeskurs.png"
                     alt="Alle Inhalte jedes Kurses"
                     width={300}
                     height={200}
                     className="rounded"
                   />
                 </div>
               </div>
             }
           />
        </div>
      </section>

      {/* Nach dem Kurs Section */}
      <section>
        <h2 className="text-3xl font-bold text-[#de0449] mb-8">Nach dem Kurs</h2>

                 <div className="space-y-0">
           <FAQItem
             question="Wie kann ich weiterlernen?"
             answer={
               <div>
                 <p className="mb-4">Schau dir mal unsere Digi-Sammlung an. Dort sind viele spannende Links zum Ausprobieren.</p>
                 <div className="mb-4">
                   <Image
                     src="/nachedemkurs .png"
                     alt="Nach dem Kurs"
                     width={350}
                     height={200}
                     className="rounded"
                   />
                 </div>
               </div>
             }
           />
         </div>
      </section>
    </main>
  )
}