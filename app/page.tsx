'use client'
import { redirect } from 'next/navigation'

export default function Home () {
  redirect('/es') // O el idioma por defecto que prefieras
  return null
}
