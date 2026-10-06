import React from 'react';

interface WelcomeModalProps {
  isOpen: boolean;
  onStartTour: () => void;
  onDismiss: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onStartTour,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(5px)',
        zIndex: 10002,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #0e1726, #070c14)',
          border: '1px solid #1f3352',
          borderRadius: 16,
          padding: '24px 28px',
          maxWidth: 460,
          width: '100%',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 212, 170, 0.25)',
          color: '#e2e8f0',
          textAlign: 'center',
        }}
      >
        {/* Badge superior */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#d4a01718', border: '1px solid #d4a01740', padding: '4px 12px', borderRadius: 20, marginBottom: 14 }}>
          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 800, letterSpacing: 1.2 }}>INGRESARIOS PRESENTA</span>
        </div>

        {/* Icono central con efecto glow */}
        <div
          style={{
            width: 62,
            height: 62,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #00d4aa, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 30,
            boxShadow: '0 0 25px rgba(0, 212, 170, 0.5)',
          }}
        >
          🎓
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', marginBottom: 10, letterSpacing: -0.5 }}>
          ¡Bienvenido a Geny Options Academy!
        </h2>

        <p style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.65, marginBottom: 20 }}>
          Aprende y domina el trading de opciones financieras en un simulador gamificado en tiempo real con datos de mercado, cálculo de griegas y retroalimentación inteligente de nuestro <strong style={{ color: '#00d4aa' }}>Coach Geny IA</strong>.
        </p>

        {/* Mini lista de lo que verá */}
        <div
          style={{
            background: '#07101c',
            border: '1px solid #132238',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 22,
            textAlign: 'left',
            fontSize: 12.5,
            color: '#e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>📊</span>
            <span><strong>Option Chain interactivo:</strong> opera Calls y Puts en vivo.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>📈</span>
            <span><strong>Gráficos de Payoff:</strong> visualiza tu riesgo/recompensa exacto.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>⏩</span>
            <span><strong>Máquina del tiempo:</strong> avanza días para ver el impacto de Theta.</span>
          </div>
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onStartTour}
            style={{
              background: 'linear-gradient(135deg, #00d4aa, #0284c7)',
              border: 'none',
              borderRadius: 9,
              color: '#030712',
              fontWeight: 800,
              fontSize: 14,
              padding: '12px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0, 212, 170, 0.4)',
              letterSpacing: 0.3,
            }}
          >
            🚀 Iniciar Tour Guiado (1 min)
          </button>

          <button
            onClick={onDismiss}
            style={{
              background: 'transparent',
              border: '1px solid #1e3352',
              borderRadius: 9,
              color: '#94a3b8',
              fontSize: 12,
              fontWeight: 600,
              padding: '9px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            Ya conozco la plataforma · Ir directo al simulador
          </button>
        </div>
      </div>
    </div>
  );
};
