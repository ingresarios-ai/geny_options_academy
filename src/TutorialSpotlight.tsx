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
  const [cardHeight, setCardHeight] = useState<number>(270);
  const cardRef = useRef<HTMLDivElement>(null);

  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const step = steps[currentStepIndex];

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
    if (cardRef.current) {
      const h = cardRef.current.offsetHeight;
      if (h > 0 && Math.abs(h - cardHeight) > 4) {
        setCardHeight(h);
      }
    }
  });

  useLayoutEffect(() => {
    if (!isOpen) return;

    // Pequeño retardo para asegurar que los renders y transiciones de tabs ocurrieron
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
  const cardWidth = Math.min(360, windowDimensions.width - 32);
  const padding = 12;

  let desiredTop = 0;
  let desiredLeft = 0;

  if (targetRect) {
    const spaceBelow = windowDimensions.height - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const isLargeTarget = targetRect.height > windowDimensions.height * 0.45;

    let placement = step.preferredPlacement || 'bottom';

    if (isLargeTarget) {
      // Para áreas grandes (ej. Option Chain o Academia), posicionar en la parte visible superior o centrada
      desiredTop = Math.max(90, targetRect.top + 30);
      desiredLeft = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);
    } else {
      // Ajuste inteligente según espacio disponible
      if (placement === 'bottom') {
        if (spaceBelow < cardHeight + padding + 16 && spaceAbove > spaceBelow) {
          placement = 'top';
        }
      } else if (placement === 'top') {
        if (spaceAbove < cardHeight + padding + 16 && spaceBelow > spaceAbove) {
          placement = 'bottom';
        }
      }

      if (placement === 'bottom') {
        desiredTop = targetRect.bottom + padding;
        desiredLeft = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);
      } else if (placement === 'top') {
        desiredTop = targetRect.top - cardHeight - padding;
        desiredLeft = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);
      } else if (placement === 'right') {
        desiredTop = targetRect.top + (targetRect.height / 2) - (cardHeight / 2);
        desiredLeft = targetRect.right + padding;
      } else if (placement === 'left') {
        desiredTop = targetRect.top + (targetRect.height / 2) - (cardHeight / 2);
        desiredLeft = targetRect.left - cardWidth - padding;
      }
    }
  } else {
    // Si no se encuentra el target, centrar en pantalla
    desiredTop = (windowDimensions.height - cardHeight) / 2;
    desiredLeft = (windowDimensions.width - cardWidth) / 2;
  }

  // REGLA DE ORO INFALIBLE: Clamping absoluto dentro del viewport (mínimo 16px de margen en todos los bordes)
  const safeTop = Math.max(16, Math.min(windowDimensions.height - cardHeight - 16, desiredTop));
  const safeLeft = Math.max(16, Math.min(windowDimensions.width - cardWidth - 16, desiredLeft));

  const isLast = currentStepIndex === steps.length - 1;

  return (
    <>
      {/* Spotlight cutout & backdrop */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top - 5,
            left: targetRect.left - 5,
            width: targetRect.width + 10,
            height: targetRect.height + 10,
            borderRadius: 12,
            boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.82), 0 0 30px rgba(0, 212, 170, 0.5), inset 0 0 15px rgba(0, 212, 170, 0.15)',
            border: '2px solid #00d4aa',
            pointerEvents: 'none',
            zIndex: 10000,
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}

      {/* Fallback overlay si el elemento no se encuentra */}
      {!targetRect && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 7, 18, 0.82)',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tarjeta explicativa flotante con clamping seguro */}
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
          transition: 'top 0.25s ease-out, left 0.25s ease-out',
          background: 'linear-gradient(145deg, #0e1726, #09101d)',
          border: '1px solid #1f3352',
          borderRadius: 14,
          padding: '14px 16px',
          color: '#e2e8f0',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 212, 170, 0.25)',
          fontFamily: "'Inter', system-ui, sans-serif",
          boxSizing: 'border-box',
        }}
      >
        {/* Barra superior con badge de paso y botón cerrar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: 1.2,
                color: step.badgeCol || '#00d4aa',
                background: `${step.badgeCol || '#00d4aa'}18`,
                border: `1px solid ${step.badgeCol || '#00d4aa'}40`,
                padding: '2px 7px',
                borderRadius: 4,
                textTransform: 'uppercase',
              }}
            >
              {step.badge}
            </span>
            <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
              Paso {currentStepIndex + 1} de {steps.length}
            </span>
          </div>

          <button
            onClick={onClose}
            title="Cerrar tour"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: 16,
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: 4,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            ✕
          </button>
        </div>

        {/* Título e Icono */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{step.icon}</span>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#f8fafc', letterSpacing: 0.2 }}>
            {step.title}
          </div>
        </div>

        {/* Descripción */}
        <div style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.55, marginBottom: 10 }}>
          {step.description}
        </div>

        {/* Tip destacado */}
        {step.tip && (
          <div
            style={{
              background: '#061322',
              border: '1px solid #0f2744',
              borderRadius: 8,
              padding: '7px 9px',
              fontSize: 10.5,
              color: '#cbd5e1',
              lineHeight: 1.45,
              marginBottom: 10,
              display: 'flex',
              gap: 6,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ color: '#f59e0b', fontSize: 12, flexShrink: 0 }}>💡</span>
            <div>{step.tip}</div>
          </div>
        )}

        {/* Barra de progreso con puntos */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => onGoToStep(idx)}
              style={{
                height: 4,
                flex: 1,
                background: idx === currentStepIndex ? '#00d4aa' : idx < currentStepIndex ? '#14532d' : '#1e293b',
                borderRadius: 2,
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
              color: '#64748b',
              fontSize: 11,
              cursor: 'pointer',
              padding: '4px 6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            Saltar tour
          </button>

          <div style={{ display: 'flex', gap: 6 }}>
            {currentStepIndex > 0 && (
              <button
                onClick={onPrev}
                style={{
                  background: '#131e30',
                  border: '1px solid #1e3352',
                  borderRadius: 7,
                  color: '#cbd5e1',
                  padding: '5px 11px',
                  fontSize: 11,
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
                padding: '6px 14px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: isLast ? '0 0 12px rgba(16, 185, 129, 0.4)' : '0 0 12px rgba(0, 212, 170, 0.4)',
              }}
            >
              {isLast ? '¡Comenzar! 🚀' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
