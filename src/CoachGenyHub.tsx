import React, { useState, useMemo, useEffect } from 'react';
import { GLOSSARY_CONCEPTS, GlossaryConcept } from './glossaryData';
import { askDeepSeekCoach, MarketContext } from './deepseekService';

interface CoachGenyHubProps {
  sym: string;
  spot: number;
  SD: { name: string; col: string; desc: string };
  sigma: number;
  dte: number;
  sel: { strike: number; ot: 'call' | 'put' } | null;
  selInfo: { px: number; g: { d: number; g: number; t: number; v: number } } | null;
  equity: number;
  cash: number;
  totalPnL: number;
  positionsCount: number;
  lastAiTradeMsg: string;
  isAiLoading: boolean;
  onNavigateToAcademyTier?: (tierId: number) => void;
  onSelectAtmOption?: () => void;
  isOpenExternal?: boolean;
  onToggleOpen?: () => void;
}

export const CoachGenyHub: React.FC<CoachGenyHubProps> = ({
  sym,
  spot,
  SD,
  sigma,
  dte,
  sel,
  selInfo,
  equity,
  cash,
  totalPnL,
  positionsCount,
  lastAiTradeMsg,
  isAiLoading,
  onNavigateToAcademyTier,
  onSelectAtmOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tutor' | 'search' | 'chat'>('tutor');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConcept, setSelectedConcept] = useState<GlossaryConcept | null>(null);
  const [hasUnreadAdvice, setHasUnreadAdvice] = useState(false);

  // Chat libre
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([]);
  const [isAskingAi, setIsAskingAi] = useState(false);

  // Alerta cuando hay nuevo mensaje de análisis de operación
  useEffect(() => {
    if (lastAiTradeMsg && !isOpen) {
      setHasUnreadAdvice(true);
    }
  }, [lastAiTradeMsg]);

  // Contexto de mercado actual para DeepSeek
  const currentContext: MarketContext = useMemo(
    () => ({
      symbol: sym,
      assetName: SD.name,
      spot,
      iv: sigma,
      dte,
      portfolioEquity: equity,
      cash,
      positionsCount,
      activeContract: sel
        ? {
            strike: sel.strike,
            optionType: sel.ot,
            side: 'buy',
            price: selInfo?.px,
            delta: selInfo?.g.d,
            theta: selInfo?.g.t,
          }
        : null,
    }),
    [sym, SD.name, spot, sigma, dte, equity, cash, positionsCount, sel, selInfo]
  );

  // Filtrado de conceptos
  const filteredConcepts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return GLOSSARY_CONCEPTS.slice(0, 8);
    return GLOSSARY_CONCEPTS.filter(
      (c) =>
        c.term.toLowerCase().includes(q) ||
        c.shortDef.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Enviar pregunta a DeepSeek
  const handleAskDeepSeek = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || isAskingAi) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatHistory((prev) => [...prev, { role: 'user', text: q, time: timeStr }]);
    setChatInput('');
    setActiveTab('chat');
    setIsAskingAi(true);

    try {
      const response = await askDeepSeekCoach(q, currentContext);
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', text: response, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Hubo una dificultad técnica al contactar con el coach. Inténtalo de nuevo en unos segundos.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAskingAi(false);
    }
  };

  return (
    <>
      {/* 1. VENTANA FLOTANTE MODAL DEL CHAT / COPILOT */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 78,
            right: 22,
            width: 410,
            maxWidth: 'calc(100vw - 40px)',
            height: 560,
            maxHeight: 'calc(100vh - 100px)',
            zIndex: 9990,
            background: 'linear-gradient(155deg, #0d1829 0%, #08101d 100%)',
            border: '1.5px solid #1f3a5f',
            borderRadius: 16,
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 212, 170, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "'Inter', system-ui, sans-serif",
            animation: 'fadeInUp 0.2s ease-out',
          }}
        >
          {/* Cabecera del Widget */}
          <div
            style={{
              padding: '12px 16px',
              background: '#07101e',
              borderBottom: '1px solid #1a2a44',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: 'linear-gradient(135deg, rgba(0,212,170,0.2), rgba(14,165,233,0.3))',
                  border: '1px solid #00d4aa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 17,
                }}
              >
                🤖
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#f8fafc', letterSpacing: 0.5 }}>
                  COACH GENY IA
                </div>
                <div style={{ fontSize: 10, color: '#00d4aa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4aa' }} />
                  Asistente en vivo · {sym} (${spot.toFixed(2)})
                </div>
              </div>
            </div>

            {/* Controles cerrar / minimizar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimizar Coach"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: 16,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Selector de Pestañas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, padding: '9px 12px', background: '#050a14', borderBottom: '1px solid #142033', flexShrink: 0 }}>
            <button
              onClick={() => setActiveTab('tutor')}
              style={{
                background: activeTab === 'tutor' ? '#142238' : 'transparent',
                border: `1px solid ${activeTab === 'tutor' ? '#00d4aa' : 'transparent'}`,
                borderRadius: 7,
                color: activeTab === 'tutor' ? '#00f5c4' : '#94a3b8',
                fontSize: 11.5,
                fontWeight: activeTab === 'tutor' ? 800 : 600,
                padding: '6px 4px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              ⚡ Tutoría
            </button>
            <button
              onClick={() => setActiveTab('search')}
              style={{
                background: activeTab === 'search' ? '#142238' : 'transparent',
                border: `1px solid ${activeTab === 'search' ? '#00d4aa' : 'transparent'}`,
                borderRadius: 7,
                color: activeTab === 'search' ? '#00f5c4' : '#94a3b8',
                fontSize: 11.5,
                fontWeight: activeTab === 'search' ? 800 : 600,
                padding: '6px 4px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              🔍 Conceptos
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                background: activeTab === 'chat' ? '#142238' : 'transparent',
                border: `1px solid ${activeTab === 'chat' ? '#00d4aa' : 'transparent'}`,
                borderRadius: 7,
                color: activeTab === 'chat' ? '#00f5c4' : '#94a3b8',
                fontSize: 11.5,
                fontWeight: activeTab === 'chat' ? 800 : 600,
                padding: '6px 4px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              💬 Consultar
            </button>
          </div>

          {/* CUERPO PRINCIPAL DEL WIDGET */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* PESTAÑA 1: TUTORÍA EN VIVO */}
            {activeTab === 'tutor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{
                    background: '#07101e',
                    border: '1px solid #1a2a44',
                    borderRadius: 10,
                    padding: '12px 14px',
                    minHeight: 100,
                    fontSize: 13,
                    lineHeight: 1.7,
                    color: '#e2e8f0',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
                  }}
                >
                  {isAiLoading ? (
                    <div style={{ color: '#00d4aa', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <span>⚡</span> Analizando operación con Geny IA...
                    </div>
                  ) : (
                    lastAiTradeMsg ||
                    '¡Hola trader! Soy Geny, tu coach de opciones. Haz una operación en el simulador para que evalúe tus griegas y riesgo, o pregúntame cualquier concepto del mercado.'
                  )}
                </div>

                {/* Preguntas sugeridas contextuales */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 700, letterSpacing: 0.8 }}>
                    CONSULTAS RÁPIDAS PARA {sym}:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      `¿Qué significa el Delta de mi posición en ${sym}?`,
                      `¿Cómo afecta Theta a mis contratos con ${dte} días al vencimiento?`,
                      `¿Cuál es el riesgo de operar con IV de ${(sigma * 100).toFixed(0)}%?`,
                      '¿Cuándo me conviene tomar ganancias o cortar pérdidas?',
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => handleAskDeepSeek(q)}
                        style={{
                          background: '#0a1424',
                          border: '1px solid #1c3252',
                          borderRadius: 8,
                          color: '#93c5fd',
                          padding: '7px 11px',
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#38bdf8')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1c3252')}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: BUSCADOR DE CONCEPTOS */}
            {activeTab === 'search' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Input de Búsqueda */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (selectedConcept) setSelectedConcept(null);
                    }}
                    placeholder="Buscar: Delta, Theta, Spreads, ITM, Break-even..."
                    style={{
                      width: '100%',
                      background: '#050c18',
                      border: '1px solid #203657',
                      borderRadius: 8,
                      padding: '8px 30px 8px 12px',
                      color: '#f8fafc',
                      fontSize: 12.5,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedConcept(null);
                      }}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Detalle del Concepto Seleccionado */}
                {selectedConcept ? (
                  <div
                    style={{
                      background: '#081426',
                      border: '1px solid #00d4aa66',
                      borderRadius: 10,
                      padding: 13,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 9,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 18 }}>{selectedConcept.icon}</span>
                        <span style={{ fontWeight: 800, fontSize: 14, color: '#f8fafc' }}>{selectedConcept.term}</span>
                      </div>
                      <button
                        onClick={() => setSelectedConcept(null)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#00d4aa',
                          cursor: 'pointer',
                          fontSize: 11.5,
                          fontWeight: 700,
                        }}
                      >
                        ← Volver a lista
                      </button>
                    </div>

                    <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>
                      {selectedConcept.explanation}
                    </div>

                    {selectedConcept.formula && (
                      <div
                        style={{
                          background: '#040b15',
                          border: '1px dashed #1e3a5f',
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontFamily: 'monospace',
                          fontSize: 11,
                          color: '#38bdf8',
                        }}
                      >
                        📐 {selectedConcept.formula}
                      </div>
                    )}

                    <div style={{ background: '#05101f', borderRadius: 7, padding: '8px 10px', fontSize: 11.5, color: '#cbd5e1', lineHeight: 1.5 }}>
                      <strong style={{ color: '#f59e0b' }}>Ejemplo Práctico: </strong>
                      {selectedConcept.example}
                    </div>

                    {/* Botón para profundizar con Geny IA */}
                    <button
                      onClick={() =>
                        handleAskDeepSeek(
                          `Explícame ${selectedConcept.term} enfocado en mi operación de ${sym} a $${spot.toFixed(2)} con IV ${(sigma * 100).toFixed(0)}%.`
                        )
                      }
                      style={{
                        marginTop: 4,
                        background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.2), rgba(14, 165, 233, 0.25))',
                        border: '1px solid #00d4aa',
                        borderRadius: 7,
                        color: '#00f5c4',
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '7px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 7,
                      }}
                    >
                      <span>🤖</span> Consultar a Geny IA sobre {selectedConcept.term} en {sym}
                    </button>
                  </div>
                ) : (
                  /* Lista de Conceptos */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 330, overflowY: 'auto' }}>
                    {filteredConcepts.map((concept) => (
                      <div
                        key={concept.id}
                        onClick={() => setSelectedConcept(concept)}
                        style={{
                          background: '#07101e',
                          border: '1px solid #16243b',
                          borderRadius: 8,
                          padding: '8px 11px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#00d4aa66';
                          e.currentTarget.style.background = '#0c1a2e';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#16243b';
                          e.currentTarget.style.background = '#07101e';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, overflow: 'hidden' }}>
                          <span style={{ fontSize: 15 }}>{concept.icon}</span>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: '#f1f5f9', whiteSpace: 'nowrap' }}>
                              {concept.term}
                            </div>
                            <div style={{ fontSize: 10.5, color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {concept.shortDef}
                            </div>
                          </div>
                        </div>
                        <span style={{ color: '#00d4aa', fontSize: 13, fontWeight: 800 }}>→</span>
                      </div>
                    ))}

                    {searchQuery && (
                      <button
                        onClick={() => handleAskDeepSeek(searchQuery)}
                        style={{
                          marginTop: 6,
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px dashed #38bdf8',
                          borderRadius: 8,
                          padding: '9px',
                          color: '#38bdf8',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        ⚡ Preguntar a Geny IA: "{searchQuery}"
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 3: CHAT LIBRE CON DEEPSEEK */}
            {activeTab === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
                <div
                  style={{
                    background: '#050c18',
                    border: '1px solid #16253c',
                    borderRadius: 9,
                    padding: 10,
                    flex: 1,
                    minHeight: 280,
                    maxHeight: 330,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 9,
                  }}
                >
                  {chatHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: '30px 14px', lineHeight: 1.7 }}>
                      Hazle cualquier pregunta a <strong style={{ color: '#f59e0b' }}>Coach Geny</strong> sobre opciones financieras, contratos de {sym} o cómo usar el simulador.
                    </div>
                  ) : (
                    chatHistory.map((msg, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          maxWidth: '90%',
                        }}
                      >
                        <div
                          style={{
                            background: msg.role === 'user' ? '#143152' : '#0c1b30',
                            border: `1px solid ${msg.role === 'user' ? '#1e497a' : '#1e385e'}`,
                            borderRadius: 9,
                            padding: '8px 12px',
                            color: msg.role === 'user' ? '#f1f5f9' : '#e2e8f0',
                            fontSize: 12,
                            lineHeight: 1.6,
                          }}
                        >
                          {msg.text}
                        </div>
                        <span style={{ fontSize: 9.5, color: '#64748b', marginTop: 2, alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                          {msg.time}
                        </span>
                      </div>
                    ))
                  )}

                  {isAskingAi && (
                    <div style={{ color: '#00d4aa', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
                      <span>⚡</span> Geny IA respondiendo con datos de {sym}...
                    </div>
                  )}
                </div>

                {/* Formulario de Pregunta */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskDeepSeek(chatInput);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                >
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Pregunta sobre opciones o el simulador (máx 500 caracteres)..."
                      maxLength={500}
                      disabled={isAskingAi}
                      style={{
                        flex: 1,
                        background: '#07101e',
                        border: '1px solid #1f375a',
                        borderRadius: 8,
                        padding: '8px 11px',
                        color: '#f8fafc',
                        fontSize: 12,
                        outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isAskingAi}
                      style={{
                        background: !chatInput.trim() || isAskingAi ? '#1e293b' : 'linear-gradient(135deg, #00d4aa, #0284c7)',
                        border: 'none',
                        borderRadius: 8,
                        color: '#fff',
                        padding: '8px 14px',
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: !chatInput.trim() || isAskingAi ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Enviar
                    </button>
                  </div>
                  {chatInput.length > 350 && (
                    <div style={{ fontSize: 9.5, color: chatInput.length > 450 ? '#f59e0b' : '#64748b', textAlign: 'right', paddingRight: 4 }}>
                      {chatInput.length}/500 caracteres
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. BOTÓN FLOTANTE BURBUJA EN LA ESQUINA INFERIOR DERECHA */}
      <button
        onClick={() => {
          setIsOpen((prev) => !prev);
          setHasUnreadAdvice(false);
        }}
        title="Abrir Coach Geny IA"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 22,
          zIndex: 9980,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          background: 'linear-gradient(135deg, #0d1a2d 0%, #08111e 100%)',
          border: `1.5px solid ${isOpen ? '#00f5c4' : hasUnreadAdvice ? '#f59e0b' : '#00d4aa'}`,
          borderRadius: 30,
          padding: '10px 17px',
          color: '#f8fafc',
          boxShadow: hasUnreadAdvice
            ? '0 8px 30px rgba(245, 158, 11, 0.45), 0 4px 16px rgba(0,0,0,0.9)'
            : '0 8px 30px rgba(0, 212, 170, 0.35), 0 4px 16px rgba(0,0,0,0.85)',
          cursor: 'pointer',
          fontWeight: 800,
          fontSize: 13,
          backdropFilter: 'blur(12px)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
          e.currentTarget.style.boxShadow = '0 12px 36px rgba(0, 212, 170, 0.5), 0 6px 20px rgba(0,0,0,0.95)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = hasUnreadAdvice
            ? '0 8px 30px rgba(245, 158, 11, 0.45), 0 4px 16px rgba(0,0,0,0.9)'
            : '0 8px 30px rgba(0, 212, 170, 0.35), 0 4px 16px rgba(0,0,0,0.85)';
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          {hasUnreadAdvice && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#f59e0b',
                boxShadow: '0 0 8px #f59e0b',
              }}
            />
          )}
        </div>
        <span>{isOpen ? 'Ocultar Coach' : 'Coach Geny IA'}</span>
        {hasUnreadAdvice && !isOpen && (
          <span
            style={{
              background: '#f59e0b25',
              border: '1px solid #f59e0b60',
              color: '#f59e0b',
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              fontWeight: 800,
            }}
          >
            Nuevo consejo
          </span>
        )}
      </button>
    </>
  );
};
