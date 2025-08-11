import Link from 'next/link'
import { listStaticPages } from '@/services/staticPages'

export const dynamic = 'force-dynamic'

export default async function AdminPagesList() {
  // Use server-side Supabase client with cookies, just like other admin pages
  const pages = await listStaticPages()
  return (
    <div className="w-full px-8 py-8 space-y-8 bg-transparent min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Seiten</h1>
          <p className="text-white mt-2">Statische Inhalte wie Über uns, Fragen und Digi-Sammlung</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[#486681] to-[#3e5570]">
                <th className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider">Titel</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider">Slug</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-white tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pages.map((p) => (
                <tr key={p.id} className="bg-white hover:bg-gray-100 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{p.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">/{p.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-end">
                      <Link href={`/admin/pages/${p.slug}`} className="px-3 py-1 text-sm bg-[#486681] hover:bg-[#3e5570] text-white rounded-md shadow-sm transition-colors">
                        Bearbeiten
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
