"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { CRYPTO_POLL_INTERVAL_MS } from "@/lib/crypto/config";

/* ─── types ─── */

type PaymentStatus = "loading" | "pending" | "completed" | "expired" | "error";
type PayMethod = "onchain" | "qr" | "binanceid";
type OnchainNet = "bsc" | "solana";

interface OrderInfo {
  orderId: string;
  amountUsdt: string;
  walletAddress: string;
  solanaAddress: string;
  binanceId: string;
  expiresAt: string;
  type: string;
  targetId: string;
  createdAt: string;
}

/* ─── component ─── */

export default function CryptoPayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order");

  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [method, setMethod] = useState<PayMethod>("onchain");
  const [net, setNet] = useState<OnchainNet>("bsc");
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [waitingLong, setWaitingLong] = useState(false);

  // ── fetch order ──
  useEffect(() => {
    if (!orderId) { setStatus("error"); return; }
    fetch(`/api/crypto/order-info?order=${encodeURIComponent(orderId)}`, { credentials: "include" })
      .then((r) => { if (!r.ok) throw 0; return r.json(); })
      .then((d: OrderInfo) => { setOrder(d); setStatus("pending"); })
      .catch(() => setStatus("error"));
  }, [orderId]);

  // ── poll for on-chain payment ──
  useEffect(() => {
    if (status !== "pending" || !orderId) return;
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`/api/crypto/check-payment?order=${encodeURIComponent(orderId)}`, { credentials: "include" });
        if (!r.ok) return;
        const d = await r.json();
        if (d.status === "completed") { setStatus("completed"); clearInterval(iv); setTimeout(() => router.push(d.redirectUrl || "/dashboard"), 3000); }
        else if (d.status === "expired") { setStatus("expired"); clearInterval(iv); }
      } catch { /* retry */ }
    }, CRYPTO_POLL_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [status, orderId, router]);

  // ── countdown ──
  useEffect(() => {
    if (!order?.expiresAt) return;
    const tick = () => {
      const ms = new Date(order.expiresAt).getTime() - Date.now();
      if (ms <= 0) { setTimeLeft("Expirado"); setStatus("expired"); return; }
      setTimeLeft(`${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [order?.expiresAt]);

  // ── detect long wait (20min on-chain, 60min manual) ──
  useEffect(() => {
    if (status !== "pending" || !order?.createdAt) return;
    const checkLongWait = () => {
      const elapsed = Date.now() - new Date(order.createdAt).getTime();
      const isManual = method === "qr" || method === "binanceid";
      const threshold = isManual ? 60 * 60 * 1000 : 20 * 60 * 1000;
      if (elapsed >= threshold) setWaitingLong(true);
    };
    checkLongWait();
    const t = setInterval(checkLongWait, 30_000);
    return () => clearInterval(t);
  }, [status, order?.createdAt, method]);

  async function handleRetry() {
    if (!order) return;
    setRetrying(true);
    try {
      const endpoint = order.type === "tier"
        ? "/api/checkout/crypto/tier"
        : "/api/checkout/crypto/course";
      const body = order.type === "tier"
        ? { tier: order.targetId }
        : { courseId: order.targetId };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error al crear nueva orden");
      const { url } = await res.json();
      router.push(url);
    } catch {
      alert("Error al reintentar. Intenta de nuevo.");
      setRetrying(false);
    }
  }

  const copy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const toggleGuide = (id: string) => setExpandedGuide((p) => (p === id ? null : id));

  /* ── status screens ── */

  if (status === "loading") return <Shell><p className="text-slate-400">Cargando orden...</p></Shell>;

  if (status === "error" || !order) return (
    <Shell>
      <Card className="max-w-md p-6 text-center">
        <p className="text-red-400">Orden no encontrada o invalida.</p>
        <a href="/cursos" className="mt-4 inline-block text-sm text-slate-400 hover:text-white">Volver a cursos</a>
      </Card>
    </Shell>
  );

  if (status === "completed") return (
    <Shell>
      <Card className="max-w-md p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
          <span className="text-3xl text-emerald-400">&#10003;</span>
        </div>
        <h2 className="text-xl font-bold">Pago confirmado</h2>
        <p className="mt-2 text-sm text-slate-400">Verificado en la blockchain. Redirigiendo...</p>
      </Card>
    </Shell>
  );

  if (status === "expired") return (
    <Shell>
      <Card className="max-w-md p-6 text-center">
        <p className="text-amber-400">Esta orden ha expirado.</p>
        <p className="mt-2 text-sm text-slate-400">Puedes generar una nueva orden con un clic.</p>
        <div className="mt-4 flex flex-col items-center gap-3">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="rounded-xl bg-emerald-500/15 px-6 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
          >
            {retrying ? "Creando nueva orden..." : "Reintentar pago"}
          </button>
          <a href="/cursos" className="text-xs text-slate-500 hover:text-white transition">Volver a cursos</a>
        </div>
      </Card>
    </Shell>
  );

  /* ── current addresses ── */
  const currentAddress = net === "bsc" ? order.walletAddress : order.solanaAddress;
  const networkLabel = net === "bsc" ? "BSC (BEP-20)" : "Solana (SPL)";

  /* ── main payment screen ── */

  return (
    <main className="container-wide section-spacing liquid-section">
      <div className="mx-auto max-w-lg space-y-4">

        {/* ── Amount header ── */}
        <Card className="p-5">
          <p className="text-xs text-slate-400">Total a pagar</p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-3xl font-bold text-emerald-300">{order.amountUsdt} USDT</span>
            <button onClick={() => copy(order.amountUsdt, "amount")} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15 transition">
              {copied === "amount" ? "Copiado" : "Copiar monto"}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-amber-300">El monto incluye centavos unicos para identificar tu pago automaticamente.</p>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              <span className="text-xs text-slate-300">Esperando pago...</span>
            </div>
            <span className="font-mono text-xs text-slate-400">{timeLeft}</span>
          </div>
        </Card>

        {/* ── Method tabs ── */}
        <div className="flex gap-1.5 rounded-xl bg-white/5 p-1">
          <MethodTab active={method === "onchain"} onClick={() => setMethod("onchain")} label="Transferencia USDT" badge="Instantaneo" badgeColor="emerald" />
          <MethodTab active={method === "qr"} onClick={() => setMethod("qr")} label="QR Binance" badge="~2h" badgeColor="amber" />
          <MethodTab active={method === "binanceid"} onClick={() => setMethod("binanceid")} label="Binance ID" badge="~2h" badgeColor="amber" />
        </div>

        {/* ════════════════════════════════════════════════════════
            METHOD 1: On-chain transfer (BSC / Solana)
            ════════════════════════════════════════════════════════ */}
        {method === "onchain" && (
          <Card className="p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Transferencia directa USDT</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Verificacion automatica en 1-5 minutos. La forma mas rapida.
              </p>
            </div>

            {/* Network selector */}
            <div className="flex gap-2">
              <button onClick={() => setNet("bsc")} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${net === "bsc" ? "bg-amber-500/15 text-amber-300" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                BNB Smart Chain (BEP-20)
              </button>
              <button onClick={() => setNet("solana")} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${net === "solana" ? "bg-violet-500/15 text-violet-300" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                Solana (SPL)
              </button>
            </div>

            {/* Address + QR */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Direccion de destino ({networkLabel})</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-black/30 px-2 py-1.5 font-mono text-xs text-white">{currentAddress}</code>
                <button onClick={() => copy(currentAddress, "addr")} className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15 transition">
                  {copied === "addr" ? "Copiado" : "Copiar"}
                </button>
              </div>
              <div className="mt-3 flex justify-center">
                <div className="rounded-xl bg-white p-3">
                  <QRCodeSVG value={currentAddress} size={160} level="M" />
                </div>
              </div>
            </div>

            {/* Network warning */}
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
              <p className="text-xs text-red-300">
                {net === "bsc" ? (
                  <><strong>Red:</strong> BNB Smart Chain (BEP-20). Si envias por ERC-20, TRC-20 u otra red, los fondos se perderan.</>
                ) : (
                  <><strong>Red:</strong> Solana. Envia solo USDT (SPL) en la red Solana. No uses otra red.</>
                )}
              </p>
            </div>

            {/* Guide: BEP-20 from Binance */}
            {net === "bsc" && (
              <GuideAccordion id="bsc" expanded={expandedGuide} onToggle={toggleGuide} title="Como enviar desde Binance (BEP-20)">
                <GuideSteps steps={bscSteps(order)} />
                <BscFaq />
              </GuideAccordion>
            )}

            {/* Guide: Solana */}
            {net === "solana" && (
              <GuideAccordion id="sol" expanded={expandedGuide} onToggle={toggleGuide} title="Como enviar USDT por Solana">
                <GuideSteps steps={solanaSteps(order)} />
                <SolanaFaq />
              </GuideAccordion>
            )}
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════
            METHOD 2: Binance QR (manual)
            ════════════════════════════════════════════════════════ */}
        {method === "qr" && (
          <Card className="p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Pago via QR de Binance</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Escanea el QR desde tu app de Binance. Verificacion manual.
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-200">
                Este metodo usa transferencia interna de Binance (off-chain). No se detecta automaticamente.
                <strong> Tu pago sera verificado manualmente en un plazo de ~2 horas.</strong>
              </p>
            </div>

            {/* QR */}
            <div className="flex flex-col items-center gap-3">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/binance-pay-qr.jpg" alt="Binance Pay QR" width={220} height={220} className="block" />
              </div>
              <p className="text-xs text-slate-400">Abre Binance → Escanear → Apunta al QR</p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-xs text-slate-300">
                <strong>Monto exacto:</strong>{" "}
                <span className="font-mono text-emerald-300">{order.amountUsdt} USDT</span>
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                Asegurate de enviar el monto exacto e incluye tu numero de orden en el mensaje/nota.
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/5 p-3">
              <p className="text-[10px] text-slate-500">Orden: <span className="font-mono text-slate-400">{order.orderId}</span></p>
            </div>

            <GuideAccordion id="qr" expanded={expandedGuide} onToggle={toggleGuide} title="Como pagar con QR de Binance (paso a paso)">
              <GuideSteps steps={qrSteps(order)} />
            </GuideAccordion>
          </Card>
        )}

        {/* ════════════════════════════════════════════════════════
            METHOD 3: Binance ID (manual)
            ════════════════════════════════════════════════════════ */}
        {method === "binanceid" && (
          <Card className="p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Pago via Binance Pay (ID)</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Envia USDT usando el Binance ID. Verificacion manual.
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-200">
                Este metodo usa transferencia interna de Binance (off-chain). No se detecta automaticamente.
                <strong> Tu pago sera verificado manualmente en un plazo de ~2 horas.</strong>
              </p>
            </div>

            {/* Binance ID */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-slate-400">Binance ID</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl font-bold font-mono text-white">{order.binanceId}</span>
                <button onClick={() => copy(order.binanceId, "bid")} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15 transition">
                  {copied === "bid" ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-xs text-slate-300">
                <strong>Monto exacto:</strong>{" "}
                <span className="font-mono text-emerald-300">{order.amountUsdt} USDT</span>
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                Incluye tu numero de orden en el mensaje/nota del envio.
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/5 p-3">
              <p className="text-[10px] text-slate-500">Orden: <span className="font-mono text-slate-400">{order.orderId}</span></p>
            </div>

            <GuideAccordion id="bid" expanded={expandedGuide} onToggle={toggleGuide} title="Como enviar con Binance ID (paso a paso)">
              <GuideSteps steps={binanceIdSteps(order)} />
            </GuideAccordion>
          </Card>
        )}

        {/* ── Long wait: retry option ── */}
        {waitingLong && (
          <Card className="border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-amber-300">
              {method === "onchain"
                ? "Han pasado mas de 20 minutos sin detectar tu pago."
                : "Han pasado mas de 60 minutos sin validacion manual."}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Si ya enviaste el pago, contactanos con tu numero de orden. Si no, puedes generar una nueva orden.
            </p>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="mt-3 rounded-lg bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/25 disabled:opacity-50"
            >
              {retrying ? "Creando nueva orden..." : "Generar nueva orden"}
            </button>
          </Card>
        )}

        {/* ── Soporte ── */}
        <Card className="p-4">
          <p className="text-xs text-slate-400">
            Problemas con tu pago? Contactanos con tu numero de orden
            {method !== "onchain" ? " y el comprobante de la transaccion." : " y el TxID de la transaccion."}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            Orden: <span className="font-mono text-slate-400">{order.orderId}</span>
          </p>
          <p className="mt-2 text-[10px] text-slate-500">
            Verificamos la blockchain automaticamente cada 15 segundos. No cierres esta pagina si pagaste por BEP-20 o Solana.
          </p>
        </Card>
      </div>
    </main>
  );
}

/* ─── Reusable sub-components ─── */

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="container-wide section-spacing liquid-section flex items-center justify-center">{children}</main>;
}

function MethodTab({ active, onClick, label, badge, badgeColor }: { active: boolean; onClick: () => void; label: string; badge: string; badgeColor: "emerald" | "amber" }) {
  const colors = badgeColor === "emerald"
    ? "bg-emerald-500/15 text-emerald-300"
    : "bg-amber-500/15 text-amber-300";
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg px-2 py-2 text-center text-xs font-medium transition ${active ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"}`}
    >
      <span className="block">{label}</span>
      <span className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${colors}`}>{badge}</span>
    </button>
  );
}

function GuideAccordion({ id, expanded, onToggle, title, children }: { id: string; expanded: string | null; onToggle: (id: string) => void; title: string; children: React.ReactNode }) {
  const open = expanded === id;
  return (
    <div className="rounded-xl border border-white/5 overflow-hidden">
      <button onClick={() => onToggle(id)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition">
        <span className="text-xs font-semibold text-slate-300">{title}</span>
        <span className={`text-slate-500 text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>&#9660;</span>
      </button>
      {open && <div className="border-t border-white/5 px-4 pb-4 pt-3">{children}</div>}
    </div>
  );
}

function GuideSteps({ steps }: { steps: { text: string; sub?: string; warn?: string; highlight?: boolean }[] }) {
  return (
    <ol className="space-y-3 text-sm text-slate-300">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3">
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${s.highlight ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white leading-relaxed">{s.text}</p>
            {s.sub && <p className="mt-0.5 text-[11px] text-slate-400 leading-relaxed">{s.sub}</p>}
            {s.warn && (
              <div className="mt-1 rounded-lg border border-red-500/20 bg-red-500/5 px-2 py-1">
                <p className="text-[10px] text-red-300">{s.warn}</p>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ─── Step definitions per method ─── */

function bscSteps(order: OrderInfo) {
  return [
    { text: "Abre la app de Binance", sub: "Inicia sesion en tu cuenta (app movil o web)." },
    { text: 'Ve a "Billetera" → "Retirar"', sub: 'Toca Retirar (Withdraw). NO uses "Enviar via Binance Pay" — esas transferencias son internas y no se detectan.' },
    { text: "Selecciona la moneda: USDT", sub: 'Busca "USDT" (Tether) en la lista de criptomonedas.' },
    { text: "Pega la direccion de destino", sub: `Copia la direccion que aparece arriba. Verifica que empiece con 0x527e...` },
    { text: 'Selecciona la red: BSC (BEP20)', sub: 'En la lista de redes, elige "BSC" o "BNB Smart Chain (BEP20)".', warn: "Si eliges ERC20, TRC20 u otra red, los fondos se perderan y no podremos recuperarlos.", highlight: true },
    { text: `Ingresa el monto exacto: ${order.amountUsdt} USDT`, sub: "El monto incluye centavos unicos. Copia el monto con el boton de arriba." },
    { text: "Confirma el retiro", sub: "Revisa los datos, confirma con 2FA y envia. Binance cobra ~0.30 USDT de comision de red (aparte del monto)." },
    { text: "Espera la confirmacion", sub: "Normalmente tarda 1-5 minutos. Esta pagina detecta el pago automaticamente.", highlight: true },
  ];
}

function solanaSteps(order: OrderInfo) {
  return [
    { text: "Abre tu wallet de Solana", sub: "Phantom, Solflare, Binance (Retirar), o cualquier wallet compatible con Solana." },
    { text: "Selecciona USDT (SPL)", sub: 'Busca "USDT" en tus tokens. Asegurate de que sea USDT en la red Solana (SPL), no en otra red.' },
    { text: "Pega la direccion de destino", sub: `Copia la direccion Solana que aparece arriba. Empieza con BFGj...` },
    { text: 'Si usas Binance: selecciona la red "Solana"', sub: 'Si retiras desde Binance, en la lista de redes elige "SOL" o "Solana".', warn: "No envies por ERC20 o BEP20. Usa exclusivamente la red Solana.", highlight: true },
    { text: `Ingresa el monto exacto: ${order.amountUsdt} USDT`, sub: "Copia el monto exacto incluyendo los centavos." },
    { text: "Confirma y envia", sub: "La transaccion en Solana se confirma en segundos (~0.5s). La comision es minima (~$0.01)." },
    { text: "Espera la deteccion", sub: "Verificamos automaticamente. Deberia aparecer en menos de 1 minuto.", highlight: true },
  ];
}

function qrSteps(order: OrderInfo) {
  return [
    { text: "Abre la app de Binance en tu celular" },
    { text: 'Toca el icono de "Escanear" (arriba a la derecha)' },
    { text: "Apunta la camara al codigo QR de arriba", sub: "Binance reconocera automaticamente la cuenta destino." },
    { text: "Selecciona USDT como moneda a enviar" },
    { text: `Ingresa el monto exacto: ${order.amountUsdt} USDT`, highlight: true },
    { text: `En "Nota" o "Mensaje", escribe tu numero de orden: ${order.orderId}`, sub: "Esto nos ayuda a identificar tu pago mas rapido.", highlight: true },
    { text: "Confirma y envia" },
    { text: "Espera la verificacion manual (~2 horas)", sub: "Recibiremos tu pago internamente en Binance y lo verificaremos manualmente." },
  ];
}

function binanceIdSteps(order: OrderInfo) {
  return [
    { text: "Abre la app de Binance" },
    { text: 'Ve a "Binance Pay" → "Enviar"', sub: 'Tambien puedes ir a Billetera → Binance Pay → Enviar.' },
    { text: `Ingresa el Binance ID: ${order.binanceId}`, sub: "Copia el ID con el boton de arriba y pegalo en el campo de destinatario.", highlight: true },
    { text: "Selecciona USDT como moneda" },
    { text: `Ingresa el monto exacto: ${order.amountUsdt} USDT` },
    { text: `En "Nota", escribe tu numero de orden: ${order.orderId}`, sub: "Esto nos ayuda a identificar tu pago.", highlight: true },
    { text: "Confirma y envia" },
    { text: "Espera la verificacion manual (~2 horas)", sub: "Tu pago llegara internamente a nuestra cuenta de Binance y lo verificaremos manualmente." },
  ];
}

/* ─── FAQ sections ─── */

function BscFaq() {
  return (
    <FaqSection items={[
      { q: "Puedo pagar con Binance Pay (transferencia interna)?", a: 'Las transferencias internas de Binance Pay no pasan por la blockchain, asi que no se detectan automaticamente. Si prefieres Binance Pay, usa las opciones "QR Binance" o "Binance ID" de las pestanas de arriba.' },
      { q: "No tengo USDT en Binance, que hago?", a: 'Puedes comprar USDT directamente en Binance con tarjeta de debito/credito, o intercambiar otra crypto (BTC, ETH, BNB) por USDT en la seccion "Convertir".' },
      { q: "Puedo enviar desde otra wallet?", a: "Si. Trust Wallet, MetaMask (red BSC), SafePal, o cualquier wallet compatible con BNB Smart Chain. Lo importante es usar la red BEP-20." },
      { q: "Envie el monto incorrecto, que pasa?", a: "Si el monto no coincide exactamente, no podremos detectar tu pago automaticamente. Contactanos con tu numero de orden y el TxID." },
    ]} />
  );
}

function SolanaFaq() {
  return (
    <FaqSection items={[
      { q: "Puedo enviar desde Binance por Solana?", a: 'Si. En Binance ve a Retirar → USDT → selecciona la red "SOL" o "Solana". La comision de retiro por Solana suele ser ~1 USDT.' },
      { q: "Puedo enviar desde Phantom o Solflare?", a: "Si. Solo asegurate de enviar USDT (no SOL nativo) a la direccion indicada." },
      { q: "Cuanto tarda la confirmacion?", a: "Las transacciones en Solana se confirman en menos de 1 segundo. La deteccion en nuestra pagina deberia tardar menos de 30 segundos." },
      { q: "Envie el monto incorrecto, que pago?", a: "Contactanos con tu numero de orden y la firma (signature) de la transaccion de Solana para resolverlo manualmente." },
    ]} />
  );
}

function FaqSection({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="mt-4 space-y-2 border-t border-white/5 pt-3">
      <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Preguntas frecuentes</h4>
      {items.map((item, i) => (
        <details key={i} className="group">
          <summary className="cursor-pointer text-[11px] text-slate-400 hover:text-white transition">{item.q}</summary>
          <p className="mt-1 pl-3 text-[10px] text-slate-500 leading-relaxed">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
