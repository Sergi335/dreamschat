import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GuestMessageCounter } from '@/components/guest-message-counter';
import * as useGuestSessionModule from '@/hooks/useGuestSession';

vi.mock('@/hooks/useGuestSession');

describe('GuestMessageCounter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería mostrar "0/3" para sesión nueva', () => {
    vi.mocked(useGuestSessionModule.useGuestSession).mockReturnValue({
      session: { messageCount: 0 } as any,
      loading: false,
      error: null,
      canCreateConversation: true,
      canSendMessage: true,
      incrementConversation: vi.fn(),
      incrementMessage: vi.fn(),
      reloadSession: vi.fn(),
    });

    render(<GuestMessageCounter />);
    expect(screen.getByText(/0\/3/)).toBeInTheDocument();
  });

  it('debería mostrar "2/3" después de 2 mensajes', () => {
    vi.mocked(useGuestSessionModule.useGuestSession).mockReturnValue({
      session: { messageCount: 2 } as any,
      loading: false,
      error: null,
      canCreateConversation: true,
      canSendMessage: true,
      incrementConversation: vi.fn(),
      incrementMessage: vi.fn(),
      reloadSession: vi.fn(),
    });

    render(<GuestMessageCounter />);
    expect(screen.getByText(/2\/3/)).toBeInTheDocument();
  });

  it('debería usar variant destructive en 3/3', () => {
    vi.mocked(useGuestSessionModule.useGuestSession).mockReturnValue({
      session: { messageCount: 3 } as any,
      loading: false,
      error: null,
      canCreateConversation: false,
      canSendMessage: false,
      incrementConversation: vi.fn(),
      incrementMessage: vi.fn(),
      reloadSession: vi.fn(),
    });

    const { container } = render(<GuestMessageCounter />);
    expect(screen.getByText(/3\/3/)).toBeInTheDocument();
    // Verificar que tiene la clase destructive
    const badge = container.querySelector('[class*="destructive"]');
    expect(badge).toBeInTheDocument();
  });

  it('no debería renderizar si está loading', () => {
    vi.mocked(useGuestSessionModule.useGuestSession).mockReturnValue({
      session: null,
      loading: true,
      error: null,
      canCreateConversation: false,
      canSendMessage: false,
      incrementConversation: vi.fn(),
      incrementMessage: vi.fn(),
      reloadSession: vi.fn(),
    });

    const { container } = render(<GuestMessageCounter />);
    expect(container.firstChild).toBeNull();
  });

  it('debería mostrar mensaje de registro en 3/3', () => {
    vi.mocked(useGuestSessionModule.useGuestSession).mockReturnValue({
      session: { messageCount: 3 } as any,
      loading: false,
      error: null,
      canCreateConversation: false,
      canSendMessage: false,
      incrementConversation: vi.fn(),
      incrementMessage: vi.fn(),
      reloadSession: vi.fn(),
    });

    render(<GuestMessageCounter />);
    expect(screen.getByText(/Regístrate/)).toBeInTheDocument();
  });

  it('no debería mostrar mensaje de registro en 2/3', () => {
    vi.mocked(useGuestSessionModule.useGuestSession).mockReturnValue({
      session: { messageCount: 2 } as any,
      loading: false,
      error: null,
      canCreateConversation: true,
      canSendMessage: true,
      incrementConversation: vi.fn(),
      incrementMessage: vi.fn(),
      reloadSession: vi.fn(),
    });

    render(<GuestMessageCounter />);
    expect(screen.queryByText(/Regístrate/)).not.toBeInTheDocument();
  });
});
