export interface GlossaryConcept {
  id: string;
  term: string;
  category: 'Griegas' | 'Básicos' | 'Estrategias' | 'Riesgo y Dinámica';
  icon: string;
  shortDef: string;
  explanation: string;
  example: string;
  formula?: string;
  recommendedQuestion: string;
  tierId?: number;
}

export const GLOSSARY_CONCEPTS: GlossaryConcept[] = [
  {
    id: 'delta',
    term: 'Delta (Δ)',
    category: 'Griegas',
    icon: 'Δ',
    shortDef: 'Exposición direccional y acciones equivalentes por contrato.',
    explanation:
      'Mide cuánto cambia el precio de la opción por cada $1 de movimiento en la acción subyacente. En Calls va de 0 a +1.00; en Puts de 0 a -1.00. Un Delta de 0.50 equivale a estar expuesto a 50 acciones y también aproxima un 50% de probabilidad de terminar en dinero (ITM).',
    example: 'Si compras un Call con Delta 0.40 a $3.00 y la acción sube $1, tu contrato valdrá aproximadamente $3.40 (+0.40).',
    formula: 'Δ = ∂V / ∂S (Cambio en precio de opción ÷ Cambio en precio de acción)',
    recommendedQuestion: '¿Cómo uso el Delta para calcular cuántas acciones equivalentes tengo y la probabilidad de ganar?',
    tierId: 2,
  },
  {
    id: 'theta',
    term: 'Theta (Θ) Decay',
    category: 'Griegas',
    icon: 'Θ',
    shortDef: 'Decaimiento del valor temporal de la prima por día.',
    explanation:
      'Indica cuánto dinero pierde tu contrato cada día por el simple paso del tiempo, asumiendo que el precio de la acción no se mueve. Como comprador de opciones, Theta es tu enemigo (decae tu prima). Como vendedor de opciones, Theta es tu aliado (la prima que cobraste se evapora a tu favor).',
    example: 'Un contrato con Theta de -0.15 pierde $15 de valor por contrato cada noche que duermes.',
    formula: 'Θ = ∂V / ∂t (Pérdida en dólares por día)',
    recommendedQuestion: '¿Por qué Theta se acelera fuertemente en los últimos 30 y 14 días al vencimiento?',
    tierId: 2,
  },
  {
    id: 'gamma',
    term: 'Gamma (Γ)',
    category: 'Griegas',
    icon: 'Γ',
    shortDef: 'Velocidad de aceleración del Delta.',
    explanation:
      'Mide la tasa de cambio de Delta por cada $1 que sube o baja la acción. Es máxima en contratos At The Money (ATM) cercanos a expirar. Explica por qué una opción que entra en dinero gana valor a un ritmo cada vez más acelerado.',
    example: 'Si tienes Delta 0.50 y Gamma 0.08, cuando la acción suba $1 tu nuevo Delta será 0.58.',
    formula: 'Γ = ∂²V / ∂S² (Tasa de cambio de Delta)',
    recommendedQuestion: '¿Cuál es el peligro del "riesgo de Gamma" en la semana de vencimiento?',
    tierId: 2,
  },
  {
    id: 'vega',
    term: 'Vega (ν)',
    category: 'Griegas',
    icon: 'ν',
    shortDef: 'Sensibilidad ante cambios en la Volatilidad Implícita (IV).',
    explanation:
      'Mide cuánto cambia el precio de la opción por cada variación del 1% en la volatilidad implícita del mercado. A mayor tiempo restante (DTE), mayor es el impacto de Vega en la prima.',
    example: 'Con Vega de 0.20, si la IV sube de 20% a 25% (+5%), el contrato se encarece $1.00 ($100 por contrato) sin que la acción se mueva.',
    formula: 'ν = ∂V / ∂σ (Cambio en precio por 1% de IV)',
    recommendedQuestion: '¿Cómo me afecta el "IV Crush" si compro opciones justo antes de los reportes de ganancias?',
    tierId: 2,
  },
  {
    id: 'iv',
    term: 'Volatilidad Implícita (IV)',
    category: 'Riesgo y Dinámica',
    icon: '📈',
    shortDef: 'La expectativa que tiene el mercado sobre movimientos futuros.',
    explanation:
      'Refleja la oferta y la demanda del mercado sobre el rango de fluctuación que se espera en la acción. Cuando la incertidumbre sube (ej: earnings o noticias), la IV sube y todas las opciones se inflan. Comprar con IV alta es riesgoso; vender primas con IV alta es ventajoso.',
    example: 'Si SPY tiene IV del 16%, el mercado estima un movimiento anual de ±16% con un 68% de confianza estadística.',
    recommendedQuestion: '¿Cómo identificar si la Volatilidad Implícita está barata o cara usando IV Rank?',
    tierId: 2,
  },
  {
    id: 'long-call',
    term: 'Compra de Call (Long Call)',
    category: 'Básicos',
    icon: '🟢',
    shortDef: 'Estrategia alcista: derecho a comprar 100 acciones al strike.',
    explanation:
      'Pagas una prima por el derecho (sin obligación) de comprar 100 acciones al strike acordado. Tu riesgo máximo es 100% definido (únicamente la prima que pagaste) y tus ganancias teóricas son ilimitadas si la acción se dispara hacia arriba.',
    example: 'Compras Call SPY 560 por $3.00 (costo $300). Si SPY sube a $575, el contrato vale al menos $15.00 ($1,500), ganando $1,200 (+400%).',
    formula: 'Ganancia neta = Max(0, Precio Spot - Strike) - Prima pagada',
    recommendedQuestion: '¿En qué punto de equilibrio (Break-even) empieza a ganar dinero mi Call?',
    tierId: 1,
  },
  {
    id: 'long-put',
    term: 'Compra de Put (Long Put)',
    category: 'Básicos',
    icon: '🔴',
    shortDef: 'Estrategia bajista o cobertura contra caídas de mercado.',
    explanation:
      'Pagas una prima por el derecho a vender 100 acciones al strike acordado. Te beneficias cuando la acción cae por debajo de tu strike menos la prima pagada. Es la herramienta por excelencia para proteger portafolios contra desplomes.',
    example: 'Compras Put SPY 550 por $2.50. Si el mercado colapsa a $530, tu opción vale al menos $20.00 ($2,000 ganancia bruta).',
    formula: 'Ganancia neta = Max(0, Strike - Precio Spot) - Prima pagada',
    recommendedQuestion: '¿Cómo se utiliza una opción Put como seguro para proteger acciones que ya poseo?',
    tierId: 1,
  },
  {
    id: 'itm-otm-atm',
    term: 'Moneyness: ITM, ATM y OTM',
    category: 'Básicos',
    icon: '🎯',
    shortDef: 'Ubicación del Strike en relación al precio de mercado (Spot).',
    explanation:
      'ITM (In The Money) tiene valor intrínseco real. ATM (At The Money) está exactamente donde cotiza la acción. OTM (Out of The Money) solo contiene esperanza temporal (valor extrínseco). Para ganar en un OTM necesitas un movimiento fuerte antes del vencimiento.',
    example: 'Con SPY en $558: Call 550 es ITM (vale $8 intrínseco). Call 558 es ATM. Call 570 es OTM (cuesta poco pero puede expirar en $0).',
    recommendedQuestion: '¿Cuándo conviene comprar una opción ITM con alto Delta vs un contrato OTM más barato?',
    tierId: 1,
  },
  {
    id: 'break-even',
    term: 'Punto de Equilibrio (Break-even)',
    category: 'Riesgo y Dinámica',
    icon: '⚖️',
    shortDef: 'Precio exacto donde tu operación no gana ni pierde dinero.',
    explanation:
      'No basta con que la acción se mueva a tu favor; debe moverse lo suficiente para compensar la prima que desembolsaste al inicio.',
    example: 'Comprar Call Strike $100 pagando $3.00 de prima tiene un Break-even de $103.00 al vencimiento.',
    formula: 'Call B/E = Strike + Prima  |  Put B/E = Strike - Prima',
    recommendedQuestion: '¿Cómo calcular el Break-even en una estrategia de dos piernas como un Spread?',
    tierId: 1,
  },
  {
    id: 'bull-call-spread',
    term: 'Bull Call Spread (Vertical Debit)',
    category: 'Estrategias',
    icon: '📊',
    shortDef: 'Estrategia alcista de costo y riesgo reducido.',
    explanation:
      'Compras un Call cercano al dinero y simultáneamente vendes un Call más alejado (OTM) para subsidiar el costo. Esto reduce drásticamente el impacto negativo de Theta y baja el costo de entrada a cambio de topar la ganancia máxima.',
    example: 'Comprar Call 555 a $4.00 y vender Call 565 a $1.50. Costo neto: $2.50 ($250). Ganancia máxima: $7.50 ($750) si sube a $565.',
    formula: 'Riesgo Máximo = Débito Pagado | Ganancia Máxima = Ancho del Spread - Débito',
    recommendedQuestion: '¿Por qué los Spreads son más recomendables para cuentas pequeñas que comprar opciones simples?',
    tierId: 3,
  },
  {
    id: 'credit-spread',
    term: 'Credit Spread (Bull Put / Bear Call)',
    category: 'Estrategias',
    icon: '🛡️',
    shortDef: 'Cobro de prima con alta probabilidad y protección definida.',
    explanation:
      'Vendes una opción fuera del dinero (OTM) y compras otra más lejana para protegerte del riesgo extremo. Cobras un crédito neto inmediato. Ganas dinero si el mercado sube, si no hace nada o incluso si baja levemente sin tocar tu strike vendido.',
    example: 'Vender Put 540 y Comprar Put 535 cobrando $1.00 de crédito. Si la acción se queda arriba de 540, te quedas con el 100% de la prima.',
    recommendedQuestion: '¿Cómo gestionar un Credit Spread si el mercado comienza a amenazar el strike vendido?',
    tierId: 3,
  },
  {
    id: 'iron-condor',
    term: 'Iron Condor',
    category: 'Estrategias',
    icon: '🦅',
    shortDef: 'Estrategia neutral que gana si el precio permanece en un rango.',
    explanation:
      'Combina un Bull Put Spread y un Bear Call Spread en la misma fecha de vencimiento. Te embolsas el crédito de ambos lados. Es ideal para activos consolidados o en rangos laterales donde Theta trabaja día y noche a tu favor.',
    example: 'Cobras $2.00 de crédito total vendiendo los extremos OTM. Si el activo no rompe tus alas, retienes el 100% de ganancia.',
    recommendedQuestion: '¿Cuáles son las mejores reglas de entrada y salida anticipada (ej: 50% de ganancia) para un Iron Condor?',
    tierId: 3,
  },
  {
    id: 'asignacion',
    term: 'Asignación & Ejercicio',
    category: 'Riesgo y Dinámica',
    icon: '⚠️',
    shortDef: 'Obligación o derecho de intercambiar las 100 acciones.',
    explanation:
      'Si tienes una opción vendida (Short) y expira In The Money (ITM), el broker te asignará: te obligará a comprar las acciones (si vendiste Put) o a entregarlas (si vendiste Call). Cerrar las posiciones antes del vencimiento evita la asignación.',
    example: 'Vendiste un Put Strike 100. Al vencimiento la acción cayó a 95. Te asignan: compras 100 acciones a $100 cuando en el mercado valen $95.',
    recommendedQuestion: '¿Cómo evitar ser asignado cerrando o rolando (rolling) mis opciones antes del último día?',
    tierId: 1,
  },
  {
    id: 'dte',
    term: 'DTE (Days to Expiration)',
    category: 'Riesgo y Dinámica',
    icon: '⏳',
    shortDef: 'Días calendario restantes hasta el vencimiento del contrato.',
    explanation:
      'El tiempo es vida para las opciones. A mayor DTE, mayor es el valor extrínseco de la prima. Operar a 30-45 DTE ofrece un balance óptimo entre liquidez, decaimiento Theta y margen de maniobra para corregir errores.',
    example: 'Opciones de 7 DTE se mueven salvajemente por Gamma; opciones de 45 DTE evolucionan de forma más predecible.',
    recommendedQuestion: '¿Por qué los traders profesionales suelen vender opciones en el ciclo de 30 a 45 DTE?',
    tierId: 1,
  },
];
