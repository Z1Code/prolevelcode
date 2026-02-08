# Firebase Setup (Production)

## 1) Crear proyecto Firebase
- Crear proyecto en Firebase Console (region cercana a usuarios).
- Habilitar:
  - Authentication
  - Firestore Database
  - Storage
  - Hosting o App Hosting

## 2) Authentication
- Activar providers:
  - Email/Password
  - Email link (passwordless)
  - Google
- Dominios autorizados:
  - `localhost`
  - tu dominio final
- URL de callback usada por app:
  - `https://tu-dominio.com/auth/callback`
  - `http://localhost:3000/auth/callback`

## 3) Google OAuth
- En Google Cloud Console crear OAuth Client (Web).
- Authorized origins:
  - `http://localhost:3000`
  - `https://tu-dominio.com`
- Authorized redirect URIs:
  - `https://tu-dominio.com/auth/callback`

## 4) Firestore
- Crear DB en modo production.
- Aplicar reglas:
  - `firestore.rules`
- Aplicar indices:
  - `firestore.indexes.json`

## 5) Storage
- Crear bucket default o uno dedicado.
- Aplicar reglas:
  - `storage.rules`
- Buckets recomendados:
  - `course-thumbnails` (publico controlado)
  - `avatars` (publico)
  - `course-resources` (privado)

## 6) Variables de entorno
Configurar en local y en Firebase Hosting/App Hosting:
- Cliente Firebase:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
  - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (opcional)
- Admin SDK:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `FIREBASE_STORAGE_BUCKET`
- App/Stripe/Email:
  - `NEXT_PUBLIC_APP_URL`
  - `ADMIN_EMAILS`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `RESEND_API_KEY`
  - `TOKEN_DEFAULT_TTL`
  - `TOKEN_DEFAULT_MAX_VIEWS`
  - `TOKEN_IP_MODE`

## 7) Stripe
- Configurar webhook en Stripe:
  - `https://tu-dominio.com/api/webhook/stripe`
- Eventos:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `charge.refunded`

## 8) Deploy
### Opcion A (recomendada): Firebase App Hosting
- Conectar repo desde Firebase Console.
- Definir variables de entorno.
- Deploy continuo por push.

### Opcion B: Firebase Hosting + Frameworks
```bash
firebase login
firebase use --add
firebase deploy
```

## 9) Verificaciones finales
- Registro email y Google login
- Compra curso en Stripe test
- Acceso dashboard y reproduccion de video
- Expiracion/revocacion de token
- Acceso admin con `ADMIN_EMAILS`
