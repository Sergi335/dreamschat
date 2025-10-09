import FingerprintJS from '@fingerprintjs/fingerprintjs'

let fpPromise: Promise<FingerprintJS.Agent> | null = null

export async function loadFingerprint () {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
  }
  return fpPromise
}

export async function getFingerprint (): Promise<string> {
  try {
    const fp = await loadFingerprint()
    const result = await fp.get()
    return result.visitorId
  } catch (error) {
    console.error('Error generating fingerprint:', error)
    throw new Error('Failed to generate device fingerprint')
  }
}
