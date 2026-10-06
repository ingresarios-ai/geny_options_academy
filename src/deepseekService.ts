export interface MarketContext {
  symbol: string;
  assetName: string;
  spot: number;
  iv: number;
  dte: number;
  portfolioEquity?: number;
  cash?: number;
  activeContract?: {
    strike: number;
    optionType: 'call' | 'put';
    side: 'buy' | 'sell';
    price?: number;
    delta?: number;
    theta?: number;
  } | null;
  positionsCount?: number;
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export async function askDeepSeekCoach(
  userQuery: string,
  context: MarketContext,
  customApiKey?: string
): Promise<string> {
  const apiKey =
    customApiKey ||
    (import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined);

  if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
    return '⚠️ No se encontró la clave de API de DeepSeek. Configura VITE_DEEPSEEK_API_KEY en tu archivo .env o en Vercel.';
  }

  const systemPrompt = `Eres Geny, coach pedagógico de opciones financieras de la prestigiosa academia INGRESARIOS.
Tu misión es educar a estudiantes de trading de forma clara, práctica, profesional y motivadora, SIEMPRE EN ESPAÑOL.

REGLAS DE RESPUESTA:
1. Máximo 3 a 4 oraciones concisas y directas al grano.
2. Si la pregunta involucra números, usa ejemplos concretos basados en el mercado actual del usuario:
   - Activo actual: ${context.symbol} (${context.assetName}) cotizando en $${context.spot.toFixed(2)}.
   - Volatilidad Implícita (IV): ${(context.iv * 100).toFixed(1)}%.
   - Días al vencimiento (DTE): ${context.dte} días.
   ${context.activeContract ? `- Contrato seleccionado: ${context.activeContract.optionType.toUpperCase()} strike $${context.activeContract.strike} (Delta: ${context.activeContract.delta ?? 'N/A'}, Theta: ${context.activeContract.theta ?? 'N/A'}).` : ''}
   ${context.positionsCount !== undefined ? `- Posiciones abiertas: ${context.positionsCount}.` : ''}
3. Da siempre un próximo paso táctico o sugerencia de gestión de riesgo (Stop Loss, pérdida máxima, punto de equilibrio).
4. No uses lenguaje robótico ni saludos largos; responde directamente con autoridad pedagógica.`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.6,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API Error:', response.status, errText);
      return `❌ Error al conectar con DeepSeek (${response.status}). Por favor verifica tu cuota o clave.`;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    return content || '¡Sólido concepto! Recuerda siempre definir tu riesgo antes de entrar al mercado.';
  } catch (err: any) {
    console.error('DeepSeek fetch error:', err);
    return '⚠️ No pudimos conectar con el servidor de DeepSeek. Revisa tu conexión a internet o intenta nuevamente.';
  }
}

export async function analyzeTradeWithDeepSeek(
  trade: {
    symbol: string;
    strike: number;
    ot: 'call' | 'put';
    side: 'buy' | 'sell';
    qty: number;
    price: number;
    cost: number;
    pnl: number | null;
    pnlPct: number | null;
    isClose: boolean;
    delta: number;
  },
  context: MarketContext,
  customApiKey?: string
): Promise<string> {
  const query = trade.isClose
    ? `He CERRADO mi posición en ${trade.symbol}: ${trade.side === 'sell' ? 'VENDÍ' : 'COMPRÉ'} para cerrar ${trade.qty} contrato(s) Strike $${trade.strike} ${trade.ot.toUpperCase()} con un P&L de $${trade.pnl?.toFixed(2)} (${trade.pnlPct}%). ¿Qué lección o balance me das?`
    : `Acabo de ABRIR en ${trade.symbol}: ${trade.side === 'buy' ? 'COMPRÉ' : 'VENDÍ'} ${trade.qty} contrato(s) Strike $${trade.strike} ${trade.ot.toUpperCase()} a $${trade.price} (Costo total: $${trade.cost}). Delta: ${trade.delta}. ¿Cuál es la mecánica clave y qué debo vigilar ahora?`;

  return askDeepSeekCoach(query, context, customApiKey);
}
