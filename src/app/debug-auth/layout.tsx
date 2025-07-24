export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export default function DebugAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}