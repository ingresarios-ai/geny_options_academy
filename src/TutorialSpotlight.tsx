import React, { useEffect, useState, useLayoutEffect } from 'react';

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

  useLayoutEffect(() => {
    if (!isOpen) return;

    // Pequeño retardo para asegurar que los renders y transiciones de tabs ocurrieron
    const timer = setTimeout(updateTargetRect, 80);
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

  // Cálculo de posición de la tarjeta del tutorial
  const cardWidth = 360;
  const padding = 12;

  let cardStyle: React.CSSProperties = {
    position: 'fixed',
    width: cardWidth,
    zIndex: 10001,
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  if (targetRect) {
    const spaceBelow = windowDimensions.height - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const spaceRight = windowDimensions.width - targetRect.right;
    const spaceLeft = targetRect.left;

    let placement = step.preferredPlacement || 'bottom';

    // Ajuste inteligente de placement si no cabe
    if (placement === 'bottom' && spaceBelow < 240 && spaceAbove > spaceBelow) {
      placement = 'top';
    } else if (placement === 'top' && spaceAbove < 240 && spaceBelow > spaceAbove) {
      placement = 'bottom';
    } else if (placement === 'right' && spaceRight < cardWidth + 20 && spaceLeft > spaceRight) {
      placement = 'left';
    } else if (placement === 'left' && spaceLeft < cardWidth + 20 && spaceRight > spaceLeft) {
      placement = 'right';
    }

    if (placement === 'bottom') {
      const top = Math.min(windowDimensions.height - 290, targetRect.bottom + padding);
      const left = Math.max(16, Math.min(windowDimensions.width - cardWidth - 16, targetRect.left + (targetRect.width / 2) - (cardWidth / 2)));
      cardStyle.top = `${top}px`;
      cardStyle.left = `${left}px`;
    } else if (placement === 'top') {
      const bottom = windowDimensions.height - targetRect.top + padding;
      const left = Math.max(16, Math.min(windowDimensions.width - cardWidth - 16, targetRect.left + (targetRect.width / 2) - (cardWidth / 2)));
      cardStyle.bottom = `${bottom}px`;
      cardStyle.left = `${left}px`;
    } else if (placement === 'right') {
      const top = Math.max(16, Math.min(windowDimensions.height - 300, targetRect.top + (targetRect.height / 2) - 120));
      const left = Math.min(windowDimensions.width - cardWidth - 16, targetRect.right + padding);
      cardStyle.top = `${top}px`;
      cardStyle.left = `${left}px`;
    } else if (placement === 'left') {
      const top = Math.max(16, Math.min(windowDimensions.height - 300, targetRect.top + (targetRect.height / 2) - 120));
      const right = windowDimensions.width - targetRect.left + padding;
      cardStyle.top = `${top}px`;
      cardStyle.right = `${right}px`;
    }
  } else {
    // Si no se encuentra el target, centrar la tarjeta en la pantalla
    cardStyle.top = '50%';
    cardStyle.left = '50%';
    cardStyle.transform = 'translate(-50%, -50%)';
  }

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

      {/* Fallback overlay si el elemento no se encuentra de inmediato */}
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

      {/* Tarjeta explicativa */}
      <div
        style={{
          ...cardStyle,
          background: 'linear-gradient(145deg, #0e1726, #09101d)',
          border: '1px solid #1f3352',
          borderRadius: 14,
          padding: '16px 18px',
          color: '#e2e8f0',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 212, 170, 0.25)',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Barra superior con progreso y cerrar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
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

        {/* Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{step.icon}</span>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#f8fafc', letterSpacing: 0.2 }}>
            {step.title}
          </div>
        </div>

        {/* Descripción */}
        <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 12 }}>
          {step.description}
        </div>

        {/* Tip destacado opcional */}
        {step.tip && (
          <div
            style={{
              background: '#061322',
              border: '1px solid #0f2744',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 11,
              color: '#cbd5e1',
              lineHeight: 1.5,
              marginBottom: 12,
              display: 'flex',
              gap: 7,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ color: '#f59e0b', fontSize: 12, flexShrink: 0 }}>💡</span>
            <div>{step.tip}</div>
          </div>
        )}

        {/* Barra de progreso con puntos interactivos */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
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
                  padding: '6px 12px',
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
              {isLast ? '¡Comenzar a Operar! 🚀' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
