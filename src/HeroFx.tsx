import React, { useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────────────────────
   FONDO DE TRADING DE OPCIONES DE ALTO IMPACTO (OPTIONS QUANT ENGINE)
   - Gráfico de Velas Japonesas en movimiento continuo
   - Zonas de Riesgo Definido (Bull Call Spread 550/560 con payoff sombreado)
   - Niveles de Strikes reales: 560 (Ganancia Máx), 552.50 (Equilibrio), 550 (ATM)
   - Medias móviles exponenciales (EMAs) luminosas con resplandor
   - Retícula de precios y eje temporal
   - Escaneo láser de vencimientos y sonda interactiva con el cursor
   ───────────────────────────────────────────────────────────── */

export function TradingOptionsHeroBg() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0;
    let t = 0;
    let off = 0;
    let mx = 0.5, my = 0.5;
    let targetMx = 0.5, targetMy = 0.5;
    let isHovering = false;

    // Configuración de las velas
    const SLOT = 24; // ancho por ranura de vela
    type Candle = { o: number; c: number; h: number; l: number; vol: number };
    let candles: Candle[] = [];
    let currentPrice = 551.5;

    const nextCandle = (): Candle => {
      const o = currentPrice;
      // Tendencia levemente oscilante alrededor de 551
      const drift = (551.5 - o) * 0.05;
      const change = (Math.random() - 0.49) * 2.8 + drift;
      const c = +(o + change).toFixed(2);
      currentPrice = c;
      const high = +(Math.max(o, c) + Math.random() * 2.2 + 0.3).toFixed(2);
      const low = +(Math.min(o, c) - Math.random() * 2.2 - 0.3).toFixed(2);
      const vol = Math.random() * 0.8 + 0.2;
      return { o, c, h: high, l: low, vol };
    };

    const initCandles = () => {
      candles = [];
      currentPrice = 548.0;
      const count = Math.ceil(w / SLOT) + 10;
      for (let i = 0; i < count; i++) {
        candles.push(nextCandle());
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (candles.length === 0) initCandles();
    };

    // Mapeo de precio a coordenada Y
    // 530 abajo, 570 arriba
    const minP = 534;
    const maxP = 568;
    const priceToY = (p: number) => {
      const norm = (p - minP) / (maxP - minP);
      return h * (0.86 - norm * 0.72);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Interpolación suave del cursor
      mx += (targetMx - mx) * 0.05;
      my += (targetMy - my) * 0.05;
      t += 0.016;

      // ── 1. RETÍCULA Y EJE DE PRECIOS ──
      const STRIKES = [
        { price: 565, label: '565.00', type: 'minor' },
        { price: 560, label: '560.00 · GANANCIA MÁXIMA (+US$750)', type: 'target' },
        { price: 555, label: '555.00', type: 'minor' },
        { price: 552.5, label: '552.50 · PUNTO DE EQUILIBRIO (BE)', type: 'be' },
        { price: 550, label: '550.00 · STRIKE COMPRADO (ATM)', type: 'atm' },
        { price: 545, label: '545.00', type: 'minor' },
        { price: 540, label: '540.00 · PÉRDIDA MÁXIMA DEFINIDA (−US$250)', type: 'risk' },
      ];

      // Función para gradientes horizontales: nítidos en los flancos, suaves en el centro para no cortar los textos
      const makeStrikeStroke = (r: number, g: number, b: number, baseA: number) => {
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${baseA})`);
        grad.addColorStop(0.24, `rgba(${r}, ${g}, ${b}, ${baseA * 0.88})`);
        grad.addColorStop(0.38, `rgba(${r}, ${g}, ${b}, ${baseA * 0.22})`);
        grad.addColorStop(0.62, `rgba(${r}, ${g}, ${b}, ${baseA * 0.22})`);
        grad.addColorStop(0.76, `rgba(${r}, ${g}, ${b}, ${baseA * 0.88})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${baseA})`);
        return grad;
      };

      // Zona sombreada del Bull Call Spread (ganancia definida arriba de 552.50)
      const y560 = priceToY(560);
      const y552 = priceToY(552.5);
      const y550 = priceToY(550);
      const y540 = priceToY(540);

      // Zona de ganancia (verde esmeralda translúcido, despejada en el centro para no competir con el texto)
      const gradProfit = ctx.createLinearGradient(0, 0, w, 0);
      gradProfit.addColorStop(0, 'rgba(34, 197, 94, 0.15)');
      gradProfit.addColorStop(0.24, 'rgba(34, 197, 94, 0.10)');
      gradProfit.addColorStop(0.38, 'rgba(34, 197, 94, 0.04)');
      gradProfit.addColorStop(0.62, 'rgba(34, 197, 94, 0.04)');
      gradProfit.addColorStop(0.76, 'rgba(34, 197, 94, 0.10)');
      gradProfit.addColorStop(1, 'rgba(34, 197, 94, 0.15)');
      ctx.fillStyle = gradProfit;
      ctx.fillRect(0, y560, w, y552 - y560);

      // Zona de riesgo definido (ámbar coral sutil, despejada en el centro)
      const gradRisk = ctx.createLinearGradient(0, 0, w, 0);
      gradRisk.addColorStop(0, 'rgba(226, 123, 98, 0.09)');
      gradRisk.addColorStop(0.24, 'rgba(226, 123, 98, 0.06)');
      gradRisk.addColorStop(0.38, 'rgba(226, 123, 98, 0.025)');
      gradRisk.addColorStop(0.62, 'rgba(226, 123, 98, 0.025)');
      gradRisk.addColorStop(0.76, 'rgba(226, 123, 98, 0.06)');
      gradRisk.addColorStop(1, 'rgba(226, 123, 98, 0.09)');
      ctx.fillStyle = gradRisk;
      ctx.fillRect(0, y550, w, y540 - y550);

      // Líneas horizontales de niveles de trading
      STRIKES.forEach((s) => {
        const y = priceToY(s.price);

        ctx.beginPath();
        if (s.type === 'target') {
          ctx.strokeStyle = makeStrikeStroke(34, 197, 94, 0.48);
          ctx.lineWidth = 1.2;
          ctx.setLineDash([6, 5]);
        } else if (s.type === 'be') {
          ctx.strokeStyle = makeStrikeStroke(241, 208, 138, 0.42);
          ctx.lineWidth = 1.1;
          ctx.setLineDash([4, 4]);
        } else if (s.type === 'atm') {
          ctx.strokeStyle = makeStrikeStroke(214, 168, 78, 0.58);
          ctx.lineWidth = 1.4;
          ctx.setLineDash([8, 6]);
        } else if (s.type === 'risk') {
          ctx.strokeStyle = makeStrikeStroke(226, 123, 98, 0.42);
          ctx.lineWidth = 1.1;
          ctx.setLineDash([6, 5]);
        } else {
          ctx.strokeStyle = makeStrikeStroke(255, 255, 255, 0.04);
          ctx.lineWidth = 0.8;
          ctx.setLineDash([]);
        }

        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Etiquetas de los niveles en el margen derecho y flotando sutilmente
        if (s.type !== 'minor' && w > 640) {
          ctx.font = '10px "IBM Plex Mono", monospace';
          const text = s.label;
          const textW = ctx.measureText(text).width;
          const tagX = w - textW - 32;

          // Píldora de vidrio oscuro detrás de la etiqueta
          ctx.fillStyle = 'rgba(10, 12, 16, 0.85)';
          ctx.strokeStyle = s.type === 'target' ? 'rgba(34, 197, 94, 0.5)' :
                            s.type === 'atm' ? 'rgba(214, 168, 78, 0.6)' :
                            s.type === 'be' ? 'rgba(241, 208, 138, 0.45)' : 'rgba(226, 123, 98, 0.5)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.roundRect(tagX - 8, y - 14, textW + 16, 18, 4);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'left';
          if (s.type === 'target') ctx.fillStyle = '#22c55e';
          else if (s.type === 'be') ctx.fillStyle = '#f1d08a';
          else if (s.type === 'atm') ctx.fillStyle = '#fae29f';
          else if (s.type === 'risk') ctx.fillStyle = '#e27b62';
          ctx.fillText(text, tagX, y - 1);
        }
      });

      // ── 2. VELAS JAPONESAS DE TRADING (EN MOVIMIENTO CONTINUO) ──
      const candleWidth = 8;
      candles.forEach((k, i) => {
        const x = i * SLOT - off;
        if (x < -SLOT || x > w + SLOT) return;

        // Factor de atenuación en el centro para dar máxima nitidez a la tipografía
        const distFromCenter = Math.abs(x - w * 0.5) / (w * 0.5);
        const centerAlpha = Math.min(1, Math.max(0.38, distFromCenter * 1.25));

        ctx.save();
        ctx.globalAlpha = centerAlpha;

        const isUp = k.c >= k.o;
        const yOpen = priceToY(k.o);
        const yClose = priceToY(k.c);
        const yHigh = priceToY(k.h);
        const yLow = priceToY(k.l);

        const bodyTop = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(3, Math.abs(yOpen - yClose));

        // Mecha (shadow)
        ctx.beginPath();
        ctx.strokeStyle = isUp ? 'rgba(241, 208, 138, 0.75)' : 'rgba(190, 135, 115, 0.55)';
        ctx.lineWidth = 1.3;
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.stroke();

        // Cuerpo de la vela
        if (isUp) {
          // Vela alcista dorada con resplandor
          const grad = ctx.createLinearGradient(0, bodyTop, 0, bodyTop + bodyHeight);
          grad.addColorStop(0, '#fff0c7');
          grad.addColorStop(0.5, '#f1d08a');
          grad.addColorStop(1, '#c9952f');
          ctx.fillStyle = grad;
          ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

          // Borde luminoso
          ctx.strokeStyle = 'rgba(255, 245, 205, 0.95)';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
        } else {
          // Vela bajista grafito-coral suave
          ctx.fillStyle = 'rgba(26, 30, 38, 0.9)';
          ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
          ctx.strokeStyle = 'rgba(226, 123, 98, 0.65)';
          ctx.lineWidth = 1.1;
          ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
        }

        // Barra de volumen inferior
        const volH = k.vol * 38;
        ctx.fillStyle = isUp ? 'rgba(214, 168, 78, 0.22)' : 'rgba(170, 110, 100, 0.15)';
        ctx.fillRect(x - candleWidth / 2, h - volH - 10, candleWidth, volH);

        ctx.restore();
      });

      // ── 3. CINTAS DE MEDIAS MÓVILES (EMA 9 RÁPIDA + EMA 21 SUAVE) ──
      // EMA 21 (lenta)
      ctx.beginPath();
      let first21 = true;
      candles.forEach((_, i) => {
        const x = i * SLOT - off;
        const n = Math.min(i + 1, 21);
        let sum = 0;
        for (let j = 0; j < n; j++) sum += candles[i - j].c;
        const y = priceToY(sum / n);
        if (first21) { ctx.moveTo(x, y); first21 = false; } else { ctx.lineTo(x, y); }
      });
      ctx.strokeStyle = 'rgba(214, 168, 78, 0.4)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // EMA 9 (rápida con resplandor dorado intenso)
      ctx.beginPath();
      let first9 = true;
      candles.forEach((_, i) => {
        const x = i * SLOT - off;
        const n = Math.min(i + 1, 9);
        let sum = 0;
        for (let j = 0; j < n; j++) sum += candles[i - j].c;
        const y = priceToY(sum / n);
        if (first9) { ctx.moveTo(x, y); first9 = false; } else { ctx.lineTo(x, y); }
      });
      ctx.strokeStyle = '#fff2ce';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = 'rgba(241, 208, 138, 0.9)';
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── 4. HAZ DE LUZ VOLUMÉTRICO SUAVE (EXPIRATION SWEEP) ──
      const sweepX = ((t * 55) % (w + 400)) - 200;
      const gradSweep = ctx.createLinearGradient(sweepX - 120, 0, sweepX + 120, 0);
      gradSweep.addColorStop(0, 'rgba(214, 168, 78, 0)');
      gradSweep.addColorStop(0.5, 'rgba(255, 235, 175, 0.09)');
      gradSweep.addColorStop(1, 'rgba(214, 168, 78, 0)');
      ctx.fillStyle = gradSweep;
      ctx.fillRect(sweepX - 120, 0, 240, h);

      // ── 5. SONDA INTERACTIVA AL MOVER EL MOUSE (CROSSHAIR HUD) ──
      if (isHovering && w > 720) {
        const curX = mx * w;
        const curY = my * h;

        // Líneas guía crosshair
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(214, 168, 78, 0.28)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.moveTo(curX, 0);
        ctx.lineTo(curX, h);
        ctx.moveTo(0, curY);
        ctx.lineTo(w, curY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Punto pulsante en la intersección
        ctx.beginPath();
        ctx.arc(curX, curY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#f1d08a';
        ctx.shadowColor = '#f1d08a';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Tooltip flotante con telemetría de opciones
        const tooltipX = curX > w - 240 ? curX - 220 : curX + 16;
        const tooltipY = Math.max(30, Math.min(h - 50, curY - 20));
        ctx.fillStyle = 'rgba(14, 17, 22, 0.88)';
        ctx.strokeStyle = 'rgba(214, 168, 78, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, 200, 38, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = '10px "IBM Plex Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.fillText(`SPY: $${currentPrice.toFixed(2)}`, tooltipX + 10, tooltipY + 16);
        ctx.fillStyle = '#22c55e';
        ctx.fillText(`CALL 550C · RIESGO DEFINIDO`, tooltipX + 10, tooltipY + 30);
      }
    };

    const loop = () => {
      // Movimiento continuo de las velas hacia la izquierda
      off += 0.35;
      if (off >= SLOT) {
        off -= SLOT;
        candles.shift();
        candles.push(nextCandle());
      }
      draw();
      raf = requestAnimationFrame(loop);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      targetMx = (e.clientX - r.left) / r.width;
      targetMy = (e.clientY - r.top) / r.height;
      isHovering = true;
    };

    const handlePointerLeave = () => {
      isHovering = false;
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    if (!reduce) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  return <canvas ref={ref} className="sp-hero-bg-trading" aria-hidden />;
}

export default TradingOptionsHeroBg;
