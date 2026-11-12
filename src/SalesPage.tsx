import React, { useEffect, useMemo, useRef, useState } from 'react';
import './sales.css';
import { TradingOptionsHeroBg } from './HeroFx';

export type SalesVariant = 'default' | 'v1' | 'v2';

export interface SalesPageProps {
  variant?: SalesVariant;
}

const WHATSAPP_PHONE = '573009121234';

const WHATSAPP_ZERO_URL =
  `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=` +
  encodeURIComponent(
    'Hola equipo de Ingresarios, estoy comenzando desde cero en opciones financieras y me gustaría orientación sobre la ruta de aprendizaje más adecuada para mi nivel.'
  );

const WHATSAPP_TRIBU_URL =
  `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=` +
  encodeURIComponent(
    'Hola equipo de Ingresarios, ya soy miembro de la Tribu y quiero consultar antes de inscribirme al Seminario de Opciones Financieras.'
  );

/* ─────────────────────────────────────────────
   CONFIGURACIÓN DE LA OFERTA
   Cambia estos valores antes de publicar.
   ───────────────────────────────────────────── */
const OFFER = {
  price: 27,
  nextPrice: 47,
  /** Texto de la fecha tal como se lee en la página, ej. "domingo 9 de noviembre" */
  deadlineLabel: '30 de noviembre',
  /** Día en que sube el precio */
  raiseLabel: '1 de diciembre',
  /** Fecha real de cierre (ISO, hora Colombia). Si es null, no se muestra contador. */
  deadlineISO: null as string | null, // ej. '2026-11-09T23:59:00-05:00'
  /** URL del checkout (Whop, Hotmart, Stripe, etc.) */
  checkoutUrl: 'https://whop.com/checkout/plan_TvXhMrCWobqH9',
};

const CTA_HREF = OFFER.checkoutUrl || '#precio';

/* Supuestos de la calculadora (editables) */
const CDT_RATE = 0.10;       // tasa del CDT (E.A.)
const WITHHOLDING = 0.04;    // retención en la fuente aprox. sobre rendimientos

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const pct = (n: number) => `${(n * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`;

/* Contador solo si existe una fecha real de cierre */
function useCountdown(iso: string | null) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!iso) return;
    const end = new Date(iso).getTime();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [iso]);
  if (left === null || left <= 0) return null;
  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d > 0 ? `${d}d ` : ''}${pad(h)}:${pad(m)}:${pad(s)}`;
}

/* Aparición suave al hacer scroll */
function useReveal(dep?: unknown) {
  useEffect(() => {
    const els = document.querySelectorAll('.sp-reveal');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }),
      { threshold: 0.18, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [dep]);
}

function Arrow() {
  return <span className="sp-arrow" aria-hidden>→</span>;
}

/* Fondo animado del hero: velas japonesas + media móvil, muy tenues */
function HeroBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SLOT = 22;
    type Candle = { o: number; h: number; l: number; c: number };
    let candles: Candle[] = [];
    let price = 0;
    let off = 0;
    let w = 0, h = 0, raf = 0;

    const next = (): Candle => {
      const o = price;
      const c = o + (Math.random() - 0.5) * 16 - o * 0.03;
      price = c;
      return { o, c, h: Math.max(o, c) + Math.random() * 9, l: Math.min(o, c) - Math.random() * 9 };
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      price = 0; candles = [];
      for (let i = 0; i < Math.ceil(w / SLOT) + 3; i++) candles.push(next());
      draw();
    };
    const y = (v: number) => h * 0.58 - v * 4;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.shadowBlur = 0;
      candles.forEach((k, i) => {
        const x = i * SLOT - off + SLOT / 2;
        const up = k.c >= k.o;
        ctx.strokeStyle = ctx.fillStyle = up ? 'rgba(232,186,92,.9)' : 'rgba(160,152,138,.55)';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, y(k.h)); ctx.lineTo(x, y(k.l)); ctx.stroke();
        const top = y(Math.max(k.o, k.c));
        ctx.fillRect(x - 4.5, top, 9, Math.max(2, Math.abs(y(k.o) - y(k.c))));
      });
      // media móvil con brillo
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,224,150,1)'; ctx.lineWidth = 2.2;
      ctx.shadowColor = 'rgba(241,208,138,.9)'; ctx.shadowBlur = 14;
      candles.forEach((_, i) => {
        const n = Math.min(i + 1, 9);
        let sum = 0;
        for (let j = 0; j < n; j++) sum += candles[i - j].c;
        const x = i * SLOT - off + SLOT / 2;
        i === 0 ? ctx.moveTo(x, y(sum / n)) : ctx.lineTo(x, y(sum / n));
      });
      ctx.stroke();
    };
    const tick = () => {
      off += 0.3;
      if (off >= SLOT) { off -= SLOT; candles.shift(); candles.push(next()); }
      draw();
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    if (!reduce) raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="sp-hero-bg" aria-hidden />;
}

/* Calculadora: la cuenta real del CDT */
function CdtCalculator() {
  const [amount, setAmount] = useState(20_000_000);
  const [inflation, setInflation] = useState(5);

  const r = useMemo(() => {
    const interest = amount * CDT_RATE;
    const tax = interest * WITHHOLDING;
    const infl = amount * (inflation / 100);
    const real = interest - tax - infl;
    return { interest, tax, infl, real, realPct: real / amount };
  }, [amount, inflation]);

  const prog = (v: number, min: number, max: number) => `${((v - min) / (max - min)) * 100}%`;

  return (
    <div className="sp-calc sp-reveal">
      <div className="sp-calc-in">
        <div className="sp-field">
          <label htmlFor="calc-amount">
            ¿Cuánto tienes en el CDT?
            <output htmlFor="calc-amount">{cop.format(amount)}</output>
          </label>
          <input
            id="calc-amount" className="sp-range" type="range"
            min={5_000_000} max={200_000_000} step={1_000_000} value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            aria-valuetext={cop.format(amount)}
            style={{ ['--slider-progress' as string]: prog(amount, 5_000_000, 200_000_000) }}
          />
        </div>
        <div className="sp-field">
          <label htmlFor="calc-infl">
            Inflación del año
            <output htmlFor="calc-infl">{inflation.toLocaleString('es-CO', { minimumFractionDigits: 1 })}%</output>
          </label>
          <input
            id="calc-infl" className="sp-range" type="range"
            min={2} max={10} step={0.1} value={inflation}
            onChange={(e) => setInflation(Number(e.target.value))}
            aria-valuetext={`${inflation}%`}
            style={{ ['--slider-progress' as string]: prog(inflation, 2, 10) }}
          />
          <small>Ajústala a la inflación que esperas este año.</small>
        </div>
        <div className="sp-field" style={{ marginBottom: 0 }}>
          <div className="sp-field-label">Supuestos</div>
          <div className="sp-fixed">
            <span>Tasa CDT {pct(CDT_RATE)} E.A.</span>
            <span>Retención {pct(WITHHOLDING)} aprox.</span>
            <span>Plazo 12 meses</span>
          </div>
        </div>
      </div>

      <div className="sp-calc-out" aria-live="polite">
        <div className="sp-ledger">
          <div className="sp-ledger-row"><span>Lo que dice el papel</span><span className="pos">+{cop.format(r.interest)}</span></div>
          <div className="sp-ledger-row"><span>Retención en la fuente</span><span className="neg">−{cop.format(r.tax)}</span></div>
          <div className="sp-ledger-row"><span>Lo que se come la inflación</span><span className="neg">−{cop.format(r.infl)}</span></div>
          <div className="sp-ledger-total">
            <small>Lo que de verdad ganas en un año</small>
            <b>{cop.format(r.real)}</b>
            <em>De tu 10%, te queda {pct(r.realPct)} real.</em>
          </div>
        </div>
        <div className="sp-ledger-foot">
          Y durante <strong>365 días</strong> no puedes tocar ese dinero.
        </div>
      </div>
    </div>
  );
}

/* Diagrama de payoff: Bull Call Spread en SPY (ejemplo del simulador) */
function PayoffFigure() {
  const hand = "'Caveat', cursive";
  const mono = "'IBM Plex Mono', monospace";
  return (
    <figure className="sp-figure sp-reveal" aria-label="Diagrama de una operación con riesgo definido">
      <div className="sp-figure-head">
        <b>Antes de entrar ves esto</b>
        <span>Bull Call Spread · SPY</span>
      </div>
      <svg viewBox="0 0 520 330" role="img" aria-labelledby="payoff-title">
        <title id="payoff-title">
          Bull Call Spread en SPY: pérdida máxima de 250 dólares, punto de equilibrio en 552,50 y ganancia máxima de 750 dólares.
        </title>
        <polygon points="40,197.5 40,250 224,250 247,197.5" fill="rgba(226,123,98,.16)" />
        <polygon points="247,197.5 316,40 500,40 500,197.5" fill="rgba(214,168,78,.13)" />
        <line x1="40" y1="197.5" x2="500" y2="197.5" stroke="#5d5850" strokeWidth="1" strokeDasharray="3 4" />
        <text x="500" y="190" textAnchor="end" fontFamily={mono} fontSize="11" fill="#827c71">US$0</text>
        <path d="M40,250 L224,250 L316,40 L500,40" fill="none" stroke="#f2ede3" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <text x="52" y="236" fontFamily={mono} fontSize="12.5" fill="#e27b62">Pérdida máx. −US$250</text>
        <text x="332" y="68" fontFamily={mono} fontSize="12.5" fill="#f1d08a">Ganancia máx. +US$750</text>
        <circle cx="247" cy="197.5" r="5" fill="#d6a84e" />
        <text x="258" y="219" fontFamily={mono} fontSize="12" fill="#f2ede3">Equilibrio 552,50</text>
        <text x="58" y="96" fontFamily={hand} fontSize="25" fill="#f1d08a">este número lo sabes</text>
        <text x="58" y="122" fontFamily={hand} fontSize="25" fill="#f1d08a">antes de dar clic</text>
        <path d="M100,132 C 86,160 94,188 112,212" fill="none" stroke="#d6a84e" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M104,206 L112,213 L114,202" fill="none" stroke="#d6a84e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="40" y1="276" x2="500" y2="276" stroke="#2a2e33" />
        {[530, 540, 550, 560, 570, 580].map((v, i) => (
          <g key={v}>
            <line x1={40 + i * 92} y1="272" x2={40 + i * 92} y2="280" stroke="#4a4740" />
            <text x={40 + i * 92} y="298" textAnchor="middle" fontFamily={mono} fontSize="11.5" fill="#827c71">{v}</text>
          </g>
        ))}
        <text x="270" y="322" textAnchor="middle" fontFamily={mono} fontSize="11" fill="#827c71">precio de SPY al vencimiento</text>
      </svg>
      <figcaption>
        Compras el call 550 y vendes el 560. Uno de los ejemplos que practicas en el simulador. Ilustrativo, no es una recomendación.
      </figcaption>
    </figure>
  );
}

function Seal() {
  return (
    <svg className="sp-seal" viewBox="0 0 140 140" role="img" aria-label="Sello de garantía de 7 días" style={{ transform: 'rotate(-8deg)' }}>
      <defs>
        <path id="seal-top" d="M17,70 A53,53 0 0,1 123,70" />
        <path id="seal-bot" d="M9,70 A61,61 0 0,0 131,70" />
        <linearGradient id="seal-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1d08a" />
          <stop offset="1" stopColor="#b98a35" />
        </linearGradient>
      </defs>
      <circle cx="70" cy="70" r="67" fill="none" stroke="url(#seal-g)" strokeWidth="2" />
      <circle cx="70" cy="70" r="40" fill="rgba(214,168,78,.08)" stroke="url(#seal-g)" strokeWidth="1" />
      <text fontFamily="'IBM Plex Mono', monospace" fontSize="9.5" fill="#d6a84e" letterSpacing="1.1" textAnchor="middle">
        <textPath href="#seal-top" startOffset="50%">GARANTÍA DE DEVOLUCIÓN</textPath>
      </text>
      <text fontFamily="'IBM Plex Mono', monospace" fontSize="10" fill="#d6a84e" letterSpacing="3" textAnchor="middle">
        <textPath href="#seal-bot" startOffset="50%">· SIETE DÍAS ·</textPath>
      </text>
      <text x="70" y="81" textAnchor="middle" fontFamily="'Fraunces', serif" fontSize="42" fill="#f1d08a">7</text>
      <text x="70" y="97" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="9" letterSpacing="2" fill="#d6a84e">DÍAS</text>
    </svg>
  );
}

export const SalesPage: React.FC<SalesPageProps> = ({ variant = 'default' }) => {
  const isV1 = variant === 'v1';
  const isV2 = variant === 'v2';
  const countdown = useCountdown(OFFER.deadlineISO);
  const [stickyOn, setStickyOn] = useState(false);
  useReveal(variant);

  // Fondo del body acorde a la página (evita el "rebote" claro en Mac)
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#0a0b0d';
    return () => { document.body.style.backgroundColor = prev; };
  }, []);

  // Barra inferior: aparece después del hero y se oculta cuando el precio está en pantalla
  useEffect(() => {
    const price = document.getElementById('precio');
    let priceVisible = false;
    const update = () => setStickyOn(window.scrollY > 900 && !priceVisible);
    const io = new IntersectionObserver(([e]) => { priceVisible = e.isIntersecting; update(); }, { threshold: 0.15 });
    if (price) io.observe(price);
    window.addEventListener('scroll', update, { passive: true });
    return () => { io.disconnect(); window.removeEventListener('scroll', update); };
  }, [variant]);

  return (
    <div className={`sp${isV1 ? ' sp--v1' : ''}${isV2 ? ' sp--v2' : ''}`}>
      {/* Barra superior: urgencia real, sin inventos */}
      <div className="sp-topbar">
        {isV1 ? (
          <>
            <strong>Seminario de Opciones Financieras · Ingresarios</strong> · Tarifa preferencial de lanzamiento: <strong>US${OFFER.price}</strong> hasta el {OFFER.deadlineLabel} (a partir del {OFFER.raiseLabel}: US${OFFER.nextPrice}).
          </>
        ) : isV2 ? (
          <>
            <strong>De la teoría suelta al sistema real</strong> · Oferta de lanzamiento: <strong>US${OFFER.price}</strong> hasta el {OFFER.deadlineLabel}. El {OFFER.raiseLabel} sube a US${OFFER.nextPrice}.
          </>
        ) : (
          <>
            <strong>Seminario de Opciones</strong> · Precio de lanzamiento: <strong>US${OFFER.price}</strong> hasta el {OFFER.deadlineLabel}. El {OFFER.raiseLabel} sube a US${OFFER.nextPrice}.
          </>
        )}
        {countdown && <span className="sp-count">{countdown}</span>}
      </div>

      <main id="top">
        {/* ── HERO ELEGANTE Y DE VANGUARDIA (FINTECH LUXURY) ── */}
        <section className="sp-hero">
          <TradingOptionsHeroBg />

          <div className="sp-wrap sp-hero-wrap">
            <div className="sp-hero-copy">
              <div className="sp-hero-logo-wrap">
                <img
                  src="https://assets.cdn.filesafe.space/jTugwykceKyJlATOSvkb/media/6878eca14216d02dcb7e8fc7.png"
                  alt="Ingresarios"
                  className="sp-hero-logo"
                  width={210}
                  height={48}
                  loading="eager"
                />
              </div>

              <div className="sp-hero-kicker-tag">
                <span className="sp-kicker-radar" />
                <span>
                  {isV1
                    ? 'Formación Especializada · Más Allá de lo Básico'
                    : isV2
                    ? 'Para quienes ya conocen lo básico · Nivel Estratégico'
                    : 'Seminario + Simulador'}
                </span>
              </div>

              {isV1 ? (
                <h1 className="sp-hero-h1 sp-hero-h1--v1">
                  Seminario de <span className="sp-gold-grad">Opciones Financieras</span>
                  <span className="visually-hidden"> | </span>
                  <span className="sp-hero-h1-sub">De los fundamentos a las estrategias</span>
                </h1>
              ) : isV2 ? (
                <h1 className="sp-hero-h1 sp-hero-h1--v2">
                  Ya sabes qué es un Call y un Put…{' '}
                  <span className="sp-gold-grad sp-hero-h1-v2-accent">te falta el sistema para dejar de adivinar.</span>
                </h1>
              ) : (
                <h1 className="sp-hero-h1">
                  Seminario de <span className="sp-gold-grad">Opciones</span>
                </h1>
              )}

              <p className="sp-hero-sub">
                {isV1
                  ? 'Dirigido a personas con conocimientos previos de opciones que desean fortalecer su formación.'
                  : isV2
                  ? 'Deja de comprar contratos rezando para que el precio se mueva rápido y aprende a estructurar estrategias donde el tiempo y la matemática juegan a tu favor.'
                  : 'Aprende a operar con riesgo definido, desde cero y en español.'}
              </p>

              <p className="sp-lead">
                {isV1 ? (
                  <>
                    5 módulos estructurados para pasar del dominio de los conceptos fundamentales a ejecutar{' '}
                    <strong>estrategias profesionales con riesgo definido</strong>, lectura de griegas y validación previa en simulador.
                  </>
                ) : isV2 ? (
                  <>
                    En 5 clases prácticas conectas las piezas que hoy tienes sueltas: dominas las Griegas, pasas a cobrar primas y operas{' '}
                    <strong>sabiendo exactamente cuánto arriesgas antes de hacer clic</strong>.
                  </>
                ) : (
                  <>
                    5 clases en video para entender cómo funcionan las opciones y saber <strong>cuánto puedes perder antes de entrar</strong>. Una alternativa a dejar tu dinero quieto en un CDT.
                  </>
                )}
              </p>

              <div className="sp-hero-ai">
                <div className="sp-hero-ai-badge">
                  <span className="sp-pulse-dot" />
                  <span>
                    {isV1
                      ? 'ENTORNO DE SIMULACIÓN INCLUIDO'
                      : isV2
                      ? 'ENTRENA SIN QUEMAR TU CUENTA REAL'
                      : 'BONO EXCLUSIVO INCLUIDO'}
                  </span>
                </div>
                <b>
                  {isV1
                    ? 'Incluye simulador interactivo con tutor IA'
                    : isV2
                    ? 'Incluye Simulador de Opciones + Tutor IA 24/7'
                    : 'Incluye simulador con tutor IA'}
                </b>
                <span>
                  {isV1
                    ? 'Estructura posiciones, evalúa escenarios y resuelve dudas técnicas con el Coach Geny antes de comprometer capital real.'
                    : isV2
                    ? 'Arma tus cadenas de opciones sin arriesgar un dólar y pregúntale al Coach Geny por qué tu posición gana o pierde valor.'
                    : 'Practica sin dinero real y pregúntale al Coach Geny lo que no entiendas, a cualquier hora.'}
                </span>
              </div>

              <div className="sp-hero-cta">
                <a className="sp-btn sp-btn--lg" href={CTA_HREF} id="cta-hero">
                  {isV1
                    ? 'Inscribirme al Seminario'
                    : isV2
                    ? 'Quiero pasar de la teoría a la estrategia'
                    : 'Quiero entrar al Seminario'}{' '}
                  <span className="sp-btn-price">· US${OFFER.price}</span> <Arrow />
                </a>
                <div className="sp-hero-price">
                  <s>US${OFFER.nextPrice}</s> <b>US${OFFER.price}</b>{' '}
                  {isV1
                    ? `tarifa institucional de lanzamiento hasta el ${OFFER.deadlineLabel}`
                    : `precio de lanzamiento hasta el ${OFFER.deadlineLabel}`}
                </div>
              </div>

              <div className="sp-fine">
                <span>Acceso de por vida</span>
                <span>Garantía de 7 días</span>
                {isV1 && <span>Nivel: Fundamentos previos</span>}
                {isV2 && <span>Requiere nociones básicas (Call / Put)</span>}
              </div>

              {isV1 && (
                <div className="sp-hero-qual-nav">
                  <a href="#perfil-ingreso" className="sp-hero-qual-link">
                    <span>¿Este seminario se ajusta a tu nivel actual? Revisa el perfil de ingreso</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 5v14" />
                      <path d="m19 12-7 7-7-7" />
                    </svg>
                  </a>
                </div>
              )}

              {isV2 && (
                <div className="sp-hero-qual-nav">
                  <a href="#dolor-intermedio" className="sp-hero-qual-link">
                    <span>Descubre por qué te estancas con lo básico (y si este nivel es para ti)</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 5v14" />
                      <path d="m19 12-7 7-7-7" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── HECHOS ── */}
        <div className="sp-facts" aria-label="Qué incluye en números">
          <div className="sp-wrap">
            <div><b>5</b><span>{isV1 ? 'módulos en video' : 'videos del seminario'}</span></div>
            <div><b>4 horas</b><span>{isV1 ? 'de formación aplicada' : isV2 ? 'de estrategias reales' : 'de formación práctica'}</span></div>
            <div><b>1</b><span>simulador de opciones</span></div>
            <div><b>2</b><span>{isV1 ? 'recursos operativos' : 'bonos incluidos'}</span></div>
            <div><b>7 días</b><span>de garantía</span></div>
          </div>
        </div>

        {/* ── PERFIL DE INGRESO Y ORIENTACIÓN (EXCLUSIVO VARIANTE 1 INSTITUCIONAL) ── */}
        {isV1 && (
          <section className="sp-section sp-section--alt sp-v1-qual-section" id="perfil-ingreso">
            <div className="sp-wrap">
              <div className="sp-intro sp-reveal" style={{ marginBottom: 44 }}>
                <span className="sp-kicker">Perfil de ingreso y orientación académica</span>
                <h2>
                  Ubica tu nivel <em>antes de inscribirte.</em>
                </h2>
              </div>

              <div className="sp-v1-qual-grid">
                {/* Tarjeta 1: Perfil requerido */}
                <article className="sp-v1-qual-card sp-v1-qual-card--primary sp-reveal">
                  <header className="sp-v1-card-head">
                    <span className="sp-v1-badge sp-v1-badge--gold">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span>Nivel requerido · Conocimientos previos</span>
                    </span>
                    <h3>¿Este seminario es para ti?</h3>
                  </header>

                  <div className="sp-v1-card-content">
                    <p>
                      El <strong>Seminario de Opciones Financieras: Más Allá de lo Básico</strong> está dirigido a personas que ya cuentan con conocimientos fundamentales sobre opciones financieras, como <strong>Call, Put, primas, contratos y fechas de vencimiento</strong>, y desean profundizar en su aprendizaje.
                    </p>

                    <div className="sp-v1-prereq-box">
                      <span className="sp-v1-prereq-label">Conceptos base que ya debes reconocer:</span>
                      <ul className="sp-v1-pills" role="list">
                        <li>Call</li>
                        <li>Put</li>
                        <li>Primas</li>
                        <li>Contratos</li>
                        <li>Fechas de vencimiento</li>
                      </ul>
                    </div>

                    <p className="sp-v1-card-subnote">
                      Si ya identificas estos elementos y buscas estructurar estrategias reales con lectura de griegas y riesgo definido, estás en el lugar correcto.
                    </p>
                  </div>

                  <footer className="sp-v1-card-foot sp-v1-card-foot--tribu">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>
                      ¿Ya eres miembro de la Tribu?{' '}
                      <a href={WHATSAPP_TRIBU_URL} target="_blank" rel="noopener noreferrer" className="sp-v1-tribu-link">
                        Contáctanos antes de hacer la compra ↗
                      </a>
                    </span>
                  </footer>
                </article>

                {/* Tarjeta 2: Ruta desde cero */}
                <article className="sp-v1-qual-card sp-v1-qual-card--zero sp-reveal">
                  <header className="sp-v1-card-head">
                    <span className="sp-v1-badge sp-v1-badge--neutral">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                      </svg>
                      <span>Alternativa formativa · Nivel inicial</span>
                    </span>
                    <h3>¿Estás comenzando desde cero?</h3>
                  </header>

                  <div className="sp-v1-card-content">
                    <p>
                      ¡No te preocupes! En <strong>Ingresarios</strong> también contamos con alternativas de formación para quienes están dando sus primeros pasos.
                    </p>
                    <p>
                      Antes de inscribirte, te invitamos a contactar a nuestro equipo a través de la <strong>línea oficial de soporte</strong>, donde podremos orientarte sobre la ruta de aprendizaje más adecuada para tu nivel de experiencia.
                    </p>
                    <div className="sp-v1-commitment">
                      Queremos que aproveches al máximo tu formación, comenzando desde el nivel adecuado para ti.
                    </div>
                  </div>

                  <footer className="sp-v1-card-foot">
                    <a
                      href={WHATSAPP_ZERO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sp-btn-outline-inst"
                      id="cta-soporte-orientacion"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.84 14.12c-.24.68-1.42 1.3-1.97 1.38-.51.08-1.18.12-3.41-.81-2.85-1.18-4.69-4.08-4.83-4.27-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09.99-2.37.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.42-.07.65.49.24.57.81 1.98.88 2.12.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.17-.3.37-.43.5-.14.14-.29.3-.12.59.16.28.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.28.14.45.12.62-.07.17-.19.73-.85.92-1.14.19-.28.38-.24.64-.14.26.09 1.66.78 1.94.92.28.14.47.21.54.33.07.12.07.7-.17 1.38z" />
                      </svg>
                      <span>Contactar a la línea oficial de soporte</span>
                      <Arrow />
                    </a>
                  </footer>
                </article>
              </div>
            </div>
          </section>
        )}

        {/* ── DOLOR DEL TRADER CON BASES + FILTRO DE NIVEL (EXCLUSIVO VARIANTE 2 MARKETERA) ── */}
        {isV2 && (
          <section className="sp-section sp-section--alt sp-v2-pain-section" id="dolor-intermedio">
            <div className="sp-wrap">
              <div className="sp-intro sp-reveal" style={{ marginBottom: 44 }}>
                <span className="sp-kicker">El techo del nivel básico</span>
                <h2>
                  Por qué saber qué es un Call y un Put <em>no basta para ser rentable.</em>
                </h2>
                <p>
                  Entender las definiciones toma una tarde en YouTube. El problema real empieza cuando abres el bróker y te chocas con estos tres muros:
                </p>
              </div>

              <div className="sp-v2-pains-grid">
                <article className="sp-v2-pain-card sp-reveal">
                  <header className="sp-v2-pain-head">
                    <span className="sp-v2-pain-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </span>
                    <h3>Aciertas la dirección… y aun así pierdes</h3>
                  </header>
                  <p>
                    Compras un Call, la acción sube como esperabas, pero entre el desgaste diario del tiempo (<strong>Theta</strong>) y el desplome de volatilidad (<strong>IV Crush</strong>), tu contrato termina en rojo.
                  </p>
                </article>

                <article className="sp-v2-pain-card sp-reveal">
                  <header className="sp-v2-pain-head">
                    <span className="sp-v2-pain-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="21" x2="4" y2="14" />
                        <line x1="4" y1="10" x2="4" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12" y2="3" />
                        <line x1="20" y1="21" x2="20" y2="16" />
                        <line x1="20" y1="12" x2="20" y2="3" />
                        <line x1="1" y1="14" x2="7" y2="14" />
                        <line x1="9" y1="8" x2="15" y2="8" />
                        <line x1="17" y1="16" x2="23" y2="16" />
                      </svg>
                    </span>
                    <h3>Te paralizas frente a la cadena</h3>
                  </header>
                  <p>
                    Ves decenas de strikes y fechas de vencimiento, pero terminas eligiendo al ojo porque nadie te dio una regla clara basada en <strong>probabilidad matemática (POP)</strong>.
                  </p>
                </article>

                <article className="sp-v2-pain-card sp-reveal">
                  <header className="sp-v2-pain-head">
                    <span className="sp-v2-pain-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </span>
                    <h3>Operas como comprador de lotería</h3>
                  </header>
                  <p>
                    Dependes de movimientos explosivos para ganar, cuando los profesionales hacen lo opuesto: <strong>actúan como aseguradoras</strong> cobrando primas con riesgo definido.
                  </p>
                </article>
              </div>

              {/* Filtro inteligente para el avatar + desvío amable de principiantes */}
              <div className="sp-v2-filter-banner sp-reveal">
                <div className="sp-v2-filter-main">
                  <span className="sp-v1-badge sp-v1-badge--gold">Filtro honesto antes de entrar</span>
                  <h3>Este seminario NO empieza explicando qué es una acción</h3>
                  <p>
                    Está hecho a la medida de quienes ya reconocen <strong>Call, Put, primas, contratos y fechas de vencimiento</strong>, y quieren dejar de improvisar para dominar estrategias reales.
                  </p>
                  <ul className="sp-v1-pills" role="list">
                    <li>Call &amp; Put</li>
                    <li>Primas</li>
                    <li>Contratos</li>
                    <li>Fechas de vencimiento</li>
                  </ul>
                  <p className="sp-v2-tribu-note">
                    ¿Ya eres miembro de la Tribu?{' '}
                    <a href={WHATSAPP_TRIBU_URL} target="_blank" rel="noopener noreferrer" className="sp-v1-tribu-link">
                      Contáctanos antes de hacer la compra ↗
                    </a>
                  </p>
                </div>

                <div className="sp-v2-filter-side">
                  <h4>¿Estás empezando desde cero absoluto?</h4>
                  <p>
                    ¡Tranquilo! En <strong>Ingresarios</strong> tenemos programas ideales para dar tus primeros pasos. Antes de inscribirte, escríbenos a soporte para ubicarte en el nivel correcto y que aproveches al máximo tu inversión.
                  </p>
                  <a
                    href={WHATSAPP_ZERO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sp-btn-outline-inst"
                    id="cta-v2-soporte-cero"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.84 14.12c-.24.68-1.42 1.3-1.97 1.38-.51.08-1.18.12-3.41-.81-2.85-1.18-4.69-4.08-4.83-4.27-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09.99-2.37.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.42-.07.65.49.24.57.81 1.98.88 2.12.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.17-.3.37-.43.5-.14.14-.29.3-.12.59.16.28.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.28.14.45.12.62-.07.17-.19.73-.85.92-1.14.19-.28.38-.24.64-.14.26.09 1.66.78 1.94.92.28.14.47.21.54.33.07.12.07.7-.17 1.38z" />
                    </svg>
                    <span>Empezando desde cero · Hablar con Soporte</span>
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── DOLOR: LA CUENTA REAL (oculta; quitar `hidden` para mostrarla) ── */}
        <section className="sp-section" hidden style={{ display: 'none' }}>
          <div className="sp-wrap">
            <div className="sp-intro sp-reveal">
              <span className="sp-kicker">Si tienes dinero en un CDT</span>
              <h2>La cuenta que <em>el banco no te hace.</em></h2>
              <p>
                El papel dice 10%. Pero cuando le quitas la retención y lo que subió todo durante el año, la cifra cambia bastante.
                Mueve los valores y mira con tu propio número.
              </p>
            </div>

            <CdtCalculator />

            <div className="sp-after-calc">
              <p className="sp-bigquote sp-reveal">
                No es que el CDT sea malo. Es seguro, y para eso sirve. El problema es creer que <em>es lo único que puedes hacer</em> con tu dinero.
              </p>
              <div className="sp-reveal">
                <p>
                  Mientras tanto, el banco toma ese mismo dinero y lo presta a tasas mucho más altas de las que te paga. Tú pones el capital,
                  esperas un año y te llevas la parte más pequeña.
                </p>
                <p style={{ marginBottom: 0 }}>
                  Cuando buscas alternativas te encuentras dos extremos: los que dicen que la bolsa es para ricos y los que muestran
                  pantallazos de ganancias gigantes. <strong>Ninguno te enseña a entender qué estás haciendo.</strong>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── MECANISMO ── */}
        <section className="sp-section">
          <div className="sp-wrap sp-mech">
            <div className="sp-reveal">
              <span className="sp-kicker">{isV1 ? 'Enfoque metodológico' : isV2 ? 'El cambio de juego' : 'La diferencia'}</span>
              {isV1 ? (
                <h2>
                  De conocer los contratos a operar <em>con estructura profesional.</em>
                </h2>
              ) : isV2 ? (
                <h2>
                  Deja de comprar contratos esperando un milagro. <em>Opera como la casa.</em>
                </h2>
              ) : (
                <h2>Las opciones no son el casino <em>que te contaron.</em></h2>
              )}
              <p style={{ fontSize: 19 }}>
                {isV1
                  ? 'Cuando ya comprendes qué es un Call y un Put, el verdadero avance consiste en estructurar posiciones con riesgo acotado y criterios cuantificables antes de ejecutar:'
                  : isV2
                  ? 'Los amateurs compran opciones rezando por un movimiento explosivo. Los profesionales arman estructuras donde el reloj y la probabilidad trabajan para ellos:'
                  : 'Nacieron como herramientas de cobertura. Bien usadas, te dejan poner el límite antes de entrar. Esto es lo que vas a aprender a hacer:'}
              </p>
              <div className="sp-pillars">
                <div className="sp-pillar">
                  <i>1</i>
                  <div>
                    <h3>{isV2 ? 'Sabes tu pérdida máxima antes del clic' : 'Riesgo definido'}</h3>
                    <p>
                      {isV1
                        ? 'Estableces la pérdida máxima en dólares y el punto de equilibrio exacto antes de enviar la orden al mercado.'
                        : isV2
                        ? 'Cero sorpresas ni cuentas quemadas por un movimiento brusco. Ves en pantalla cuánto arriesgas exactamente antes de entrar.'
                        : 'Conoces la pérdida máxima en dólares antes de abrir la operación. Si no te deja dormir tranquilo, no entras.'}
                    </p>
                  </div>
                </div>
                <div className="sp-pillar">
                  <i>2</i>
                  <div>
                    <h3>{isV1 ? 'Gestión disciplinada de capital' : isV2 ? 'El tiempo (Theta) pasa a tu bando' : 'Solo una parte de tu capital'}</h3>
                    <p>
                      {isV1
                        ? 'Asignas una fracción controlada de tu portafolio bajo reglas claras de preservación patrimonial.'
                        : isV2
                        ? 'Aprendes a cobrar primas como las aseguradoras para ganar incluso si la acción se mueve lento o se queda lateral.'
                        : 'No mueves todo tu ahorro. Comprometes una parte pequeña y el resto sigue donde está.'}
                    </p>
                  </div>
                </div>
                <div className="sp-pillar">
                  <i>3</i>
                  <div>
                    <h3>{isV1 ? 'Validación previa en simulador' : isV2 ? 'Te equivocas gratis en el simulador' : 'Primero practicas, sin dinero real'}</h3>
                    <p>
                      {isV1
                        ? 'Pones a prueba cada estrategia y el impacto del paso del tiempo en el simulador antes de operar en real.'
                        : isV2
                        ? 'Entrenas lecturas de cadena y griegas con el Coach IA antes de poner un solo dólar real en tu bróker.'
                        : 'Haces las operaciones del reto en el simulador antes de tocar un peso. Llegas al mercado con criterio.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <PayoffFigure />
          </div>
        </section>

        {/* ── PLAN 7 DÍAS ── */}
        <section className="sp-section sp-section--alt">
          <div className="sp-wrap">
            <div className="sp-intro sp-reveal">
              <span className="sp-kicker">{isV1 ? 'Ruta de profundización' : isV2 ? 'De la teoría a la ejecución' : 'Cómo funciona'}</span>
              {isV1 ? (
                <h2>De los fundamentos <em>a las estrategias.</em></h2>
              ) : isV2 ? (
                <h2>En 7 días conectas las piezas <em>que hoy tienes sueltas.</em></h2>
              ) : (
                <h2>Tu semana, <em>paso a paso.</em></h2>
              )}
              <p>
                {isV1
                  ? 'Un recorrido progresivo donde cada módulo conecta tus bases actuales con la ejecución estratégica.'
                  : isV2
                  ? 'Sin paja ni teoría eterna. Directo a lo que transforma tu operativa cuando ya sabes lo básico.'
                  : 'Unas horas al día. Sin saltos ni videos sueltos: cada parte prepara la siguiente.'}
              </p>
            </div>
            <div className="sp-plan">
              <div className="sp-step sp-reveal">
                <div className="sp-step-dot">1</div>
                <div className="sp-step-days">{isV1 ? 'Etapa 1 · Módulos 1 y 2' : 'Días 1 y 2'}</div>
                <h3>{isV1 ? 'Contexto y gestión' : isV2 ? 'Blindas capital y aperturas' : 'Entiendes'}</h3>
                <p>
                  {isV1
                    ? 'Asignación responsable de capital, arquitectura bursátil, lectura de gaps y niveles clave para contextualizar cada entrada.'
                    : isV2
                    ? 'Reglas claras de tamaño de posición, horarios trampa de Wall Street y lectura de gaps para dejar de perseguir velas en la apertura.'
                    : 'Salud financiera, acciones vs ETFs y la mecánica de gaps y horarios bursátiles. Sabes cómo se mueve el mercado antes de tocar opciones.'}
                </p>
              </div>
              <div className="sp-step sp-reveal">
                <div className="sp-step-dot">2</div>
                <div className="sp-step-days">{isV1 ? 'Etapa 2 · Módulos 3 y 4' : 'Días 3 a 5'}</div>
                <h3>{isV1 ? 'Flujo de caja y Griegas' : isV2 ? 'Dominas Griegas y cobras primas' : 'Practicas'}</h3>
                <p>
                  {isV1
                    ? 'Transición de comprador direccional a cobro de primas, probabilidad de éxito (POP) y dominio práctico de Delta, Gamma, Theta y Vega en el simulador.'
                    : isV2
                    ? 'Dejas de operar a ciegas: entiendes Delta, Theta, Vega e IV Crush en acción y practicas cobro de renta en el simulador con IA.'
                    : 'Calls, Puts, la cadena de opciones y las griegas como instrumentos de navegación. Armas operaciones de cobro de renta en el simulador con tutor IA.'}
                </p>
              </div>
              <div className="sp-step sp-reveal">
                <div className="sp-step-dot">3</div>
                <div className="sp-step-days">{isV1 ? 'Etapa 3 · Módulo 5 y Práctica' : 'Días 6 y 7'}</div>
                <h3>{isV1 ? 'Estrategias de renta' : isV2 ? 'Ejecutas La Rueda y PMCC' : 'Dominas el sistema'}</h3>
                <p>
                  {isV1
                    ? 'Implementación de La Rueda (Cash Secured Put + Covered Call) y PMCC con LEAPS para reducir más del 50% el colateral requerido.'
                    : isV2
                    ? 'Armas La Rueda y PMCC (simulando 100 acciones con LEAPS usando menos de la mitad del capital) con tu checklist listo al lado del bróker.'
                    : 'Estrategias La Rueda y PMCC (LEAPS con 50% menos colateral), checklist pre-mercado y bróker listo para operar cuando tú decidas.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── QUÉ RECIBES ── */}
        <section className="sp-section" id="que-incluye">
          <div className="sp-wrap">
            <div className="sp-intro sp-reveal">
              <span className="sp-kicker">{isV1 ? 'Contenido académico del programa' : isV2 ? 'Tu arsenal completo' : 'Lo que incluye el seminario'}</span>
              {isV1 ? (
                <h2>Todo el ecosistema para <em>estructurar tus operaciones.</em></h2>
              ) : isV2 ? (
                <h2>Todo para dejar de improvisar <em>frente a la cadena de opciones.</em></h2>
              ) : (
                <h2>Todo para llegar a tu primera operación <em>sabiendo lo que haces.</em></h2>
              )}
            </div>

            <div className="sp-bento">
              <article className="sp-card sp-card--course sp-reveal">
                <div className="sp-card-top">
                  <span className="sp-tag">El seminario · 5 videos · 4 horas</span>
                  <div className="sp-val"><s>US$297</s><em>incluido</em></div>
                </div>
                <h3>
                  {isV1
                    ? 'Seminario de Opciones Financieras: Más Allá de lo Básico'
                    : isV2
                    ? 'Seminario: De los Fundamentos a las Estrategias'
                    : 'Seminario de Opciones'}
                </h3>
                <p>
                  {isV1
                    ? 'De los fundamentos a las estrategias en español. Formación estructurada de Ingresarios enfocada en riesgo definido, lectura de griegas y generación de flujo.'
                    : isV2
                    ? 'El puente exacto entre saber qué es un Call y un Put y tener un sistema repetible de opciones en español, sin humo ni señales ajenas.'
                    : 'Opciones desde cero, en español y en orden. Formación práctica de Ingresarios, con énfasis en riesgo definido y criterio antes de operar.'}
                </p>
                <ol className="sp-modules">
                  <li><span><b>Finanzas y base bursátil.</b> Deudas, presupuesto, fondos de emergencia y la regla de destinar máximo 10%–30% a trading con mentalidad de largo plazo.</span></li>
                  <li><span><b>Mecánica de gaps y niveles clave.</b> Horarios del mercado americano, lectura de brechas y niveles técnicos para nunca perseguir precios en la apertura.</span></li>
                  <li><span><b>Fundamentos de opciones y flujo de caja.</b> Calls, Puts, compra de contratos vs. cobro de primas como las aseguradoras y probabilidad de éxito (POP).</span></li>
                  <li><span><b>Griegas como instrumentos de vuelo.</b> Delta, Gamma, Theta (el paso del tiempo a tu favor), Vega e IV Crush para dejar de operar a ciegas.</span></li>
                  <li><span><b>Estrategias de Renta: La Rueda y PMCC.</b> Cash Secured Put, Covered Call y cómo simular 100 acciones con LEAPS reduciendo más del 50% de capital.</span></li>
                </ol>
                <div className="sp-outcome">
                  <div className="sp-outcome-title">Al terminar, antes de cada operación respondes</div>
                  <ol>
                    <li>¿Cuánto es lo máximo que puedo perder?</li>
                    <li>¿Desde qué precio empiezo a ganar?</li>
                    <li>¿Qué hago si el mercado no se mueve?</li>
                  </ol>
                  <p>Si no tienes las tres respuestas, no entras. Así de simple.</p>
                </div>
              </article>

              <article className="sp-card sp-card--sim sp-reveal">
                <div className="sp-card-top">
                  <span className="sp-tag">Complemento · Geny Options Academy</span>
                  <div className="sp-val"><s>US$197</s><em>incluido</em></div>
                </div>
                <h3>Simulador de Opciones Ingresarios</h3>
                <p>Practicas sin arriesgar dinero real y ves cada número antes de decidir.</p>
                <div className="sp-shot">
                  <div className="sp-shot-bar" aria-hidden><i /><i /><i /></div>
                  <img
                    src="/simulador-real.jpeg"
                    alt="Pantalla real del Simulador de Opciones Ingresarios con lecciones, cadena de opciones y panel de payoff"
                    loading="lazy" width={1728} height={876}
                  />
                </div>
                <ul className="sp-points">
                  <li>Pérdida máxima y punto de equilibrio antes de entrar.</li>
                  <li>Qué pasa si la acción sube, baja o se queda quieta.</li>
                  <li>Cómo cambia el valor de la opción con los días.</li>
                </ul>
              </article>

              <article className="sp-card sp-card--b1 sp-reveal">
                <div className="sp-card-top">
                  <span className="sp-tag">Bono 1 · PDF</span>
                  <div className="sp-val"><s>US$47</s><em>gratis</em></div>
                </div>
                <h3>Checklist pre-mercado</h3>
                <p>Para tenerlo abierto junto al bróker. Que tus decisiones no dependan de la memoria ni de la emoción.</p>
                <div className="sp-checklist" aria-label="Contenido del checklist">
                  <div className="sp-checklist-title">Antes de entrar, revisa</div>
                  <ul>
                    <li><span className="sp-box" aria-hidden />Pérdida máxima en dinero</li>
                    <li><span className="sp-box" aria-hidden />Punto de equilibrio</li>
                    <li><span className="sp-box" aria-hidden />Fecha de vencimiento</li>
                    <li><span className="sp-box" aria-hidden />Tamaño de la posición</li>
                    <li><span className="sp-box" aria-hidden />Qué pasa si el activo no se mueve</li>
                    <li><span className="sp-box" aria-hidden />Condiciones para entrar</li>
                  </ul>
                </div>
              </article>

              <article className="sp-card sp-card--b2 sp-reveal">
                <div className="sp-card-top">
                  <span className="sp-tag">Bono 2 · Videos</span>
                  <div className="sp-val"><s>US$97</s><em>gratis</em></div>
                </div>
                <h3>Guía para abrir y fondear tu bróker</h3>
                <p>Paso a paso desde Colombia o Latinoamérica, para que la parte técnica no sea la excusa.</p>
                <ul className="sp-points">
                  <li>Qué revisar en un bróker y cómo validar su regulación.</li>
                  <li>Abrir la cuenta y completar el registro.</li>
                  <li>Fondearla desde tu país: cómo enviar el dinero.</li>
                  <li>Cuándo dar el paso: después de practicar en el simulador.</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* ── PARA QUIÉN (VERSIÓN ORIGINAL EN PÁGINA PRINCIPAL) ── */}
        {!isV1 && !isV2 && (
          <section className="sp-section sp-section--alt" id="para-quien">
            <div className="sp-wrap">
              <div className="sp-intro sp-reveal">
                <span className="sp-kicker">Antes de comprar</span>
                <h2>Para quién es <em>(y para quién no).</em></h2>
              </div>
              <div className="sp-fit">
                <div className="sp-fit--yes sp-reveal">
                  <h3>Es para ti si…</h3>
                  <ul>
                    <li>Tienes ahorros en un CDT o en el banco y quieres entender otras alternativas antes de mover un peso.</li>
                    <li>Prefieres saber cuánto puedes perder antes que soñar con cuánto puedes ganar.</li>
                    <li>Puedes dedicarle unas horas esta semana a estudiar y practicar.</li>
                    <li>Quieres aprender en español, paso a paso, sin depender de las señales de nadie.</li>
                  </ul>
                </div>
                <div className="sp-fit--no sp-reveal">
                  <h3>No es para ti si…</h3>
                  <ul>
                    <li>Buscas hacerte rico rápido.</li>
                    <li>Quieres que alguien te diga qué comprar y cuándo.</li>
                    <li>Piensas operar con dinero que necesitas para vivir o que pediste prestado.</li>
                    <li>No estás dispuesto a practicar primero en el simulador.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── AUTORIDAD Y MENTOR: JUAN VILLEGAS ── */}
        <section className="sp-section sp-mentor-section" id="mentor">
          <div className="sp-wrap">
            {/* Título visible en pantallas medianas y móviles antes de la foto */}
            <div className="sp-mentor-header sp-mentor-header--mobile sp-reveal">
              <span className="sp-kicker">Quién enseña el seminario</span>
              <h2 className="sp-mentor-title">
                Aprende un método creado por traders reales, <em>no de influencers de redes.</em>
              </h2>
            </div>

            <div className="sp-mentor-grid">
              
              {/* Columna Izquierda: Retrato y Credencial Visual */}
              <div className="sp-mentor-media sp-reveal">
                <div className="sp-mentor-card">
                  <div className="sp-mentor-glow" aria-hidden />
                  <div className="sp-mentor-img-frame">
                    <img
                      src="/juan-mentor.png"
                      alt="Juan Fernando Villegas - Fundador de Ingresarios"
                      className="sp-mentor-img"
                      loading="lazy"
                      width={1254}
                      height={1254}
                    />
                  </div>
                  <div className="sp-mentor-card-footer">
                    <div className="sp-mentor-card-badge">
                      <span className="sp-pulse-dot" />
                      <span>Mentor Principal</span>
                    </div>
                    <b>Juan Fernando Villegas</b>
                    <p>Fundador de Ingresarios · Trader & Creador del Método</p>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Bio, Filosofía y Métricas */}
              <div className="sp-mentor-info sp-reveal">
                {/* Título visible en desktop al lado de la foto */}
                <div className="sp-mentor-header sp-mentor-header--desktop">
                  <span className="sp-kicker">Quién enseña el seminario</span>
                  <h2 className="sp-mentor-title">
                    Aprende un método creado por traders reales, <em>no de influencers de redes.</em>
                  </h2>
                </div>
                
                <div className="sp-mentor-quote">
                  <p>
                    «No operamos por suerte ni por corazonadas; operamos con un sistema, tecnología y, sobre todo, criterio profesional.»
                  </p>
                  <span>— Juan Fernando Villegas</span>
                </div>

                <div className="sp-mentor-bio-text">
                  <p>
                    <strong>Juan Fernando Villegas</strong> es la mente detrás del Método Ingresarios y uno de los referentes más respetados en la profesionalización del trading y las inversiones en Latinoamérica. Con más de 20 años de experiencia enfrentando la volatilidad de los mercados globales, ha consolidado una carrera basada en la transparencia y la disciplina matemática.
                  </p>
                  <p>
                    Reconocido en la industria como un <strong>"anti-gurú"</strong>, su enfoque no persigue promesas de dinero fácil ni pantallas de ganancias mágicas, sino la maestría técnica: cómo funciona realmente la subasta de Wall Street, cómo proteger el capital antes de buscar rentabilidad y cómo utilizar las opciones financieras como herramientas quirúrgicas de generación de renta con riesgo 100% definido antes de hacer clic.
                  </p>
                  <p>
                    {isV1
                      ? 'Este seminario condensa toda esa trayectoria en una ruta estructurada de 5 módulos para que inversionistas con bases previas consoliden su formación y operen con la disciplina técnica con la que gestionan los profesionales.'
                      : isV2
                      ? 'Este seminario condensa 20 años de cancha real en 5 clases al grano para que pases de saber qué es un Call y un Put a operar con el criterio matemático de un profesional.'
                      : 'Este seminario condensa toda esa trayectoria en una ruta estructurada de 5 pasos para que cualquier persona en español pueda operar con la misma tranquilidad con la que gestionan los profesionales.'}
                  </p>
                </div>

                {/* Métricas de Autoridad */}
                <div className="sp-mentor-stats">
                  <div className="sp-mentor-stat">
                    <b>+20</b>
                    <span>Años de trayectoria en mercados globales</span>
                  </div>
                  <div className="sp-mentor-stat">
                    <b>+12,000</b>
                    <span>Traders e inversionistas en la comunidad</span>
                  </div>
                  <div className="sp-mentor-stat">
                    <b>+1,500</b>
                    <span>Graduados de programas certificados</span>
                  </div>
                  <div className="sp-mentor-stat">
                    <b>100%</b>
                    <span>Enfoque en riesgo definido y datos reales</span>
                  </div>
                </div>

                {/* Sellos de Respaldo */}
                <div className="sp-mentor-tags">
                  <span className="sp-mentor-tag">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    Operativa real y transparente
                  </span>
                  <span className="sp-mentor-tag">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    Tecnología bursátil algorítmica
                  </span>
                  <span className="sp-mentor-tag">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    Autor y conferencista internacional
                  </span>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ── PRECIO ── */}
        <section className="sp-price" id="precio">
          <div className="sp-wrap">
            <div className="sp-intro sp-center sp-reveal" style={{ marginBottom: 48 }}>
              <span className="sp-kicker">
                {isV1 ? 'Inscripción al programa' : isV2 ? 'Menos de lo que cuesta un mal trade' : 'La oferta de lanzamiento'}
              </span>
              {isV1 ? (
                <h2>Acceso integral al seminario <em>y entorno de simulación.</em></h2>
              ) : isV2 ? (
                <h2>Un solo contrato mal elegido te cuesta <em>mucho más que US${OFFER.price}.</em></h2>
              ) : (
                <h2>Por menos de lo que cuesta <em>una salida a cenar.</em></h2>
              )}
            </div>

            <div className="sp-offer sp-reveal">
              <div className="sp-offer-stack">
                <h3>{isV1 ? 'Resumen del programa incluido' : 'Todo lo que recibes hoy'}</h3>
                <div className="sp-stack-row">
                  <span>
                    {isV1
                      ? 'Seminario de Opciones Financieras · Más Allá de lo Básico'
                      : isV2
                      ? 'Seminario: De los Fundamentos a las Estrategias'
                      : 'Seminario de Opciones'}
                    <small>{isV1 ? '5 módulos · 4 horas de formación estratégica' : '5 videos · 4 horas de formación'}</small>
                  </span>
                  <s>US$297</s>
                </div>
                <div className="sp-stack-row"><span>Simulador de Opciones Ingresarios<small>Complemento · Geny Options Academy</small></span><s>US$197</s></div>
                <div className="sp-stack-row"><span>Bono 1 · Checklist pre-mercado<small>PDF</small></span><s>US$47</s></div>
                <div className="sp-stack-row"><span>Bono 2 · Guía de bróker<small>Videos</small></span><s>US$97</s></div>
                <div className="sp-stack-total"><span>Valor total</span><s>US$638</s></div>
              </div>

              <div className="sp-offer-buy">
                <span className="sp-kicker">{isV1 ? 'Inversión única' : 'Hoy pagas'}</span>
                <div className="sp-big-price"><small>US$</small><b>{OFFER.price}</b></div>
                <div className="sp-price-sub">Pago único. Sin mensualidades.</div>
                <div className="sp-ladder">
                  <div className="is-now"><b>US${OFFER.price}</b>Lanzamiento · hoy</div>
                  <div><b>US${OFFER.nextPrice}</b>Desde el {OFFER.raiseLabel}</div>
                </div>
                <a className="sp-btn sp-btn--block sp-btn--lg" href={CTA_HREF} id="cta-precio">
                  {isV1 ? 'Completar inscripción' : isV2 ? 'Quiero pasar al nivel estratégico' : 'Quiero entrar al Seminario'} <Arrow />
                </a>
                <div className="sp-fine" style={{ justifyContent: 'center' }}>
                  <span>Garantía de 7 días</span>
                  <span>Acceso inmediato</span>
                </div>
                {(isV1 || isV2) && (
                  <p className="sp-v1-price-tribu">
                    ¿Ya eres miembro de la Tribu?{' '}
                    <a href={WHATSAPP_TRIBU_URL} target="_blank" rel="noopener noreferrer">
                      Contáctanos antes de inscribirte
                    </a>
                  </p>
                )}
              </div>
            </div>

            <div className="sp-urgency sp-reveal">
              {isV1 ? (
                <>
                  <p>
                    Tarifa institucional de lanzamiento de US${OFFER.price} vigente hasta el {OFFER.deadlineLabel}. A partir del {OFFER.raiseLabel} el valor regular será de US${OFFER.nextPrice}.
                  </p>
                  <p>Programa en modalidad grabada con acceso inmediato al campus y al simulador tras confirmar tu inscripción.</p>
                </>
              ) : isV2 ? (
                <>
                  <p>
                    Entrar a una sola operación sin entender Theta o el límite de pérdida suele costar cientos de dólares en minutos. Hoy desbloqueas el sistema completo por US${OFFER.price}.
                  </p>
                  <p>Precio especial de lanzamiento hasta el {OFFER.deadlineLabel}. El {OFFER.raiseLabel} sube a US${OFFER.nextPrice}.</p>
                </>
              ) : (
                <>
                  <p>
                    Hoy está en veintisiete dólares porque es el lanzamiento. El {OFFER.raiseLabel} sube a cuarenta y siete.
                  </p>
                  <p>No hay cupos limitados ni cuentas regresivas inventadas. Es un seminario en video; lo único que cambia es el precio.</p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── GARANTÍA ── */}
        <section className="sp-section" id="garantia" style={{ paddingTop: 40 }}>
          <div className="sp-wrap">
            <div className="sp-guarantee sp-reveal">
              <Seal />
              <div>
                <span className="sp-kicker">{isV1 ? 'Respaldo institucional' : 'Garantía'}</span>
                <h2>{isV1 ? 'Siete días para evaluar el programa con respaldo total.' : 'Siete días. El riesgo es nuestro.'}</h2>
                <p>
                  {isV1
                    ? `Accede a los módulos, pon a prueba el simulador y revisa los recursos complementarios. Si durante los primeros 7 días consideras que el contenido no corresponde a tus expectativas formativas, solicitas el reembolso íntegro de tus US$${OFFER.price}.`
                    : `Entra, mira los videos, practica en el simulador y descarga los bonos. Si en los primeros 7 días sientes que no era lo que esperabas, nos escribes y te devolvemos tus US$${OFFER.price}. Sin preguntas incómodas.`}
                </p>
                <div className="sp-sign">
                  <span className="sp-hand">Ingresarios</span>
                  <small>{isV1 ? 'Seminario de Opciones Financieras' : 'Seminario de Opciones'}</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="sp-section">
          <div className="sp-narrow" style={{ maxWidth: 860 }}>
            <div className="sp-reveal">
              <span className="sp-kicker">Preguntas frecuentes</span>
              <h2>{isV1 ? 'Consultas habituales antes de inscribirse.' : 'Lo que más nos preguntan.'}</h2>
            </div>
            <div className="sp-faq">
              {isV1 ? (
                <>
                  <details>
                    <summary>¿Qué conocimientos previos debo tener para inscribirme?</summary>
                    <p>
                      Este programa va más allá de lo básico. Está orientado a quienes ya identifican conceptos esenciales como{' '}
                      <strong>Call, Put, primas, contratos y fechas de vencimiento</strong>. Si estás comenzando completamente desde cero,{' '}
                      <a href={WHATSAPP_ZERO_URL} target="_blank" rel="noopener noreferrer" className="sp-v1-inline-link">
                        escríbenos a la línea oficial de soporte
                      </a>{' '}
                      para orientarte hacia la ruta inicial adecuada.
                    </p>
                  </details>
                  <details>
                    <summary>¿Qué hago si ya soy miembro de la Tribu Ingresarios?</summary>
                    <p>
                      Este enlace de inscripción está pensado para público externo que hoy no forma parte activa de nuestros programas. Si ya eres miembro de la Tribu,{' '}
                      <a href={WHATSAPP_TRIBU_URL} target="_blank" rel="noopener noreferrer" className="sp-v1-inline-link">
                        contáctanos antes de realizar la compra
                      </a>{' '}
                      para orientarte internamente.
                    </p>
                  </details>
                </>
              ) : isV2 ? (
                <>
                  <details>
                    <summary>Ya sé qué es un Call y un Put, ¿de verdad me va a aportar valor?</summary>
                    <p>
                      Justamente para ti fue hecho. La mayoría se queda estancada sabiendo qué es un contrato, pero perdiendo dinero por no dominar las Griegas (Theta y Vega), la probabilidad (POP) ni estrategias de cobro de renta como <strong>La Rueda y PMCC</strong>. Aquí pasas del diccionario al sistema real.
                    </p>
                  </details>
                  <details>
                    <summary>¿Y si todavía estoy empezando desde cero absoluto?</summary>
                    <p>
                      Si aún no reconoces conceptos básicos como Call, Put, prima o fecha de vencimiento, antes de comprar{' '}
                      <a href={WHATSAPP_ZERO_URL} target="_blank" rel="noopener noreferrer" className="sp-v1-inline-link">
                        escríbenos a nuestra línea oficial de soporte
                      </a>{' '}
                      para recomendarte la ruta inicial de Ingresarios ideal para ti.
                    </p>
                  </details>
                  <details>
                    <summary>¿Qué pasa si ya soy miembro de la Tribu Ingresarios?</summary>
                    <p>
                      Si ya eres miembro activo de la Tribu,{' '}
                      <a href={WHATSAPP_TRIBU_URL} target="_blank" rel="noopener noreferrer" className="sp-v1-inline-link">
                        contáctanos antes de comprar
                      </a>{' '}
                      para orientarte internamente.
                    </p>
                  </details>
                </>
              ) : (
                <details>
                  <summary>¿Necesito saber de bolsa?</summary>
                  <p>No. El seminario arranca por finanzas personales y por qué es una acción. Si sabes lo que es un CDT, puedes seguirlo.</p>
                </details>
              )}
              <details>
                <summary>¿Cuánto dinero necesito para empezar?</summary>
                <p>
                  Para el seminario y el simulador, cero dólares: practicas en un entorno simulado guiado por tutor IA. Para operar en real, no necesitas miles de dólares comprando 100 acciones: en el Video 5 aprenderás la estrategia <strong>PMCC (Poor Man's Covered Call)</strong> con contratos LEAPS, diseñada específicamente para carteras pequeñas con más del 50% de reducción en capital requerido.
                </p>
              </details>
              <details>
                <summary>¿Las opciones no son demasiado riesgosas?</summary>
                <p>
                  Pueden serlo si se usan mal. Por eso el seminario se enfoca en estrategias de riesgo definido y en revisar la pérdida máxima antes de
                  entrar. El riesgo no desaparece; la idea es que lo conozcas y lo controles.
                </p>
              </details>
              <details>
                <summary>¿Funciona desde Colombia u otro país de Latinoamérica?</summary>
                <p>Sí. El Bono 2 está hecho justamente para eso: cómo elegir, validar, abrir y fondear un bróker desde la región.</p>
              </details>
              <details>
                <summary>¿Qué significa “en 7 días”?</summary>
                <p>
                  Que el contenido está pensado para verlo y practicarlo en una semana: los 5 videos, las operaciones en el simulador y el checklist.
                  Si necesitas ir más despacio, vas a tu ritmo.
                </p>
              </details>
              <details>
                <summary>¿Cómo recibo el acceso?</summary>
                <p>Al completar el pago te llega un correo con el acceso al seminario, al simulador y a los bonos.</p>
              </details>
              <details>
                <summary>¿Y si no me gusta?</summary>
                <p>Tienes 7 días de garantía. Nos escribes y te devolvemos el dinero.</p>
              </details>
            </div>
          </div>
        </section>

        {/* ── CIERRE ── */}
        <section className="sp-section sp-section--alt">
          <div className="sp-narrow" style={{ maxWidth: 940 }}>
            <div className="sp-intro sp-center sp-reveal" style={{ marginBottom: 40 }}>
              <span className="sp-kicker">
                {isV1 ? 'Tu siguiente paso formativo' : isV2 ? 'El punto de quiebre' : 'La decisión'}
              </span>
              {isV1 ? (
                <h2>Consolidar tus bases marca la diferencia <em>al momento de operar.</em></h2>
              ) : isV2 ? (
                <h2>Tu próxima operación la puedes abrir <em>de dos maneras.</em></h2>
              ) : (
                <h2>Dentro de un año vas a estar <em>en uno de estos dos lugares.</em></h2>
              )}
            </div>
            <div className="sp-roads">
              <div className="sp-road sp-reveal">
                <span className="sp-tag">{isV1 ? 'Escenario 1' : 'Camino 1'}</span>
                <h3>
                  {isV1
                    ? 'Quedarte en conceptos aislados'
                    : isV2
                    ? 'Seguir probando suerte con lo básico'
                    : 'Renuevas el CDT'}
                </h3>
                <p>
                  {isV1
                    ? 'Saber qué es un Call o un Put sin integrar lectura de griegas, probabilidad ni reglas de riesgo definido suele traducirse en ejecuciones intuitivas y resultados inconsistentes.'
                    : isV2
                    ? 'Seguir comprando Calls o Puts por corazonada, viendo cómo Theta desgasta tu prima cada día y dudando frente a la cadena de opciones.'
                    : 'Otros 365 días con el dinero amarrado, el mismo 10% en el papel y la misma duda de si había algo mejor. Es válido, pero ya sabes cómo termina.'}
                </p>
              </div>
              <div className="sp-road sp-road--b sp-reveal">
                <span className="sp-tag">{isV1 ? 'Escenario 2' : 'Camino 2'}</span>
                <h3>
                  {isV1
                    ? `Estructurar un método profesional por US$${OFFER.price}`
                    : isV2
                    ? `Operar con un sistema probado por US$${OFFER.price}`
                    : `Inviertes una semana y US$${OFFER.price}`}
                </h3>
                <p>
                  {isV1
                    ? 'Profundizas en estrategias de flujo de caja como La Rueda y PMCC, validas tus posiciones en el simulador con IA y operas bajo un protocolo claro de gestión de capital.'
                    : isV2
                    ? 'Dominas las Griegas en una semana, practicas La Rueda y PMCC en el simulador con IA y nunca vuelves a abrir una operación sin saber tu pérdida máxima exacta.'
                    : 'Haces el Seminario de Opciones, entiendes cómo funcionan, practicas sin riesgo y decides con tu propio número qué parte de tu capital pones a trabajar.'}
                </p>
              </div>
            </div>
            <div className="sp-center sp-reveal">
              <a className="sp-btn sp-btn--lg" href={CTA_HREF} id="cta-cierre">
                {isV1
                  ? `Inscribirme al Seminario · US$${OFFER.price}`
                  : isV2
                  ? `Quiero operar con sistema · US$${OFFER.price}`
                  : `Elijo el camino 2 · US$${OFFER.price}`}{' '}
                <Arrow />
              </a>
              <div className="sp-fine" style={{ justifyContent: 'center' }}>
                <span>Acceso inmediato</span>
                <span>Garantía de 7 días</span>
              </div>
            </div>
            <div className="sp-ps">
              <p><b>P.D.</b>El precio de US${OFFER.price} es solo durante el lanzamiento. El {OFFER.raiseLabel} sube a US${OFFER.nextPrice}.</p>
              <p style={{ marginBottom: 0 }}><b>P.P.D.</b>Si todavía no estás seguro, recuerda que tienes 7 días para pedir tu dinero de vuelta. El riesgo de probar es nuestro.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="sp-footer">
        <div className="sp-wrap">
          <div className="sp-footer-brand">
            <div className="sp-footer-brand-header">
              <span className="sp-footer-logo">INGRESARIOS</span>
              <span className="sp-footer-badge">
                {isV1
                  ? 'Seminario de Opciones Financieras · Más Allá de lo Básico'
                  : isV2
                  ? 'Seminario de Opciones · Nivel Estratégico'
                  : 'Seminario de Opciones'}
              </span>
            </div>
            <p className="sp-footer-tagline">
              Programa de formación integral en opciones financieras con el simulador interactivo complementario Geny Options Academy.
            </p>
          </div>


          <div className="sp-footer-disc-links-bar">
            <span className="sp-footer-disc-links-label">Páginas de descargo oficial:</span>
            <div className="sp-footer-disc-links">
              <a
                href="https://www.ingresarios.com/descargo-testimonial"
                target="_blank"
                rel="noopener noreferrer"
                className="sp-footer-disc-link"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>Descargo de responsabilidad testimonial</span>
                <span className="sp-footer-ext">↗</span>
              </a>
              <a
                href="https://www.ingresarios.com/descargo-criptomonedas"
                target="_blank"
                rel="noopener noreferrer"
                className="sp-footer-disc-link"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>Divulgación de riesgos para monedas digitales</span>
                <span className="sp-footer-ext">↗</span>
              </a>
            </div>
          </div>

          <div className="sp-footer-bottom">
            <div className="sp-footer-legal-links">
              <a
                href="https://site.ingresarios.net/politicas-privacidad"
                target="_blank"
                rel="noopener noreferrer"
              >
                Políticas de Privacidad
              </a>
              <span className="sp-footer-sep">·</span>
              <a
                href="https://site.ingresarios.net/terminos-de-uso-de-informacion"
                target="_blank"
                rel="noopener noreferrer"
              >
                Términos y Condiciones
              </a>
              <span className="sp-footer-sep">·</span>
              <a
                href="https://site.ingresarios.net/politicas-tratamiento-de-datos-personales"
                target="_blank"
                rel="noopener noreferrer"
              >
                Política y Tratamiento de Datos Personales
              </a>
            </div>
            <div className="sp-footer-copy">
              Ingresarios © {new Date().getFullYear()} · Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>

      {/* Barra fija inferior */}
      <div className={`sp-sticky${stickyOn ? ' is-on' : ''}`} aria-hidden={!stickyOn}>
        <div className="sp-wrap">
          <div className="sp-sticky-txt">
            <s>US${OFFER.nextPrice}</s><b>US${OFFER.price}</b>{' '}
            <span>
              {isV1
                ? `Seminario de Opciones Financieras · tarifa de lanzamiento hasta el ${OFFER.deadlineLabel}`
                : isV2
                ? `De los fundamentos a la estrategia · lanzamiento hasta el ${OFFER.deadlineLabel}`
                : `Seminario de Opciones · lanzamiento hasta el ${OFFER.deadlineLabel}`}
            </span>
          </div>
          <a className="sp-btn" href={CTA_HREF} tabIndex={stickyOn ? 0 : -1}>
            {isV1 ? 'Inscribirme' : isV2 ? 'Quiero el sistema' : 'Quiero entrar'} <Arrow />
          </a>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
