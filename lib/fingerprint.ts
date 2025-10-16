import FingerprintJS, { Agent } from '@fingerprintjs/fingerprintjs'

let fpPromise: Promise<Agent> | null = null
let fingerprint: string | null = null // Añade una variable para cachear el fingerprint

export const loadFingerprint = () => {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
  }
  return fpPromise
}

export const getFingerprint = async (): Promise<string> => {
  // Si ya tenemos el fingerprint, lo devolvemos directamente
  if (fingerprint) {
    return fingerprint
  }

  try {
    const fp = await loadFingerprint()
    const result = await fp.get()
    fingerprint = result.visitorId // Guardamos el fingerprint en la caché
    return fingerprint
  } catch (error) {
    console.error('Failed to generate device fingerprint:', error)
    throw new Error('Failed to generate device fingerprint')
  }
}
