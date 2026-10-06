import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';

export interface TutorialStep {
  id: string;
  targetId: string;
  badge: string;
  badgeCol?: string;
  icon: string;
  title: string;
  description: string;
  tip?: string;
  preferredPlacement?: 'top' | 'bottom' | 'left' | 'right';
  actionHint?: string;
}

interface TutorialSpotlightProps {
  isOpen: boolean;
  currentStepIndex: number;
  steps: TutorialStep[];
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onGoToStep: (index: number) => void;
}

export const TutorialSpotlight: React.FC<TutorialSpotlightProps> = ({
  isOpen,
  currentStepIndex,
  steps,
  onNext,
  onPrev,
  onClose,
  onGoToStep,
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [cardHeight, setCardHeight] = useState<number>(280);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isPeeking, setIsPeeking] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const step = steps[currentStepIndex];

  // Restablecer el estado minimizado al cambiar de paso
  useEffect(() => {
    setIsMinimized(false);
    setIsPeeking(false);
  }, [currentStepIndex]);

  // Actualizar coordenadas del elemento objetivo
  const updateTargetRect = () => {
    if (!step) return;
    const el = document.getElementById(step.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  };

  // Medir la altura real de la tarjeta tras cada render
  useLayoutEffect(() => {
    if (cardRef.current && !isMinimized) {
      const h = cardRef.current.offsetHeight;
      if (h > 0 && Math.abs(h - cardHeight) > 4) {
        setCardHeight(h);
      }
    }
  });

  useLayoutEffect(() => {
    if (!isOpen) return;

    // Retardo breve para sincronizar con transiciones y renderizados de tabs
    const timer = setTimeout(updateTargetRect, 60);
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      updateTargetRect();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isOpen, currentStepIndex, step?.targetId]);

  if (!isOpen || !step) return null;

  // Ancho responsivo de la tarjeta
  const cardWidth = Math.min(390, windowDimensions.width - 32);
  const margin = 16;
  const gap = 16; // Separación limpia entre el elemento y la tarjeta

  let safeTop = 0;
  let safeLeft = 0;
  let actualPlacement: 'left' | 'right' | 'top' | 'bottom' | 'center' = 'bottom';

  if (targetRect) {
    // Espacio libre disponible afuera del target
    const spaceLeft = targetRect.left - margin;
    const spaceRight = windowDimensions.width - targetRect.right - margin;
    const spaceTop = targetRect.top - margin;
    const spaceBottom = windowDimensions.height - targetRect.bottom - margin;

    const preferred = step.preferredPlacement || 'bottom';

    // Lista de colocaciones a evaluar respetando preferredPlacement
    const candidateOrder: ('left' | 'right' | 'top' | 'bottom')[] = [preferred];
    if (preferred === 'left') candidateOrder.push('right', 'bottom', 'top');
    else if (preferred === 'right') candidateOrder.push('left', 'bottom', 'top');
    else if (preferred === 'bottom') candidateOrder.push('top', 'left', 'right');
    else candidateOrder.push('bottom', 'left', 'right');

    let placed = false;

    for (const p of candidateOrder) {
      // 1. Colocación a la IZQUIERDA del elemento (ej. Entrada de Orden a la derecha)
      if (p === 'left' && spaceLeft >= cardWidth + gap) {
        safeLeft = targetRect.left - cardWidth - gap;
        // Alinear verticalmente de forma elegante cerca de la parte superior del target
        const idealTop = targetRect.top + Math.min(40, targetRect.height * 0.1);
        safeTop = Math.max(margin, Math.min(windowDimensions.height - (isMinimized ? 52 : cardHeight) - margin, idealTop));
        actualPlacement = 'left';
        placed = true;
        break;
      }

      // 2. Colocación a la DERECHA del elemento (ej. Misiones a la izquierda)
      if (p === 'right' && spaceRight >= cardWidth + gap) {
        safeLeft = targetRect.right + gap;
        const idealTop = targetRect.top + Math.min(40, targetRect.height * 0.1);
        safeTop = Math.max(margin, Math.min(windowDimensions.height - (isMinimized ? 52 : cardHeight) - margin, idealTop));
        actualPlacement = 'right';
        placed = true;
        break;
      }

      // 3. Colocación DEBAJO del elemento (ej. Activos, Tabs superiores, Tiempo)
      if (p === 'bottom' && spaceBottom >= (isMinimized ? 52 : cardHeight) + gap) {
        safeTop = targetRect.bottom + gap;
        const idealLeft = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);
        safeLeft = Math.max(margin, Math.min(windowDimensions.width - cardWidth - margin, idealLeft));
        actualPlacement = 'bottom';
        placed = true;
        break;
      }

      // 4. Colocación ARRIBA del elemento
      if (p === 'top' && spaceTop >= (isMinimized ? 52 : cardHeight) + gap) {
        safeTop = targetRect.top - (isMinimized ? 52 : cardHeight) - gap;
        const idealLeft = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);
        safeLeft = Math.max(margin, Math.min(windowDimensions.width - cardWidth - margin, idealLeft));
        actualPlacement = 'top';
        placed = true;
        break;
      }
    }

    // Si el elemento es masivo y ocupa casi toda la pantalla (ej. Option Chain central),
    // posicionamos la tarjeta en la parte inferior centrada para dejar libres todos los encabezados y strikes principales:
    if (!placed) {
      safeTop = Math.max(margin, windowDimensions.height - (isMinimized ? 52 : cardHeight) - margin - 15);
      const idealLeft = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);
      safeLeft = Math.max(margin, Math.min(windowDimensions.width - cardWidth - margin, idealLeft));
      actualPlacement = 'center';
    }
  } else {
    // Si no se encuentra el target, centrar en pantalla
    safeTop = Math.max(16, (windowDimensions.height - (isMinimized ? 52 : cardHeight)) / 2);
    safeLeft = Math.max(16, (windowDimensions.width - cardWidth) / 2);
    actualPlacement = 'center';
  }

  const isLast = currentStepIndex === steps.length - 1;

  // Etiqueta direccional para guiar la vista hacia el elemento resaltado
  const getDirectionHint = () => {
    switch (actualPlacement) {
      case 'left':
        return '👉 Elemento a la derecha';
      case 'right':
        return '👈 Elemento a la izquierda';
      case 'bottom':
        return '👆 Elemento arriba';
      case 'top':
        return '👇 Elemento abajo';
      default:
        return '🎯 Área resaltada';
    }
  };

  return (
    <>
      {/* Spotlight cutout & backdrop oscuro */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: 12,
            boxShadow: '0 0 0 9999px rgba(2, 6, 17, 0.85), 0 0 35px rgba(0, 212, 170, 0.55), inset 0 0 15px rgba(0, 212, 170, 0.2)',
            border: '2px solid #00d4aa',
            pointerEvents: 'none',
            zIndex: 10000,
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}

      {/* Fallback si el elemento no se encuentra */}
      {!targetRect && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 17, 0.85)',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tarjeta explicativa flotante con posicionamiento anti-colisión */}
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          top: `${safeTop}px`,
          left: `${safeLeft}px`,
          width: `${cardWidth}px`,
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          zIndex: 10001,
          opacity: isPeeking ? 0.18 : 1,
          transition: 'top 0.25s ease-out, left 0.25s ease-out, opacity 0.2s ease',
          background: 'linear-gradient(145deg, #0e1726, #09101d)',
          border: '1.5px solid #1f3a5f',
          borderRadius: 14,
          padding: isMinimized ? '10px 14px' : '16px 18px',
          color: '#e2e8f0',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 28px rgba(0, 212, 170, 0.25)',
          fontFamily: "'Inter', system-ui, sans-serif",
          boxSizing: 'border-box',
        }}
      >
        {/* Barra superior con badges, botón minimizar y botón cerrar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMinimized ? 0 : 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: 1.2,
                color: step.badgeCol || '#00d4aa',
                background: `${step.badgeCol || '#00d4aa'}18`,
                border: `1px solid ${step.badgeCol || '#00d4aa'}40`,
                padding: '3px 8px',
                borderRadius: 5,
                textTransform: 'uppercase',
              }}
            >
              {step.badge}
            </span>

            {/* Píldora de dirección para claridad visual */}
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: '#94a3b8',
                background: '#131e32',
                border: '1px solid #1e293b',
                padding: '3px 7px',
                borderRadius: 5,
              }}
            >
              {getDirectionHint()}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {/* Botón para espiar / ver lo que hay detrás */}
            <button
              onClick={() => setIsPeeking(p => !p)}
              title={isPeeking ? 'Restaurar opacidad' : 'Hacer transparente para ver detrás'}
              style={{
                background: isPeeking ? 'rgba(0, 212, 170, 0.25)' : 'transparent',
                border: '1px solid #1e293b',
                color: isPeeking ? '#00d4aa' : '#94a3b8',
                fontSize: 12,
                cursor: 'pointer',
                padding: '3px 7px',
                borderRadius: 5,
                lineHeight: 1,
              }}
            >
              👁️
            </button>

            {/* Botón Minimizar / Maximizar */}
            <button
              onClick={() => setIsMinimized(m => !m)}
              title={isMinimized ? 'Expandir explicación' : 'Minimizar tarjeta'}
              style={{
                background: 'transparent',
                border: '1px solid #1e293b',
                color: '#94a3b8',
                fontSize: 12,
                cursor: 'pointer',
                padding: '3px 7px',
                borderRadius: 5,
                lineHeight: 1,
                fontWeight: 700,
              }}
            >
              {isMinimized ? '＋' : '─'}
            </button>

            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              title="Cerrar tour"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: 17,
                cursor: 'pointer',
                padding: '2px 5px',
                borderRadius: 4,
                lineHeight: 1,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* MODO MINIMIZADO: barra compacta con controles de avance */}
        {isMinimized ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {step.icon} {step.title}
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {currentStepIndex > 0 && (
                <button
                  onClick={onPrev}
                  style={{
                    background: '#131e30',
                    border: '1px solid #1e3352',
                    borderRadius: 5,
                    color: '#e2e8f0',
                    padding: '4px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ←
                </button>
              )}
              <button
                onClick={onNext}
                style={{
                  background: 'linear-gradient(135deg, #00d4aa, #0284c7)',
                  border: 'none',
                  borderRadius: 5,
                  color: '#fff',
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {isLast ? '¡Fin!' : 'Sig →'}
              </button>
            </div>
          </div>
        ) : (
          /* MODO EXPANDIDO NORMAL */
          <>
            {/* Título e Icono */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8, marginTop: 4 }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{step.icon}</span>
              <div style={{ fontWeight: 800, fontSize: 15.5, color: '#f8fafc', letterSpacing: 0.2 }}>
                {step.title}
              </div>
            </div>

            {/* Descripción */}
            <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 12 }}>
              {step.description}
            </div>

            {/* Tip destacado */}
            {step.tip && (
              <div
                style={{
                  background: '#061322',
                  border: '1px solid #0f2744',
                  borderRadius: 8,
                  padding: '9px 12px',
                  fontSize: 12,
                  color: '#e2e8f0',
                  lineHeight: 1.5,
                  marginBottom: 12,
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ color: '#f59e0b', fontSize: 14, flexShrink: 0 }}>💡</span>
                <div>{step.tip}</div>
              </div>
            )}

            {/* Barra de progreso interactiva */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => onGoToStep(idx)}
                  style={{
                    height: 5,
                    flex: 1,
                    background: idx === currentStepIndex ? '#00d4aa' : idx < currentStepIndex ? '#14532d' : '#1e293b',
                    borderRadius: 3,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    padding: 0,
                  }}
                  title={`Ir al paso ${idx + 1}`}
                />
              ))}
            </div>

            {/* Botones de navegación */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: '4px 6px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                Saltar tour
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                {currentStepIndex > 0 && (
                  <button
                    onClick={onPrev}
                    style={{
                      background: '#131e30',
                      border: '1px solid #1e3352',
                      borderRadius: 7,
                      color: '#e2e8f0',
                      padding: '7px 13px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ← Anterior
                  </button>
                )}

                <button
                  onClick={onNext}
                  style={{
                    background: isLast
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #00d4aa, #0284c7)',
                    border: 'none',
                    borderRadius: 7,
                    color: '#fff',
                    padding: '7px 16px',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: isLast ? '0 0 14px rgba(16, 185, 129, 0.4)' : '0 0 14px rgba(0, 212, 170, 0.4)',
                  }}
                >
                  {isLast ? '¡Comenzar! 🚀' : 'Siguiente →'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
