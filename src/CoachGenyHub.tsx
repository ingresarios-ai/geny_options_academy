import React, { useState, useMemo } from 'react';
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
  const [activeTab, setActiveTab] = useState<'tutor' | 'search' | 'chat'>('tutor');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConcept, setSelectedConcept] = useState<GlossaryConcept | null>(null);

  // Chat libre
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([]);
  const [isAskingAi, setIsAskingAi] = useState(false);

  // Preparar contexto del mercado actual para DeepSeek
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

  // Filtrado de conceptos en tiempo real
  const filteredConcepts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return GLOSSARY_CONCEPTS.slice(0, 6); // Mostrar 6 sugerencias principales
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
          text: 'Hubo una dificultad técnica al contactar con DeepSeek. Inténtalo de nuevo en unos segundos.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAskingAi(false);
    }
  };

  return (
    <div
      style={{
        background: '#09101d',
        border: '1px solid #1a2942',
        borderRadius: 12,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      {/* Cabecera del Coach */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #16243b', paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 16 }}>🤖</span>
          <span style={{ fontWeight: 800, fontSize: 11.5, color: '#f59e0b', letterSpacing: 1 }}>
            COACH GENY IA · INGRESARIOS
          </span>
        </div>
      </div>

      {/* Tabs superiores */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, background: '#050a14', padding: 3, borderRadius: 8 }}>
        <button
          onClick={() => setActiveTab('tutor')}
          style={{
            background: activeTab === 'tutor' ? '#142238' : 'transparent',
            border: 'none',
            borderRadius: 6,
            color: activeTab === 'tutor' ? '#00d4aa' : '#94a3b8',
            fontSize: 11,
            fontWeight: activeTab === 'tutor' ? 800 : 600,
            padding: '5px 4px',
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
            border: 'none',
            borderRadius: 6,
            color: activeTab === 'search' ? '#00d4aa' : '#94a3b8',
            fontSize: 11,
            fontWeight: activeTab === 'search' ? 800 : 600,
            padding: '5px 4px',
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
            border: 'none',
            borderRadius: 6,
            color: activeTab === 'chat' ? '#00d4aa' : '#94a3b8',
            fontSize: 11,
            fontWeight: activeTab === 'chat' ? 800 : 600,
            padding: '5px 4px',
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          💬 Consultar
        </button>
      </div>

      {/* VISTA 1: TUTORÍA EN VIVO (Feedback de operaciones) */}
      {activeTab === 'tutor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              background: '#07101e',
              border: '1px solid #1a2a44',
              borderRadius: 8,
              padding: '10px 12px',
              minHeight: 85,
              fontSize: 12.5,
              lineHeight: 1.6,
              color: '#e2e8f0',
              whiteSpace: 'pre-wrap',
            }}
          >
            {isAiLoading ? (
              <div style={{ color: '#00d4aa', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span>⚡</span> Analizando operación con Geny IA...
              </div>
            ) : (
              lastAiTradeMsg ||
              '¡Bienvenido a Geny Options Academy! Selecciona un contrato de la tabla o busca un concepto para analizar su mecánica y riesgo.'
            )}
          </div>

          {/* Chips de preguntas rápidas sugeridas según el contexto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: 0.8 }}>PREGUNTAS SUGERIDAS:</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {[
                `¿Qué Delta tiene mi ${sym}?`,
                '¿Por qué decae la prima por Theta?',
                '¿Cómo calcular mi Break-even?',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleAskDeepSeek(q)}
                  style={{
                    background: '#0d1829',
                    border: '1px solid #1d3354',
                    borderRadius: 6,
                    color: '#93c5fd',
                    padding: '4px 8px',
                    fontSize: 10.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#38bdf8')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1d3354')}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: BUSCADOR DE CONCEPTOS (Glosario Instantáneo Local) */}
      {activeTab === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Input de Búsqueda */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedConcept) setSelectedConcept(null);
              }}
              placeholder="Escribe: Delta, Theta, Spreads, ITM..."
              style={{
                width: '100%',
                background: '#050c18',
                border: '1px solid #203657',
                borderRadius: 8,
                padding: '7px 28px 7px 10px',
                color: '#f8fafc',
                fontSize: 12,
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

          {/* Tarjeta de Detalle del Concepto Seleccionado */}
          {selectedConcept ? (
            <div
              style={{
                background: '#081426',
                border: '1px solid #00d4aa55',
                borderRadius: 9,
                padding: 11,
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{selectedConcept.icon}</span>
                  <span style={{ fontWeight: 800, fontSize: 13, color: '#f8fafc' }}>{selectedConcept.term}</span>
                </div>
                <button
                  onClick={() => setSelectedConcept(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  Volver a lista ↩
                </button>
              </div>

              <div style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.5 }}>
                {selectedConcept.explanation}
              </div>

              {selectedConcept.formula && (
                <div
                  style={{
                    background: '#040b15',
                    border: '1px dashed #1e3a5f',
                    borderRadius: 6,
                    padding: '5px 8px',
                    fontFamily: 'monospace',
                    fontSize: 10.5,
                    color: '#38bdf8',
                  }}
                >
                  📐 {selectedConcept.formula}
                </div>
              )}

              <div style={{ background: '#05101f', borderRadius: 6, padding: '6px 8px', fontSize: 11, color: '#cbd5e1' }}>
                <strong style={{ color: '#f59e0b' }}>Ejemplo: </strong>
                {selectedConcept.example}
              </div>

              {/* Botón para profundizar con DeepSeek */}
              <button
                onClick={() =>
                  handleAskDeepSeek(
                    `Explícame ${selectedConcept.term} enfocado en mi operación de ${sym} a $${spot.toFixed(2)}.`
                  )
                }
                style={{
                  marginTop: 3,
                  background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.2), rgba(14, 165, 233, 0.25))',
                  border: '1px solid #00d4aa',
                  borderRadius: 6,
                  color: '#00f5c4',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span>🤖</span> Profundizar con Geny IA en {sym}
              </button>
            </div>
          ) : (
            /* Lista de Conceptos Filtrados */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 180, overflowY: 'auto' }}>
              {filteredConcepts.map((concept) => (
                <div
                  key={concept.id}
                  onClick={() => setSelectedConcept(concept)}
                  style={{
                    background: '#07101e',
                    border: '1px solid #16243b',
                    borderRadius: 7,
                    padding: '7px 9px',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <span style={{ fontSize: 13 }}>{concept.icon}</span>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: 11.5, color: '#f1f5f9', whiteSpace: 'nowrap' }}>
                        {concept.term}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {concept.shortDef}
                      </div>
                    </div>
                  </div>
                  <span style={{ color: '#00d4aa', fontSize: 12, fontWeight: 700 }}>→</span>
                </div>
              ))}

              {/* Botón si no hay resultado exacto para preguntar directamente a DeepSeek */}
              {searchQuery && (
                <button
                  onClick={() => handleAskDeepSeek(searchQuery)}
                  style={{
                    marginTop: 4,
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px dashed #38bdf8',
                    borderRadius: 7,
                    padding: '8px',
                    color: '#38bdf8',
                    fontSize: 11,
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

      {/* VISTA 3: CHAT / CONSULTAS LIBRES CON DEEPSEEK */}
      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Historial de conversación */}
          <div
            style={{
              background: '#050c18',
              border: '1px solid #16253c',
              borderRadius: 8,
              padding: 9,
              maxHeight: 180,
              minHeight: 110,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {chatHistory.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11.5, padding: '16px 8px', lineHeight: 1.6 }}>
                Hazle cualquier pregunta a <strong style={{ color: '#f59e0b' }}>Geny IA</strong> sobre contratos, griegas, spreads o tu posición actual.
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '92%',
                  }}
                >
                  <div
                    style={{
                      background: msg.role === 'user' ? '#143152' : '#0c1b30',
                      border: `1px solid ${msg.role === 'user' ? '#1e497a' : '#1e385e'}`,
                      borderRadius: 8,
                      padding: '7px 10px',
                      color: msg.role === 'user' ? '#f1f5f9' : '#e2e8f0',
                      fontSize: 11.5,
                      lineHeight: 1.55,
                    }}
                  >
                    {msg.text}
                  </div>
                  <span style={{ fontSize: 9, color: '#64748b', marginTop: 2, alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {msg.time}
                  </span>
                </div>
              ))
            )}

            {isAskingAi && (
              <div style={{ color: '#00d4aa', fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
                <span>⚡</span> Geny IA respondiendo con datos de {sym}...
              </div>
            )}
          </div>

          {/* Formulario de envío */}
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
                  borderRadius: 7,
                  padding: '6px 10px',
                  color: '#f8fafc',
                  fontSize: 11.5,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isAskingAi}
                style={{
                  background: !chatInput.trim() || isAskingAi ? '#1e293b' : 'linear-gradient(135deg, #00d4aa, #0284c7)',
                  border: 'none',
                  borderRadius: 7,
                  color: '#fff',
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 700,
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
  );
};
