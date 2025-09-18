# Plan: Implementación de Chat para Usuarios Invitados

## Objetivo
Implementar un flujo donde usuarios no registrados puedan probar el servicio con una consulta rápida desde la landing page, que los redirija al dashboard con el prompt prellenado y se inicie automáticamente un chat sin guardar en base de datos.

## Flujo de Usuario
1. Usuario visita la landing page
2. Introduce texto en el input o hace clic en uno de los chips de sueños predefinidos
3. Se redirige a `/dashboard?prompt=texto_del_prompt`
4. El dashboard detecta el prompt y lo envía automáticamente
5. Para usuarios no autenticados: ven la respuesta con banner para registrarse
6. Para usuarios autenticados: funciona normal y se guarda la conversación

## Cambios Necesarios

### 1. Actualizar Landing Page (`app/[locale]/page.tsx`)

**Funciones a agregar:**
```typescript
// Función para manejar el envío del input
const handleSubmitFromLanding = () => {
  if (input.trim()) {
    router.push(`/${locale}/dashboard?prompt=${encodeURIComponent(input.trim())}`)
  }
}

// Función para manejar clicks en los chips
const handleChipClick = (dreamText: string) => {
  router.push(`/${locale}/dashboard?prompt=${encodeURIComponent(dreamText)}`)
}
```

**Modificaciones:**
- Cambiar `handleSendMessage` por `handleSubmitFromLanding` en ChatInput
- Convertir chips de texto a botones clickeables con `onClick={handleChipClick}`
- Agregar imports: `useRouter`, `useParams`

### 2. Actualizar Hook de Chat (`hooks/useChatMessages.ts`)

**Nuevo useEffect para prompt inicial:**
```typescript
// Detectar prompt desde query params
const searchParams = useSearchParams()

useEffect(() => {
  const promptFromUrl = searchParams?.get('prompt')
  
  if (promptFromUrl && !activeConversationId) {
    updateState({ 
      input: promptFromUrl,
      isInitialChat: true 
    })
    
    // Auto-enviar después de 500ms
    setTimeout(() => {
      if (promptFromUrl.trim()) {
        handleSendMessage()
      }
    }, 500)
    
    // Limpiar query param de la URL
    const url = new URL(window.location.href)
    url.searchParams.delete('prompt')
    window.history.replaceState({}, '', url.toString())
  }
}, [searchParams, activeConversationId, updateState, handleSendMessage])
```

**Modificar función `handleSendMessage`:**
```typescript
// Manejar usuarios no autenticados
if (!user && state.isInitialChat) {
  conversationId = `temp-guest-${Date.now()}`
  setActiveConversationId(conversationId)
  updateState({ isInitialChat: false })
}

// Llamada diferente para guests vs usuarios autenticados
if (!user) {
  // Para guests: solo LLM sin guardar
  await callLLM(userMessage.content, conversationId, true) // isGuest = true
} else {
  // Usuario autenticado: flujo normal
  await addMessage(conversationId, 'user', userMessage.content)
  await callLLM(userMessage.content, conversationId, false)
}
```

### 3. Actualizar Dashboard (`app/[locale]/(dashboard-group)/dashboard/page.tsx`)

**Banner para usuarios no autenticados:**
```typescript
const { isSignedIn, user } = useUser()
const searchParams = useSearchParams()
const promptFromUrl = searchParams?.get('prompt')

if (promptFromUrl && !isSignedIn) {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Banner para registrarse */}
      <div className="bg-indigo-600 text-white p-4 text-center">
        <p className="text-sm">
          ¡Regístrate gratis para obtener tu interpretación! 
          <a href="/sign-up" className="underline ml-2">Crear cuenta</a>
        </p>
      </div>
      
      {/* Dashboard normal */}
      {/* ...existing dashboard content... */}
    </div>
  )
}
```

### 4. Modificar LLM Provider (`lib/llm-providers.ts`)

**Agregar parámetro `isGuest`:**
- Modificar función `callLLM` para aceptar parámetro `isGuest`
- Si `isGuest = true`, no intentar guardar mensajes en base de datos
- Solo procesar la respuesta del LLM y mostrarla en UI

### 5. Chips de Sueños Predefinidos

**Textos sugeridos:**
- "Soñar con agua"
- "Soñar con fuego" 
- "Soñar que caes"
- "Soñar con un familiar"
- "Soñar con un ex"

## Consideraciones Técnicas

### Manejo de Estado
- Usar query parameters para pasar el prompt inicial
- IDs temporales para conversaciones de guests: `temp-guest-${timestamp}`
- Limpiar query params después de procesar para evitar re-ejecuciones

### Base de Datos
- **NO guardar** conversaciones ni mensajes para usuarios no autenticados
- Mantener funcionalidad normal para usuarios registrados

### UX/UI
- Auto-envío del prompt después de 500ms de delay
- Banner discreto pero visible para incentivar registro
- Mantener toda la funcionalidad existente del dashboard

### Seguridad
- Validar y sanitizar prompts desde query parameters
- Limitar longitud de prompts para evitar URLs muy largas
- Rate limiting para usuarios no autenticados

## Archivos a Modificar

1. `app/[locale]/page.tsx` - Landing page
2. `hooks/useChatMessages.ts` - Hook principal de chat
3. `app/[locale]/(dashboard-group)/dashboard/page.tsx` - Dashboard
4. `lib/llm-providers.ts` - Providers de LLM
5. Posiblemente `hooks/useConversations.ts` - Para manejar conversaciones temporales

## Estados de Implementación

- [ ] Modificar landing page con redirects
- [ ] Actualizar hook de chat para detectar query params
- [ ] Implementar auto-envío de prompt inicial
- [ ] Agregar banner para usuarios no autenticados
- [ ] Modificar LLM provider para modo guest
- [ ] Testing del flujo completo
- [ ] Validaciones y edge cases

## Notas
- Los usuarios pueden probar el servicio sin registrarse
- Las conversaciones guest no persisten (se pierden al refrescar)
- Incentiva el registro mostrando el valor del producto
- Mantiene toda la funcionalidad existente para usuarios autenticados