import { TutorialStep } from './TutorialSpotlight';

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'step-assets',
    targetId: 'tour-assets',
    badge: 'Paso 1 de 6',
    badgeCol: '#3b82f6',
    icon: '🌐',
    title: 'Elige tu Activo de Operación',
    description:
      'Selecciona el mercado que deseas analizar: SPY (ETF más líquido), SPX (Índice S&P 500), QQQ (Nasdaq 100 Tech), GLD (Oro) o XSP (Mini SPX para cuentas pequeñas). Aquí visualizas el precio en tiempo real y la volatilidad implícita (IV).',
    tip: 'Cada activo tiene diferente volatilidad (IV). A mayor IV, las primas son más caras pero ofrecen mayores movimientos.',
    preferredPlacement: 'bottom',
  },
  {
    id: 'step-academy',
    targetId: 'tour-tabs-header',
    badge: 'Paso 2 de 6',
    badgeCol: '#10b981',
    icon: '📖',
    title: 'Academia: Fundamentos & Estrategias',
    description:
      'En la pestaña "Aprender" tienes lecciones interactivas organizadas por niveles. Domina qué son los Calls y Puts, cómo medir el riesgo con las Griegas (Delta, Theta, Vega) y cómo armar Spreads de riesgo definido.',
    tip: 'Cada lección incluye un ejemplo real con números y un botón directo para ir a practicar ese concepto en el simulador.',
    preferredPlacement: 'bottom',
  },
  {
    id: 'step-chain',
    targetId: 'tour-option-chain',
    badge: 'Paso 3 de 6',
    badgeCol: '#00d4aa',
    icon: '📊',
    title: 'Option Chain: El Centro de Mando',
    description:
      'Esta tabla lista los contratos de opciones. A la izquierda están los CALLS (verde / visión alcista) y a la derecha los PUTS (rojo / visión bajista). La fila resaltada en teal es el precio actual (ATM).',
    tip: '🎯 ¡Acción fundamental!: Haz clic en cualquier precio (Bid / Ask) para cargar de inmediato esa opción en tu boleta de orden.',
    preferredPlacement: 'bottom',
  },
  {
    id: 'step-order-payoff',
    targetId: 'tour-order-payoff',
    badge: 'Paso 4 de 6',
    badgeCol: '#f59e0b',
    icon: '📐',
    title: 'Entrada de Orden & Diagrama de Payoff',
    description:
      'Configura tu operación: elige si deseas Comprar o Vender, define el número de contratos y visualiza el costo de prima requerido. En el gráfico de Payoff puedes proyectar exactamente tus ganancias y pérdidas al vencimiento.',
    tip: 'Siempre conoce tu pérdida máxima y tu punto de equilibrio antes de enviar cualquier orden al mercado.',
    preferredPlacement: 'left',
  },
  {
    id: 'step-time-machine',
    targetId: 'tour-time-machine',
    badge: 'Paso 5 de 6',
    badgeCol: '#8b5cf6',
    icon: '⏩',
    title: 'La Máquina del Tiempo (Avanzar Día)',
    description:
      'El tiempo es el factor decisivo en las opciones. Al hacer clic en "Avanzar Día", simulas el paso de las jornadas de mercado, viendo en vivo el decaimiento Theta y cómo fluctúa el valor de tu portafolio.',
    tip: 'Revisa la pestaña "📂 Posiciones" para monitorear tu P&L flotante y cerrar tus contratos ganadores a tiempo.',
    preferredPlacement: 'bottom',
  },
  {
    id: 'step-missions-coach',
    targetId: 'tour-missions-area',
    badge: 'Paso 6 de 6',
    badgeCol: '#ec4899',
    icon: '🏆',
    title: 'Misiones Gamificadas & Coach Geny IA',
    description:
      'Supera desafíos pedagógicos para subir de nivel y desbloquear nuevas estrategias. Además, cada vez que ejecutas una orden, el Coach Geny IA te dará retroalimentación táctica profesional en español.',
    tip: '¡Comienza con el Nivel 1 (Principiante) y sube hasta convertirte en Trader de Spreads! ¡A operar!',
    preferredPlacement: 'right',
  },
];
