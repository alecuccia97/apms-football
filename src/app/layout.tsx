import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'APMS Football',
  description: 'Athlete Performance Management System — Football',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="dark">
      <body className={`${inter.className} bg-bg-primary text-text-primary antialiased`}>
        {children}
      </body>
    </html>
  )
}
