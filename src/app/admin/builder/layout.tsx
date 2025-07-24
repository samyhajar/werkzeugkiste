export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export default function AdminBuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}