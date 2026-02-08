# ProLevelCode Platform

Plataforma full-stack (Next.js App Router + Firebase + Stripe) para:
- Servicios de desarrollo web/IA
- Venta y consumo de cursos en video
- Dashboard de estudiante
- Panel admin
- Reproduccion segura con tokens auto-destruibles

## Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + Framer Motion
- Firebase Auth + Firestore + Storage + Hosting/App Hosting
- Stripe Checkout + Webhooks
- Resend (emails transaccionales)
- Prisma (tipos de dominio)

## Rutas principales
- Publico: `/`, `/servicios`, `/cursos`, `/cursos/[slug]`, `/sobre-mi`, `/contacto`
- Auth: `/login`, `/registro`, `/recuperar`, `/auth/callback`
- Estudiante: `/dashboard`, `/dashboard/cursos`, `/dashboard/cursos/[slug]`, `/dashboard/perfil`
- Admin: `/admin`, `/admin/cursos`, `/admin/servicios`, `/admin/usuarios`, `/admin/tokens`, `/admin/pagos`, `/admin/contacto`, `/admin/configuracion`

## APIs
- `POST /api/auth/session`
- `POST /api/checkout/course`
- `POST /api/checkout/service`
- `POST /api/webhook/stripe`
- `POST /api/tokens/generate`
- `POST /api/tokens/validate`
- `POST /api/tokens/revoke`
- `GET /api/video/[tokenId]`
- `POST /api/contact`
- `GET /api/admin/analytics`

## Setup local
1. Instalar dependencias:
```bash
pnpm install
```
2. Copiar variables:
```bash
cp .env.example .env.local
```
3. Configurar Firebase/Stripe/Resend en `.env.local`.
4. Levantar app:
```bash
pnpm dev
```

## Firebase
- Setup paso a paso: `docs-firebase-setup.md`
- Reglas Firestore: `firestore.rules`
- Indices Firestore: `firestore.indexes.json`
- Reglas Storage: `storage.rules`

## Testing
```bash
pnpm test
pnpm test:e2e
```

## Deploy en Firebase
1. Instalar CLI:
```bash
npm i -g firebase-tools
firebase login
```
2. Configurar el proyecto:
```bash
firebase use --add
```
3. Desplegar con App Hosting (recomendado para Next.js SSR) desde consola Firebase conectando este repo, o con frameworks desde CLI:
```bash
firebase deploy
```
4. Configurar webhook de Stripe a:
- `https://tu-dominio.com/api/webhook/stripe`

## Nota de seguridad
La proteccion de video (watermark + token + TTL + rate limit + logs) es disuasiva y robusta para uso comercial, pero no elimina al 100% la posibilidad de grabacion externa de pantalla.
