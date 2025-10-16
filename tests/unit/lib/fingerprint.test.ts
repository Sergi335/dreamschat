import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the FingerprintJS library
const mockGet = vi.fn().mockResolvedValue({ visitorId: 'mocked_visitor_id' })
const mockLoad = vi.fn().mockResolvedValue({ get: mockGet })

vi.mock('@fingerprintjs/fingerprintjs', () => ({
  default: {
    load: mockLoad
  }
}))

describe('Fingerprint', () => {
  beforeEach(async () => {
    // Resetea los módulos antes de cada prueba para aislar el estado
    vi.resetModules()
  })

  afterEach(() => {
    // Limpia el historial de los mocks después de cada prueba
    vi.clearAllMocks()
  })

  it('debería cargar la librería FingerprintJS', async () => {
    // Importa dinámicamente para obtener la instancia reseteada del módulo
    const { loadFingerprint } = await import('@/lib/fingerprint')
    const fpAgent = await loadFingerprint()
    expect(fpAgent).toBeDefined()
    expect(fpAgent.get).toBeDefined()
    expect(mockLoad).toHaveBeenCalledTimes(1)
  })

  it('debería generar un fingerprint único', async () => {
    const { getFingerprint } = await import('@/lib/fingerprint')
    const fp1 = await getFingerprint()
    expect(fp1).toBe('mocked_visitor_id')
    expect(mockLoad).toHaveBeenCalledTimes(1)
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('debería devolver el mismo fingerprint en múltiples llamadas', async () => {
    const { getFingerprint } = await import('@/lib/fingerprint')
    const fp1 = await getFingerprint()
    const fp2 = await getFingerprint()
    expect(fp1).toBe(fp2)
    // `load` y `get` solo deberían ser llamados una vez gracias al cacheo
    expect(mockLoad).toHaveBeenCalledTimes(1)
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('debería manejar errores al cargar la librería FingerprintJS', async () => {
    const loadError = new Error('FP Load Error')
    mockLoad.mockRejectedValueOnce(loadError)

    const { getFingerprint } = await import('@/lib/fingerprint')

    await expect(getFingerprint()).rejects.toThrow('Failed to generate device fingerprint')
  })
})
