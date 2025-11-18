import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Self-Optimization Orchestrator',
  description: 'Automated GitHub repository health analyzer and improvement orchestrator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
