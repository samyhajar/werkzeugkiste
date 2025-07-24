export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export default function AdminTestAccessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}