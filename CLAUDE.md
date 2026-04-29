# Reglas del Proyecto — prolevelcode

## VPS — Reglas No Negociables

Este proyecto está deployado en VPS **178.156.176.15** (NO en Vercel).
Acceso SSH: `paramiko`, host=178.156.176.15, **port=443**, user=root, password=Zc8!xK2mP9nQ
(Puerto 22 bloqueado. HAProxy en 443 multiplexa SSH + HTTPS.)

### Arquitectura
```
Internet :443 → HAProxy → nginx :4443 (SNI routing) → Docker containers
prolevelcode.com → 127.0.0.1:4001
velocitysetups.com → 127.0.0.1:4002
truemark-ai → 127.0.0.1:4003
camisaspiratas.com → 127.0.0.1:4004
```

### REGLA #1 — nginx: SIEMPRE `listen 4443 ssl`
**NUNCA** `listen 127.0.0.1:4443 ssl`. Usar la IP explícita rompe el SNI routing para
TODOS los dominios del servidor (incidente 2026-04-29: prolevelcode servía cert de fashionmodelai).
Si certbot genera `127.0.0.1:4443` hay que cambiarlo a `4443` inmediatamente.

### REGLA #2 — nginx: probar antes de recargar
```bash
nginx -t && systemctl reload nginx   # siempre en este orden
```

### REGLA #3 — Docker: especificar servicio
```bash
docker compose build prolevelcode    # NO sin especificar servicio
docker compose up -d prolevelcode
```

### REGLA #4 — No `.bak` en sites-enabled
Archivos `.bak` en `/etc/nginx/sites-enabled/` son cargados por nginx y causan conflictos.

### REGLA #5 — DB migrations en producción
**NO** usar `prisma migrate dev` (reinicia la DB). Aplicar SQL directo via psql con DIRECT_URL.

### REGLA #6 — next.config.ts requiere `output: "standalone"`
El Dockerfile necesita standalone output. Esta línea debe estar siempre en next.config.ts.
Git no la trackea si fue añadida manualmente en el VPS — verificar después de cada `git pull`.

### REGLA #7 — pnpm-lock.yaml debe estar sincronizado
Antes de hacer build en VPS: regenerar lock localmente (`pnpm install`), commit y push.
Si no → `ERR_PNPM_OUTDATED_LOCKFILE` en Docker.

---

## Mapa Completo del VPS
Ver: `C:\Users\PC\.claude\projects\C--prolevelcode\memory\vps_infrastructure.md`

## Stack
- Next.js 16 App Router, TypeScript, Tailwind CSS v4, Framer Motion
- pnpm, Prisma + Supabase, Stripe, Bunny.net (videos)
- Docker (standalone build), nginx, HAProxy, Certbot

## Deploy Flow
```
1. pnpm install (local) → regenera lock si hay cambios de deps
2. git add . && git commit && git push
3. VPS: cd /apps/prolevelcode && git pull
4. VPS: cd /apps && docker compose build prolevelcode > /tmp/build.log 2>&1 &
5. Esperar ~7-10 min → docker compose up -d prolevelcode
6. Verificar: curl -sk https://prolevelcode.com/ → HTTP 200
```
