import {
  getPublicModulePdfData,
  ModulePdfNotFoundError,
} from '@/lib/module-pdf/data'
import {
  sanitizeModuleLessonHtml,
  withPdfCacheBust,
} from '@/lib/module-pdf/html'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

interface ModulePrintPageProps {
  params: Promise<{ id: string }>
}

export default async function ModulePrintPage({
  params,
}: ModulePrintPageProps) {
  const { id } = await params

  let moduleData
  try {
    moduleData = await getPublicModulePdfData(id)
  } catch (error) {
    if (error instanceof ModulePdfNotFoundError) {
      notFound()
    }
    throw error
  }

  return (
    <main className="module-pdf" data-module-pdf-ready="true">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4;
              margin: 18mm 15mm;
            }

            html,
            body {
              background: #ffffff !important;
              color: #24384c;
              font-family: var(--font-assistant), Arial, sans-serif;
              font-size: 13px;
              line-height: 1.6;
            }

            body {
              margin: 0;
            }

            .skip-link,
            [data-slot='dialog-overlay'],
            [data-slot='dialog-content'],
            [role='dialog'],
            [aria-modal='true'],
            .fixed.inset-0 {
              display: none !important;
            }

            .module-pdf {
              background: #ffffff;
              color: #24384c;
              margin: 0 auto;
              max-width: 760px;
            }

            .pdf-cover {
              min-height: 245mm;
              break-after: page;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
            }

            .pdf-cover h1 {
              color: #24384c;
              font-size: 44px;
              font-weight: 800;
              line-height: 1.12;
              margin: 14mm auto 0;
              max-width: 170mm;
              text-align: center;
              text-wrap: balance;
            }

            .pdf-cover-image {
              border-radius: 8px;
              display: block;
              height: 118mm;
              margin: 0 auto;
              object-fit: cover;
              width: 170mm;
            }

            .pdf-section {
              break-before: page;
            }

            .pdf-section:first-of-type {
              break-before: auto;
            }

            .pdf-section-title {
              border-bottom: 2px solid #de0647;
              color: #24384c;
              font-size: 28px;
              font-weight: 800;
              line-height: 1.2;
              margin: 0 0 9mm;
              padding-bottom: 4mm;
            }

            .pdf-toc {
              break-after: page;
            }

            .pdf-toc-list {
              list-style: none;
              margin: 0;
              padding: 0;
            }

            .pdf-toc-course {
              border-bottom: 1px solid #e5e7eb;
              margin-bottom: 7mm;
              padding-bottom: 6mm;
            }

            .pdf-toc-course h3 {
              color: #de0647;
              font-size: 18px;
              font-weight: 800;
              margin: 0 0 3mm;
            }

            .pdf-toc-course ol {
              color: #374151;
              margin: 0;
              padding-left: 6mm;
            }

            .pdf-toc-course li {
              margin-bottom: 1.5mm;
            }

            .pdf-course {
              break-before: page;
            }

            .pdf-course-header {
              margin-bottom: 9mm;
            }

            .pdf-course-kicker {
              color: #de0647;
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
            }

            .pdf-course h2 {
              color: #24384c;
              font-size: 30px;
              font-weight: 800;
              line-height: 1.15;
              margin: 2mm 0 3mm;
            }

            .pdf-course-description {
              color: #4b5563;
              font-size: 14px;
              margin: 0;
            }

            .pdf-lesson {
              break-inside: auto;
              margin-bottom: 11mm;
            }

            .pdf-lesson h3 {
              color: #486681;
              font-size: 21px;
              font-weight: 800;
              line-height: 1.25;
              margin: 0 0 4mm;
              break-after: avoid;
            }

            .pdf-empty {
              background: #f8fafc;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              color: #6b7280;
              font-style: italic;
              padding: 5mm;
            }

            .pdf-rich-content {
              color: #374151;
              font-size: 13.5px;
              line-height: 1.65;
            }

            .pdf-rich-content h1,
            .pdf-rich-content h2,
            .pdf-rich-content h3,
            .pdf-rich-content h4 {
              color: #de0647;
              font-weight: 800;
              line-height: 1.25;
              margin: 7mm 0 3mm;
              break-after: avoid;
            }

            .pdf-rich-content h1 {
              font-size: 27px;
            }

            .pdf-rich-content h2 {
              font-size: 23px;
            }

            .pdf-rich-content h3 {
              font-size: 19px;
            }

            .pdf-rich-content h4 {
              font-size: 16px;
            }

            .pdf-rich-content p {
              margin: 0 0 4mm;
            }

            .pdf-rich-content a {
              color: #de0647;
              text-decoration: underline;
              text-underline-offset: 2px;
            }

            .pdf-rich-content ul,
            .pdf-rich-content ol {
              margin: 0 0 4mm;
              padding-left: 7mm;
            }

            .pdf-rich-content li {
              margin-bottom: 1.5mm;
            }

            .pdf-rich-content blockquote {
              border-left: 4px solid #486681;
              color: #4b5563;
              margin: 5mm 0;
              padding: 2mm 0 2mm 5mm;
            }

            .pdf-rich-content img {
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              display: block;
              height: auto;
              margin: 5mm auto;
              max-width: 100%;
            }

            .pdf-rich-content table {
              border-collapse: collapse;
              margin: 5mm 0;
              width: 100%;
              break-inside: avoid;
            }

            .pdf-rich-content th,
            .pdf-rich-content td {
              border: 1px solid #d1d5db;
              padding: 2.5mm;
              text-align: left;
              vertical-align: top;
            }

            .pdf-rich-content th {
              background: #f3f4f6;
              color: #24384c;
              font-weight: 800;
            }

            .pdf-video-block {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              margin: 5mm 0;
              overflow: hidden;
              page-break-inside: avoid;
            }

            .pdf-video-block a {
              color: #ffffff;
              display: block;
              font-weight: 800;
              position: relative;
              text-decoration: none;
            }

            .pdf-video-block img {
              border: 0;
              border-radius: 0;
              margin: 0;
              width: 100%;
            }

            .pdf-video-block span {
              background: #de0647;
              border-radius: 999px;
              bottom: 5mm;
              left: 5mm;
              padding: 2mm 4mm;
              position: absolute;
            }

            .pdf-video-block figcaption {
              color: #486681;
              font-size: 12px;
              padding: 3mm 4mm;
              word-break: break-all;
            }

            @media print {
              html,
              body {
                background: #ffffff !important;
              }

              body::before,
              body::after {
                content: none !important;
                display: none !important;
              }

              .skip-link,
              [data-slot='dialog-overlay'],
              [data-slot='dialog-content'],
              [role='dialog'],
              [aria-modal='true'],
              .fixed.inset-0 {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
              }

              .module-pdf {
                background: #ffffff !important;
                box-shadow: none !important;
                filter: none !important;
                opacity: 1 !important;
              }
            }

            @media screen {
              body {
                background: #f3f4f6 !important;
                padding: 24px;
              }

              .module-pdf {
                box-shadow: 0 16px 40px rgb(15 23 42 / 12%);
                padding: 48px;
              }
            }
          `,
        }}
      />

      <section className="pdf-cover">
        <img
          className="pdf-cover-image"
          src={withPdfCacheBust(
            moduleData.hero_image || '/placeholder.png',
            moduleData.updated_at || moduleData.created_at || moduleData.id
          )}
          alt=""
        />
        <h1>{moduleData.title}</h1>
      </section>

      <section className="pdf-toc">
        <h2 className="pdf-section-title">Inhalt</h2>
        <ol className="pdf-toc-list">
          {moduleData.courses.map((course, courseIndex) => (
            <li key={course.id} className="pdf-toc-course">
              <h3>
                {courseIndex + 1}. {course.title}
              </h3>
              {course.lessons.length > 0 ? (
                <ol>
                  {course.lessons.map(lesson => (
                    <li key={lesson.id}>
                      {lesson.title || 'Unbenannte Lektion'}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="pdf-empty">Keine Lektionen verfügbar</p>
              )}
            </li>
          ))}
        </ol>
      </section>

      {moduleData.courses.map((course, courseIndex) => (
        <section key={course.id} className="pdf-course">
          <header className="pdf-course-header">
            <div className="pdf-course-kicker">Kurs {courseIndex + 1}</div>
            <h2>{course.title}</h2>
            {course.description && (
              <p className="pdf-course-description">{course.description}</p>
            )}
          </header>

          {course.lessons.length > 0 ? (
            course.lessons.map((lesson, lessonIndex) => {
              const lessonHtml = sanitizeModuleLessonHtml(
                lesson.content || lesson.markdown,
                {
                  cacheKey:
                    lesson.updated_at || lesson.created_at || lesson.id,
                }
              )

              return (
                <article key={lesson.id} className="pdf-lesson">
                  <h3>
                    {courseIndex + 1}.{lessonIndex + 1}{' '}
                    {lesson.title || 'Unbenannte Lektion'}
                  </h3>
                  {lessonHtml ? (
                    <div
                      className="pdf-rich-content"
                      dangerouslySetInnerHTML={{ __html: lessonHtml }}
                    />
                  ) : (
                    <p className="pdf-empty">Kein Inhalt verfügbar.</p>
                  )}
                </article>
              )
            })
          ) : (
            <p className="pdf-empty">Keine Lektionen verfügbar.</p>
          )}
        </section>
      ))}
    </main>
  )
}
