'use client'

import { useEffect } from 'react'

export default function DatenschutzerklaerungClient() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src =
      'https://webcache-eu.datareporter.eu/c/32870081-646d-477e-98ac-205b44d9c2f1/jEOudZRWor42/privacynotice.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-[#de0449] mb-6">Datenschutzerklärung</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* DataReporter Privacy Notice container */}
        <div id="dr-privacynotice-div"></div>

        {/* Fallback for users with JavaScript disabled */}
        <noscript>
          <iframe
            width="100%"
            frameBorder="0"
            style={{ minHeight: '400px' }}
            src="https://webcache-eu.datareporter.eu/c/32870081-646d-477e-98ac-205b44d9c2f1/jEOudZRWor42/Jap/privacynotice_noscript.html"
          ></iframe>
        </noscript>
      </div>
    </main>
  )
}
