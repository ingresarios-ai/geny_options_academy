import React, { useEffect, useMemo, useRef, useState } from 'react';
import './sales.css';

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
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.sp-reveal');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }),
      { threshold: 0.18, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
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
    const SLOT = 18;
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
    const y = (v: number) => h * 0.5 - v * 3.4;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      candles.forEach((k, i) => {
        const x = i * SLOT - off + SLOT / 2;
        const up = k.c >= k.o;
        ctx.strokeStyle = ctx.fillStyle = up ? 'rgba(214,168,78,.55)' : 'rgba(150,144,132,.4)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y(k.h)); ctx.lineTo(x, y(k.l)); ctx.stroke();
        const top = y(Math.max(k.o, k.c));
        ctx.fillRect(x - 3.5, top, 7, Math.max(2, Math.abs(y(k.o) - y(k.c))));
      });
      // media móvil
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(241,208,138,.9)'; ctx.lineWidth = 1.6;
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
          Y durante <strong>365 días</strong> no puedes tocar esa plata.
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

export const SalesPage: React.FC = () => {
  const countdown = useCountdown(OFFER.deadlineISO);
  const [stickyOn, setStickyOn] = useState(false);
  useReveal();

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
  }, []);

  return (
    <div className="sp">
      {/* Barra superior: urgencia real, sin inventos */}
      <div className="sp-topbar">
        <strong>Seminario de Opciones</strong> · Precio de lanzamiento: <strong>US${OFFER.price}</strong> hasta el {OFFER.deadlineLabel}. El {OFFER.raiseLabel} sube a US${OFFER.nextPrice}.
        {countdown && <span className="sp-count">{countdown}</span>}
      </div>

      <main id="top">
        {/* ── HERO DE ALTO IMPACTO (SALES PAGE) ── */}
        <section className="sp-hero">
          <HeroBackground />
          <div className="sp-wrap sp-hero-grid">
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

              <h1 className="sp-hero-h1">
                Seminario de <span className="sp-gold-grad">Opciones</span>
              </h1>
              <p className="sp-hero-sub">Aprende a operar con riesgo definido, desde cero y en español.</p>

              <p className="sp-lead">
                5 clases en video para entender cómo funcionan las opciones y saber <strong>cuánto puedes perder antes de entrar</strong>. Una alternativa a dejar tu plata quieta en un CDT.
              </p>

              <div className="sp-hero-ai">
                <b>Incluye simulador con tutor IA</b>
                <span>Practica sin dinero real y pregúntale al Coach Geny lo que no entiendas, a cualquier hora.</span>
              </div>

              <div className="sp-hero-cta">
                <a className="sp-btn sp-btn--lg" href={CTA_HREF} id="cta-hero">
                  Quiero entrar al Seminario <span className="sp-btn-price">· US${OFFER.price}</span> <Arrow />
                </a>
                <div className="sp-hero-price">
                  <s>US${OFFER.nextPrice}</s> <b>US${OFFER.price}</b> precio de lanzamiento hasta el {OFFER.deadlineLabel}
                </div>
              </div>

              <div className="sp-fine">
                <span>Acceso de por vida</span>
                <span>Garantía de 7 días</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── HECHOS ── */}
        <div className="sp-facts" aria-label="Qué incluye en números">
          <div className="sp-wrap">
            <div><b>5</b><span>videos del seminario</span></div>
            <div><b>+5 h</b><span>de formación práctica</span></div>
            <div><b>1</b><span>simulador de opciones</span></div>
            <div><b>2</b><span>bonos incluidos</span></div>
            <div><b>7 días</b><span>de garantía</span></div>
          </div>
        </div>

        {/* ── DOLOR: LA CUENTA REAL (oculta; quitar `hidden` para mostrarla) ── */}
        <section className="sp-section" hidden style={{ display: 'none' }}>
          <div className="sp-wrap">
            <div className="sp-intro sp-reveal">
              <span className="sp-kicker">Si tienes plata en un CDT</span>
              <h2>La cuenta que <em>el banco no te hace.</em></h2>
              <p>
                El papel dice 10%. Pero cuando le quitas la retención y lo que subió todo durante el año, la cifra cambia bastante.
                Mueve los valores y mira con tu propio número.
              </p>
            </div>

            <CdtCalculator />

            <div className="sp-after-calc">
              <p className="sp-bigquote sp-reveal">
                No es que el CDT sea malo. Es seguro, y para eso sirve. El problema es creer que <em>es lo único que puedes hacer</em> con tu plata.
              </p>
              <div className="sp-reveal">
                <p>
                  Mientras tanto, el banco toma esa misma plata y la presta a tasas mucho más altas de las que te paga. Tú pones el capital,
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
              <span className="sp-kicker">La diferencia</span>
              <h2>Las opciones no son el casino <em>que te contaron.</em></h2>
              <p style={{ fontSize: 19 }}>
                Nacieron como herramientas de cobertura. Bien usadas, te dejan poner el límite antes de entrar. Esto es lo que vas a aprender a hacer:
              </p>
              <div className="sp-pillars">
                <div className="sp-pillar">
                  <i>1</i>
                  <div>
                    <h3>Riesgo definido</h3>
                    <p>Conoces la pérdida máxima en dólares antes de abrir la operación. Si no te deja dormir tranquilo, no entras.</p>
                  </div>
                </div>
                <div className="sp-pillar">
                  <i>2</i>
                  <div>
                    <h3>Solo una parte de tu capital</h3>
                    <p>No mueves todo tu ahorro. Comprometes una parte pequeña y el resto sigue donde está.</p>
                  </div>
                </div>
                <div className="sp-pillar">
                  <i>3</i>
                  <div>
                    <h3>Primero practicas, sin plata real</h3>
                    <p>Haces las operaciones del reto en el simulador antes de tocar un peso. Llegas al mercado con criterio.</p>
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
              <span className="sp-kicker">Cómo funciona</span>
              <h2>Tu semana, <em>paso a paso.</em></h2>
              <p>Unas horas al día. Sin saltos ni videos sueltos: cada parte prepara la siguiente.</p>
            </div>
            <div className="sp-plan">
              <div className="sp-step sp-reveal">
                <div className="sp-step-dot">1</div>
                <div className="sp-step-days">Días 1 y 2</div>
                <h3>Entiendes</h3>
                <p>Salud financiera, acciones vs ETFs y la mecánica de gaps y horarios bursátiles. Sabes cómo se mueve el mercado antes de tocar opciones.</p>
              </div>
              <div className="sp-step sp-reveal">
                <div className="sp-step-dot">2</div>
                <div className="sp-step-days">Días 3 a 5</div>
                <h3>Practicas</h3>
                <p>Calls, Puts, la cadena de opciones y las griegas como instrumentos de navegación. Armas operaciones de cobro de renta en el simulador con tutor IA.</p>
              </div>
              <div className="sp-step sp-reveal">
                <div className="sp-step-dot">3</div>
                <div className="sp-step-days">Días 6 y 7</div>
                <h3>Dominas el sistema</h3>
                <p>Estrategias La Rueda y PMCC (LEAPS con 50% menos colateral), checklist pre-mercado y bróker listo para operar cuando tú decidas.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── QUÉ RECIBES ── */}
        <section className="sp-section" id="que-incluye">
          <div className="sp-wrap">
            <div className="sp-intro sp-reveal">
              <span className="sp-kicker">Lo que incluye el seminario</span>
              <h2>Todo para llegar a tu primera operación <em>sabiendo lo que haces.</em></h2>
            </div>

            <div className="sp-bento">
              <article className="sp-card sp-card--course sp-reveal">
                <div className="sp-card-top">
                  <span className="sp-tag">El seminario · 5 videos · +5 horas</span>
                  <div className="sp-val"><s>US$297</s><em>incluido</em></div>
                </div>
                <h3>Seminario de Opciones</h3>
                <p>Opciones desde cero, en español y en orden. Formación práctica de Ingresarios, con énfasis en riesgo definido y criterio antes de operar.</p>
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
                  <li>Fondearla desde tu país: cómo enviar la plata.</li>
                  <li>Cuándo dar el paso: después de practicar en el simulador.</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* ── PRECIO ── */}
        <section className="sp-price" id="precio">
          <div className="sp-wrap">
            <div className="sp-intro sp-center sp-reveal" style={{ marginBottom: 48 }}>
              <span className="sp-kicker">La oferta de lanzamiento</span>
              <h2>Por menos de lo que cuesta <em>una salida a comer.</em></h2>
            </div>

            <div className="sp-offer sp-reveal">
              <div className="sp-offer-stack">
                <h3>Todo lo que recibes hoy</h3>
                <div className="sp-stack-row"><span>Seminario de Opciones<small>5 videos · más de 5 horas</small></span><s>US$297</s></div>
                <div className="sp-stack-row"><span>Simulador de Opciones Ingresarios<small>Complemento · Geny Options Academy</small></span><s>US$197</s></div>
                <div className="sp-stack-row"><span>Bono 1 · Checklist pre-mercado<small>PDF</small></span><s>US$47</s></div>
                <div className="sp-stack-row"><span>Bono 2 · Guía de bróker<small>Videos</small></span><s>US$97</s></div>
                <div className="sp-stack-total"><span>Valor total</span><s>US$638</s></div>
              </div>

              <div className="sp-offer-buy">
                <span className="sp-kicker">Hoy pagas</span>
                <div className="sp-big-price"><small>US$</small><b>{OFFER.price}</b></div>
                <div className="sp-price-sub">Pago único. Sin mensualidades.</div>
                <div className="sp-ladder">
                  <div className="is-now"><b>US${OFFER.price}</b>Lanzamiento · hoy</div>
                  <div><b>US${OFFER.nextPrice}</b>Desde el {OFFER.raiseLabel}</div>
                </div>
                <a className="sp-btn sp-btn--block sp-btn--lg" href={CTA_HREF} id="cta-precio">
                  Quiero entrar al Seminario <Arrow />
                </a>
                <div className="sp-fine" style={{ justifyContent: 'center' }}>
                  <span>Garantía de 7 días</span>
                  <span>Acceso inmediato</span>
                </div>
              </div>
            </div>

            <div className="sp-urgency sp-reveal">
              <p>
                Hoy está en veintisiete dólares porque es el lanzamiento. El {OFFER.raiseLabel} sube a cuarenta y siete.
              </p>
              <p>No hay cupos limitados ni cuentas regresivas inventadas. Es un seminario en video; lo único que cambia es el precio.</p>
            </div>
          </div>
        </section>

        {/* ── GARANTÍA ── */}
        <section className="sp-section" id="garantia" style={{ paddingTop: 40 }}>
          <div className="sp-wrap">
            <div className="sp-guarantee sp-reveal">
              <Seal />
              <div>
                <span className="sp-kicker">Garantía</span>
                <h2>Siete días. El riesgo es nuestro.</h2>
                <p>
                  Entra, mira los videos, practica en el simulador y descarga los bonos. Si en los primeros 7 días sientes que no era lo que
                  esperabas, nos escribes y te devolvemos tus US${OFFER.price}. Sin preguntas incómodas.
                </p>
                <div className="sp-sign">
                  <span className="sp-hand">Ingresarios</span>
                  <small>Seminario de Opciones</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PARA QUIÉN ── */}
        <section className="sp-section sp-section--alt">
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
                  <li>Piensas operar con plata que necesitas para vivir o que pediste prestada.</li>
                  <li>No estás dispuesto a practicar primero en el simulador.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="sp-section">
          <div className="sp-narrow" style={{ maxWidth: 860 }}>
            <div className="sp-reveal">
              <span className="sp-kicker">Preguntas frecuentes</span>
              <h2>Lo que más nos preguntan.</h2>
            </div>
            <div className="sp-faq">
              <details>
                <summary>¿Necesito saber de bolsa?</summary>
                <p>No. El seminario arranca por finanzas personales y por qué es una acción. Si sabes lo que es un CDT, puedes seguirlo.</p>
              </details>
              <details>
                <summary>¿Cuánta plata necesito para empezar?</summary>
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
              <span className="sp-kicker">La decisión</span>
              <h2>Dentro de un año vas a estar <em>en uno de estos dos lugares.</em></h2>
            </div>
            <div className="sp-roads">
              <div className="sp-road sp-reveal">
                <span className="sp-tag">Camino 1</span>
                <h3>Renuevas el CDT</h3>
                <p>Otros 365 días con la plata amarrada, el mismo 10% en el papel y la misma duda de si había algo mejor. Es válido, pero ya sabes cómo termina.</p>
              </div>
              <div className="sp-road sp-road--b sp-reveal">
                <span className="sp-tag">Camino 2</span>
                <h3>Inviertes una semana y US${OFFER.price}</h3>
                <p>Haces el Seminario de Opciones, entiendes cómo funcionan, practicas sin riesgo y decides con tu propio número qué parte de tu capital pones a trabajar.</p>
              </div>
            </div>
            <div className="sp-center sp-reveal">
              <a className="sp-btn sp-btn--lg" href={CTA_HREF} id="cta-cierre">
                Elijo el camino 2 · US${OFFER.price} <Arrow />
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
          <p><strong>Seminario de Opciones · Ingresarios</strong> · Incluye Geny Options Academy, el simulador complementario.</p>
          <p>
            Contenido educativo. Operar opciones implica riesgo y puede resultar en la pérdida del capital invertido. Los ejemplos y cálculos son
            ilustrativos y no constituyen una recomendación de inversión. Resultados pasados no garantizan resultados futuros.
          </p>
          <p><a href="#">Términos y condiciones</a> · <a href="#">Política de privacidad</a></p>
        </div>
      </footer>

      {/* Barra fija inferior */}
      <div className={`sp-sticky${stickyOn ? ' is-on' : ''}`} aria-hidden={!stickyOn}>
        <div className="sp-wrap">
          <div className="sp-sticky-txt">
            <s>US${OFFER.nextPrice}</s><b>US${OFFER.price}</b> <span>Seminario de Opciones · lanzamiento hasta el {OFFER.deadlineLabel}</span>
          </div>
          <a className="sp-btn" href={CTA_HREF} tabIndex={stickyOn ? 0 : -1}>
            Quiero entrar <Arrow />
          </a>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
