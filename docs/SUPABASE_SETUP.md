# 🗄️ Configuración de Supabase para Dream Reader

## 📋 Pasos para configurar la base de datos

### 1. **Crear cuenta en Supabase**
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto

### 2. **Obtener las credenciales**
En tu dashboard de Supabase:
1. Ve a **Settings** > **API**
2. Copia el **Project URL** 
3. Copia la **anon/public key**

### 3. **Configurar variables de entorno**
Actualiza tu archivo `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 4. **Crear las tablas**
1. Ve al **SQL Editor** en tu dashboard de Supabase
2. Copia y ejecuta el contenido del archivo `supabase_schema.sql`
3. Las tablas se crearán automáticamente con:
   - **conversations**: Para almacenar conversaciones
   - **messages**: Para almacenar mensajes
   - **RLS policies**: Para seguridad a nivel de fila
   - **Triggers**: Para actualizar timestamps automáticamente

### 5. **Configurar RLS (Row Level Security)**
Las políticas de seguridad ya están incluidas en el schema:
- Los usuarios solo pueden ver sus propias conversaciones
- Los mensajes están protegidos por la relación con conversaciones
- Utiliza Clerk `user_id` para la autenticación

## 🏗️ Estructura de la base de datos

### Tabla `conversations`
```sql
- id (UUID, PK)
- user_id (VARCHAR, Clerk user ID)
- title (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Tabla `messages`
```sql
- id (UUID, PK)
- conversation_id (UUID, FK)
- role ('user' | 'assistant')
- content (TEXT)
- timestamp (TIMESTAMP)
- created_at (TIMESTAMP)
```

## 🔄 Funcionalidades implementadas

### ✅ **APIs REST**
- `GET /api/conversations` - Obtener todas las conversaciones del usuario
- `POST /api/conversations` - Crear nueva conversación
- `POST /api/conversations/[id]` - Agregar mensaje a conversación
- `PATCH /api/conversations/[id]` - Actualizar título de conversación

### ✅ **Hook personalizado**
- `useConversations()` - Manejo completo de estado
- Carga automática desde la base de datos
- Fallback a localStorage si falla la conexión
- Migración automática de datos locales

### ✅ **Funciones de base de datos**
- Crear/obtener conversaciones por usuario
- Agregar mensajes con timestamps
- Actualizar títulos y metadatos
- Eliminar conversaciones (cascade)
- Migración de datos locales

## 🚀 Migración automática

El sistema incluye migración automática de conversaciones locales:
1. **Detecta datos locales** existentes en localStorage
2. **Migra automáticamente** a la base de datos al autenticarse
3. **Limpia localStorage** después de migración exitosa
4. **Fallback graceful** si falla la conexión a DB

## 🔐 Seguridad

- **RLS activado**: Solo el propietario puede ver sus datos
- **Autenticación Clerk**: Integración completa con el sistema de auth
- **API protegida**: Todas las rutas requieren autenticación
- **Validación de entrada**: Datos sanitizados en el servidor

## 🧪 Probar la implementación

1. **Configura las credenciales** de Supabase
2. **Ejecuta las migraciones SQL**
3. **Inicia el servidor**: `npm run dev`
4. **Autentica con Clerk**
5. **Crea conversaciones** - deberían guardarse en Supabase
6. **Verifica en el dashboard** de Supabase que los datos se guardan

## 📊 Monitoreo

En el dashboard de Supabase puedes:
- Ver las tablas y datos en tiempo real
- Monitorear queries y performance
- Revisar logs de errores
- Configurar backups automáticos

## 🔄 Estado actual

```
✅ Esquema de base de datos creado
✅ APIs REST implementadas
✅ Hook personalizado con state management
✅ Migración automática de datos locales
✅ Fallback a localStorage
✅ Autenticación integrada con Clerk
🔄 Configuración de credenciales Supabase (pendiente)
🔄 Integración con la UI existente (siguiente paso)
```

Una vez configuradas las credenciales de Supabase, el sistema estará completamente funcional con persistencia en la nube.

---

**💡 Tip**: Supabase ofrece 500MB de storage y 2GB de bandwidth gratis, más que suficiente para empezar.
