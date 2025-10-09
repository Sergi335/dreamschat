import { describe, it, expect, beforeEach } from 'vitest';
import { getFingerprint, loadFingerprint } from '@/lib/fingerprint';

describe('Fingerprint', () => {
  beforeEach(() => {
    // Reset the fingerprint cache before each test
    vi.clearAllMocks();
  });

  it('debería generar un fingerprint único', async () => {
    const fp1 = await getFingerprint();
    expect(fp1).toBeDefined();
    expect(typeof fp1).toBe('string');
    expect(fp1.length).toBeGreaterThan(10);
  });

  it('debería devolver el mismo fingerprint en múltiples llamadas', async () => {
    const fp1 = await getFingerprint();
    const fp2 = await getFingerprint();
    expect(fp1).toBe(fp2);
  });

  it('debería cargar la librería FingerprintJS', async () => {
    const fpAgent = await loadFingerprint();
    expect(fpAgent).toBeDefined();
    expect(fpAgent.get).toBeDefined();
  });
});
