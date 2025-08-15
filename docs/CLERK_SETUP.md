# Clerk Configuration Instructions

Para configurar Clerk en tu aplicación:

1. Ve a https://clerk.com y crea una cuenta
2. Crea una nueva aplicación
3. En el dashboard, ve a "API Keys"
4. Copia las claves y reemplaza en tu archivo .env.local:

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

## Configuración de proveedores OAuth (opcional)

En el dashboard de Clerk:
1. Ve a "User & Authentication" > "Social Connections"
2. Habilita los proveedores que desees (Google, GitHub, etc.)
3. Configura las credenciales OAuth de cada proveedor

## Personalización de la interfaz

En "Customization" puedes:
- Personalizar colores y branding
- Configurar los campos requeridos
- Personalizar emails de verificación

## Webhooks (para sincronización futura)

En "Webhooks" puedes configurar endpoints para:
- user.created
- user.updated
- user.deleted
