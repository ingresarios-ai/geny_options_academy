import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { TutorialSpotlight } from "./src/TutorialSpotlight";
import { WelcomeModal } from "./src/WelcomeModal";
import { TUTORIAL_STEPS } from "./src/tutorialSteps";

function ncdf(x){const a=[0.254829592,-0.284496736,1.421413741,-1.453152027,1.061405429],p=0.3275911;const s=x<0?-1:1;x=Math.abs(x)/Math.SQRT2;const t=1/(1+p*x);return 0.5*(1+s*(1-(((((a[4]*t+a[3])*t+a[2])*t+a[1])*t+a[0])*t*Math.exp(-x*x))));}
function bsp(S,K,T,type,σ=0.20,r=0.05){if(T<=0)return type==='call'?Math.max(0,S-K):Math.max(0,K-S);const sq=Math.sqrt(T),d1=(Math.log(S/K)+(r+σ*σ/2)*T)/(σ*sq),d2=d1-σ*sq;return type==='call'?Math.max(0.01,S*ncdf(d1)-K*Math.exp(-r*T)*ncdf(d2)):Math.max(0.01,K*Math.exp(-r*T)*ncdf(-d2)-S*ncdf(-d1));}
function bsg(S,K,T,type,σ=0.20,r=0.05){if(T<=0)return{d:type==='call'?(S>=K?1:0):(S<=K?-1:0),g:0,t:0,v:0};const sq=Math.sqrt(T),d1=(Math.log(S/K)+(r+σ*σ/2)*T)/(σ*sq),d2=d1-σ*sq;const φ=Math.exp(-d1*d1/2)/Math.sqrt(2*Math.PI),nd1=ncdf(d1);return{d:parseFloat((type==='call'?nd1:nd1-1).toFixed(3)),g:parseFloat((φ/(S*σ*sq)).toFixed(5)),t:parseFloat(((type==='call'?-S*φ*σ/(2*sq)-r*K*Math.exp(-r*T)*ncdf(d2):-S*φ*σ/(2*sq)+r*K*Math.exp(-r*T)*ncdf(-d2))/365).toFixed(3)),v:parseFloat((S*φ*sq/100).toFixed(3))};}

// ── SÍMBOLOS CON DATA SIMULADA ──
const SYMBOLS={
  SPX:{label:'SPX',name:'S&P 500 Index',cat:'Índice',price:5520,iv:0.17,step:25,vol:0.012,col:'#3b82f6',desc:'El índice más operado del mundo. Liquidación en efectivo. Opciones europeas (no asignación anticipada).'},
  XSP:{label:'XSP',name:'Mini S&P 500',cat:'Mini Índice',price:552,iv:0.17,step:5,vol:0.012,col:'#8b5cf6',desc:'Versión 1/10 del SPX. Ideal para cuentas pequeñas. Misma exposición, menor capital requerido.'},
  SPY:{label:'SPY',name:'S&P 500 ETF',cat:'ETF',price:551,iv:0.16,step:5,vol:0.011,col:'#10b981',desc:'ETF más líquido del mundo. Permite asignación en acciones. Opciones americanas.'},
  QQQ:{label:'QQQ',name:'Nasdaq 100 ETF',cat:'ETF',price:478,iv:0.22,step:5,vol:0.016,col:'#f59e0b',desc:'Exposición a las 100 mayores tech. Mayor volatilidad que SPY. Ideal para opciones direccionales.'},
  GLD:{label:'GLD',name:'Gold ETF',cat:'Metales',price:231,iv:0.14,step:2,vol:0.008,col:'#d4a017',desc:'Replica el precio del oro físico. Baja correlación con acciones. Útil para hedging de portafolio.'},
};

const LECCIONES=[
  {tier:1,id:'c1',icon:'🎯',title:'¿Qué Es una Opción?',tag:'FUNDAMENTO',tagCol:'#3b82f6',
   concept:'Una opción es un contrato que te da el DERECHO — no la obligación — de comprar o vender 100 acciones a un precio fijo antes de una fecha determinada.',
   explain:'Piénsalo como una reserva en un restaurante. Pagas una pequeña cuota para asegurar tu mesa al precio de hoy. Si cambias de opinión, pierdes solo la reserva. Si vas, el restaurante debe honrar el precio. Las opciones funcionan igual.',
   example:'SPY está en $551. Compras un CALL en el strike $560 por $3,00 por acción.\n  • Pagaste: $3 × 100 acciones = $300 en total\n  • Si SPY sube a $575 al vencimiento → opción vale $15 → ganancia: $1.200\n  • Si SPY se queda bajo $560 → opción vence sin valor → pérdida máxima: $300',
   rule:'1 contrato = 100 acciones · Pérdida máxima en una opción larga = prima pagada · Nada más.',practice:'r1'},
  {tier:1,id:'c2',icon:'📊',title:'Calls vs. Puts',tag:'FUNDAMENTO',tagCol:'#3b82f6',
   concept:'Los CALLS ganan cuando el precio SUBE. Los PUTS ganan cuando el precio BAJA.',
   explain:'Un call es una apuesta alcista. Un put es una apuesta bajista. Ambos son herramientas — ninguno es inherentemente peligroso. Lo que importa es tu tamaño de posición y tener un plan claro.',
   example:'SPY en $551 hoy:\n  • COMPRAR CALL $560 por $2,50 → necesitas SPY > $562,50 para ganar al vencimiento\n  • COMPRAR PUT $540 por $2,50 → necesitas SPY < $537,50 para ganar al vencimiento\n  Punto de equilibrio = Strike ± Prima pagada',
   rule:'Calls = derecho a COMPRAR acciones · Puts = derecho a VENDER acciones · Verde = calls · Rojo = puts',practice:'r2'},
  {tier:1,id:'c3',icon:'💡',title:'Strike, Vencimiento y Moneyness',tag:'FUNDAMENTO',tagCol:'#3b82f6',
   concept:'El strike es tu objetivo. El vencimiento es tu fecha límite. El moneyness te dice qué tan cerca estás.',
   explain:'ITM = la opción ya tiene valor real. ATM = strike más cercano al precio actual (resaltado en teal). OTM = opciones baratas que necesitan un movimiento mayor para ser rentables.',
   example:'SPY en $551:\n  • CALL $530 → ITM (acción ya supera el strike, tiene valor intrínseco)\n  • CALL $550 → ATM (justo en el dinero, gamma máximo)\n  • CALL $575 → OTM (necesita que SPY suba $24+ para ser rentable)\n\n  En el chain, la fila ATM está resaltada en teal.',
   rule:'ITM = tiene valor intrínseco · ATM = mayor gamma · OTM = barato pero menor probabilidad',practice:'r3'},
  {tier:1,id:'c4',icon:'💰',title:'Cómo Funciona el P&L',tag:'FUNDAMENTO',tagCol:'#3b82f6',
   concept:'Las opciones son apalancadas. Un pequeño movimiento en la acción = un gran movimiento porcentual en la opción.',
   explain:'La fórmula: (Precio Venta − Precio Compra) × 100 × contratos. Porque 1 contrato = 100 acciones, incluso un movimiento de $1 en la opción = $100 por contrato.',
   example:'Compras 2 contratos del CALL SPY $550 a $5,00:\n  • Costo: $5 × 100 × 2 = $1.000\n  SPY sube de $551 → $565 y tu opción vale $8,00:\n  • Valor: $8 × 100 × 2 = $1.600\n  • P&L: +$600 (+60%) en un movimiento del 2,5% del ETF',
   rule:'P&L = (Salida − Entrada) × 100 × contratos · Usa la pestaña Historial para rastrear todo',practice:'r4'},
  {tier:2,id:'c5',icon:'⚡',title:'Delta — El Medidor Direccional',tag:'GRIEGAS',tagCol:'#8b5cf6',
   concept:'Delta te dice cuánto se mueve el precio de tu opción por cada $1 que se mueve el subyacente.',
   explain:'Δ 0,50 = tu call gana ~$0,50 por cada $1 que sube el activo. Opciones ITM profundas tienen Δ cerca de 1,0. Opciones OTM tienen Δ cerca de 0. Delta también es la probabilidad aproximada de expirar ITM.',
   example:'QQQ sube $5 hoy:\n  • Δ 0,80 call → gana ~$4,00 (×100 = +$400 por contrato)\n  • Δ 0,30 call → gana ~$1,50 (×100 = +$150 por contrato)\n  • Δ 0,05 call → gana ~$0,25 (×100 = +$25 por contrato)\n\n  Delta aparece en el chain junto a cada strike.',
   rule:'Delta 0,50 = ATM · 0,80+ = deep ITM · 0,20− = OTM lejano · Puts tienen delta negativo',practice:'a1'},
  {tier:2,id:'c6',icon:'⏳',title:'Theta — El Tiempo Siempre Corre',tag:'GRIEGAS',tagCol:'#8b5cf6',
   concept:'Theta es el monto diario en dólares que pierde una opción solo por el paso del tiempo.',
   explain:'Cada día que pasa, tu opción pierde valor (decaimiento theta). Es el enemigo invisible del comprador. Para los vendedores, theta es ingreso. Usa "Avanzar Día" para verlo en acción.',
   example:'Compras SPX CALL $5500 por $50,00 con theta = -2,50:\n  • Día 1: vale ~$47,50\n  • Día 5: vale ~$37,50\n  • Día 10: vale ~$22,50\n\n  El decaimiento theta se ACELERA en los últimos 30 días.',
   rule:'Opciones largas PIERDEN theta diariamente · Opciones cortas GANAN theta · ATM = mayor theta',practice:'a3'},
  {tier:2,id:'c7',icon:'🌊',title:'Vega — La Griega de la Volatilidad',tag:'GRIEGAS',tagCol:'#8b5cf6',
   concept:'Vega mide cuánto cambia el precio de tu opción cuando la volatilidad implícita (IV) se mueve un 1%.',
   explain:'Cuando el mercado se asusta, la IV sube e infla los precios de las opciones. Cuando el miedo se calma, la IV cae y aplasta los precios (IV crush). Comprar antes de noticias = largo vega. Vender después de noticias = corto vega.',
   example:'Compras GLD CALL con vega = 0,15 y IV en 14%:\n  • IV sube a 19% (+5%) → opción gana 0,15 × 5 = +$0,75 (×100 = +$75)\n  • IV cae a 9% (−5%) → opción pierde 0,15 × 5 = −$0,75 (×100 = −$75)',
   rule:'IV subiendo → opciones largas suben · IV bajando → opciones largas caen · Revisa IV% en el chain',practice:'a2'},
  {tier:2,id:'c8',icon:'💸',title:'Vender Opciones para Cobrar Prima',tag:'ESTRATEGIA',tagCol:'#8b5cf6',
   concept:'Cuando VENDES una opción, cobras la prima por adelantado. Ganas si la opción expira sin valor.',
   explain:'Los vendedores de opciones son como compañías de seguros. Cobran primas consistentes y ganan cuando no pasa nada dramático. El riesgo: si el activo hace un gran movimiento en tu contra, las pérdidas pueden superar la prima recibida.',
   example:'VENDES QQQ CALL $490 por $3,00 cuando QQQ está en $478:\n  • Recibes: $300 inmediatamente\n  • Si QQQ se queda bajo $490 → expira sin valor → te quedas $300 ✅\n  • Si QQQ sube a $510 → debes $20/acción → pérdida de $1.700',
   rule:'Vende opciones para cobrar prima · Ganas en mercados en rango · Limita pérdida comprando de vuelta si excede 2× prima',practice:'a2'},
  {tier:3,id:'c9',icon:'📐',title:'Spreads Verticales — Riesgo Definido',tag:'ESTRATEGIAS',tagCol:'#10b981',
   concept:'Comprar una opción + vender otra en strike diferente (mismo vencimiento) = pérdida y ganancia máximas definidas.',
   explain:'Al vender una opción contra tu posición larga, reduces tu costo dramáticamente pero limitas tu ganancia máxima. Siempre sabes tu peor escenario antes de entrar.',
   example:'Bull Call Spread en SPY a $551:\n  • COMPRAR CALL $550 @ $5,00\n  • VENDER CALL $560 @ $2,50\n  • Costo neto (pérdida máx): $2,50 × 100 = $250\n  • Ganancia máxima: $750\n  • Punto de equilibrio: $552,50\n  • Riesgo/Recompensa: 1:3',
   rule:'Pérdida máxima = débito neto · Ganancia máxima = ancho del spread − débito · Conoce ambos ANTES de entrar',practice:'t1'},
  {tier:3,id:'c10',icon:'🐻',title:'Bear Put Spread',tag:'ESTRATEGIAS',tagCol:'#10b981',
   concept:'Estrategia bajista de riesgo definido: compra un put de strike mayor, vende uno de strike menor.',
   explain:'En lugar de comprar un put desnudo (costoso), vendes un strike inferior para compensar el costo. Ideal cuando eres bajista pero no quieres arriesgar demasiada prima.',
   example:'Bear Put Spread en QQQ a $478:\n  • COMPRAR PUT $475 @ $4,00\n  • VENDER PUT $465 @ $1,50\n  • Costo neto (pérdida máx): $2,50 × 100 = $250\n  • Ganancia máxima: $750\n  • Ganas si QQQ cae bajo $465 al vencimiento',
   rule:'Spread bajista · Menor costo que put directo · Para construirlo: compra un put, luego vende un put de strike inferior',practice:'t2'},
  {tier:3,id:'c11',icon:'🏦',title:'Put Garantizado con Efectivo (CSP)',tag:'INGRESOS',tagCol:'#10b981',
   concept:'Vende un put por debajo del precio actual, cobra prima. Si te asignan, compras el activo a precio de descuento.',
   explain:'Es como decir: "Estoy feliz de comprar SPY a $530. Págame $3 ahora por ese derecho." Si SPY se queda sobre $530, te quedas el dinero. Si cae, compras a descuento.',
   example:'SPY en $551. Vendes PUT $530 por $2,50:\n  • Recibes: $250 inmediatamente\n  • Escenario A — SPY en $545 expiry: put expira → te quedas $250 ✅\n  • Escenario B — SPY cae a $520: te asignan 100 acciones a $530\n    (costo efectivo = $527,50/acción — compraste con descuento)',
   rule:'Solo vende CSPs en activos que QUIERES poseer · Reserva efectivo para cubrir el strike · Ideal en mercados neutros',practice:'t3'},
];

const TIERS=[
  {id:1,name:'Principiante',icon:'🌱',col:'#3b82f6',missions:[
    {id:'r1',xp:100,title:'Compra tu Primer Call',desc:'Adquiere 1 contrato de opción call.',ok:(t)=>t.some(x=>x.ot==='call'&&x.side==='buy')},
    {id:'r2',xp:100,title:'Compra tu Primer Put',desc:'Adquiere 1 contrato de opción put.',ok:(t)=>t.some(x=>x.ot==='put'&&x.side==='buy')},
    {id:'r3',xp:150,title:'Cierra una Posición',desc:'Vende una opción que ya tienes.',ok:(t)=>t.some(x=>x.isClose)},
    {id:'r4',xp:200,title:'Registra una Ganancia',desc:'Cierra cualquier posición con ganancia.',ok:(t)=>t.some(x=>x.pnl&&x.pnl>0)},
  ]},
  {id:2,name:'Aprendiz',icon:'📚',col:'#8b5cf6',missions:[
    {id:'a1',xp:200,title:'Operación ITM Profundo (Δ > 0,65)',desc:'Compra una opción con delta mayor a 0,65.',ok:(t)=>t.some(x=>Math.abs(x.delta||0)>0.65)},
    {id:'a2',xp:200,title:'Vende para Cobrar Prima',desc:'Vende un call o put para recibir prima.',ok:(t)=>t.some(x=>x.side==='sell'&&!x.isClose)},
    {id:'a3',xp:250,title:'Hito de 5 Operaciones',desc:'Ejecuta 5 operaciones en total.',ok:(t)=>t.length>=5},
    {id:'a4',xp:300,title:'Retorno del 25%+',desc:'Cierra una posición con 25%+ de ganancia.',ok:(t)=>t.some(x=>x.pnlPct&&x.pnlPct>=25)},
  ]},
  {id:3,name:'Trader',icon:'💹',col:'#10b981',missions:[
    {id:'t1',xp:350,title:'Bull Call Spread',desc:'Compra un call Y vende un call de strike mayor, mismo vencimiento.',ok:(_,pos)=>{const c=pos.filter(p=>p.ot==='call');return c.some(p=>p.side==='buy')&&c.some(p=>p.side==='sell');}},
    {id:'t2',xp:350,title:'Bear Put Spread',desc:'Compra un put Y vende un put de strike menor, mismo vencimiento.',ok:(_,pos)=>{const p=pos.filter(x=>x.ot==='put');return p.some(x=>x.side==='buy')&&p.some(x=>x.side==='sell');}},
    {id:'t3',xp:300,title:'Cash-Secured Put',desc:'Vende un put por debajo del precio actual.',ok:(t)=>t.some(x=>x.ot==='put'&&x.side==='sell'&&!x.isClose)},
    {id:'t4',xp:400,title:'P&L Total de $500+',desc:'Acumula $500+ en ganancias realizadas.',ok:(t)=>{const tot=t.filter(x=>x.pnl).reduce((s,x)=>s+x.pnl,0);return tot>=500;}},
  ]},
];

const f$=(n,d=2)=>`${n>=0?'':'-'}$${Math.abs(n).toFixed(d)}`;
const D='#070b12',CARD='#0d1421',BDR='#1a2840',TEAL='#00d4aa',DIM='#94a3b8';

function TarjetaLeccion({leccion,alPracticar}){
  return(
    <div style={{background:CARD,border:`1px solid ${BDR}`,borderRadius:12,overflow:'hidden',marginBottom:16}}>
      <div style={{background:`${leccion.tagCol}18`,borderBottom:`1px solid ${leccion.tagCol}44`,padding:'13px 18px',display:'flex',alignItems:'center',gap:12}}>
        <span style={{fontSize:24}}>{leccion.icon}</span>
        <div>
          <div style={{fontSize:11,color:leccion.tagCol,fontWeight:800,letterSpacing:1.5,marginBottom:2}}>{leccion.tag}</div>
          <div style={{fontWeight:800,fontSize:17,color:'#f8fafc'}}>{leccion.title}</div>
        </div>
      </div>
      <div style={{padding:'16px 18px'}}>
        <div style={{background:`${leccion.tagCol}15`,border:`1px solid ${leccion.tagCol}30`,borderRadius:9,padding:'12px 14px',marginBottom:14}}>
          <div style={{fontSize:11,color:leccion.tagCol,fontWeight:800,letterSpacing:1,marginBottom:6}}>CONCEPTO CLAVE</div>
          <div style={{color:'#f1f5f9',fontSize:14.5,lineHeight:1.6,fontWeight:500}}>{leccion.concept}</div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:DIM,fontWeight:800,letterSpacing:1,marginBottom:6}}>EN PALABRAS SIMPLES</div>
          <div style={{color:'#cbd5e1',fontSize:13.5,lineHeight:1.75}}>{leccion.explain}</div>
        </div>
        <div style={{background:'#050d18',border:'1px solid #0f2040',borderRadius:9,padding:'12px 14px',marginBottom:14}}>
          <div style={{fontSize:11,color:'#f59e0b',fontWeight:800,letterSpacing:1,marginBottom:6}}>📊 EJEMPLO REAL</div>
          <pre style={{color:'#e2e8f0',fontSize:12.5,lineHeight:1.8,margin:0,fontFamily:"'Courier New',monospace",whiteSpace:'pre-wrap'}}>{leccion.example}</pre>
        </div>
        <div style={{background:'#0a1f10',border:'1px solid #14532d',borderRadius:9,padding:'10px 14px',marginBottom:16}}>
          <div style={{fontSize:11,color:'#4ade80',fontWeight:800,letterSpacing:1,marginBottom:5}}>✅ REGLA CLAVE</div>
          <div style={{color:'#bbf7d0',fontSize:13,lineHeight:1.7,fontWeight:500}}>{leccion.rule}</div>
        </div>
        <button onClick={()=>alPracticar(leccion.practice)} style={{width:'100%',background:`linear-gradient(135deg,${leccion.tagCol},${leccion.tagCol}cc)`,border:'none',borderRadius:8,color:'#fff',fontWeight:800,fontSize:13.5,padding:'11px',cursor:'pointer',letterSpacing:.5}}>
          🎯 Practicar Esto en el Simulador →
        </button>
      </div>
    </div>
  );
}

export default function GenyOptionsAcademyES(){
  const [sym,setSym]=useState('SPY');
  const [spot,setSpot]=useState(SYMBOLS.SPY.price);
  const [prevSpot,setPrevSpot]=useState(SYMBOLS.SPY.price);
  const [σ,setσ]=useState(SYMBOLS.SPY.iv);
  const [dte,setDte]=useState(14);
  const [cash,setCash]=useState(25000);
  const [positions,setPositions]=useState([]);
  const [trades,setTrades]=useState([]);
  const [sel,setSel]=useState(null);
  const [oSide,setOSide]=useState('buy');
  const [qty,setQty]=useState(1);
  const [tabCentro,setTabCentro]=useState('aprender');
  const [tierAprender,setTierAprender]=useState(1);
  const [mTab,setMTab]=useState(1);
  const [done,setDone]=useState(new Set());
  const [xp,setXp]=useState(0);
  const [aiMsg,setAiMsg]=useState('¡Bienvenido a Geny Options Academy! 🎓\n\nEmpieza en la pestaña Aprender para dominar los conceptos, luego ve al Chain para practicar en el simulador.\n\nSelecciona tu activo arriba (SPY, SPX, QQQ, GLD, XSP) y ¡a operar!');
  const [aiLoad,setAiLoad]=useState(false);
  const [toast,setToast]=useState(null);
  const [dia,setDia]=useState(1);

  // Estados del tutorial interactivo
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  // Mostrar modal de bienvenida en la primera visita
  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem('geny_options_academy_tour_done');
      if (!hasSeen) {
        const timer = setTimeout(() => setWelcomeOpen(true), 700);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // Ignorar errores de storage
    }
  }, []);

  const iniciarTour = () => {
    setWelcomeOpen(false);
    setTourStep(0);
    setTourOpen(true);
  };

  const cerrarTour = () => {
    setTourOpen(false);
    try {
      localStorage.setItem('geny_options_academy_tour_done', 'true');
    } catch (e) {}
  };

  const avanzarTour = () => {
    if (tourStep < TUTORIAL_STEPS.length - 1) {
      setTourStep(s => s + 1);
    } else {
      cerrarTour();
      showToast('🎉 ¡Tutorial completado! Ya estás listo para operar.');
    }
  };

  const retrocederTour = () => {
    if (tourStep > 0) setTourStep(s => s - 1);
  };

  const irAPaso = (idx: number) => {
    setTourStep(idx);
  };

  // Sincronizar automáticamente la interfaz al avanzar en el tour
  useEffect(() => {
    if (!tourOpen) return;
    if (tourStep === 1) {
      setTabCentro('aprender');
    } else if (tourStep === 2) {
      setTabCentro('chain');
    } else if (tourStep === 3) {
      setTabCentro('chain');
      // Aseguramos una selección ilustrativa para el ticket y payoff
      if (!sel) {
        const s = SYMBOLS[sym] || SYMBOLS.SPY;
        const atm = Math.round(spot / s.step) * s.step;
        setSel({ strike: atm, ot: 'call' });
        setOSide('buy');
      }
    }
  }, [tourOpen, tourStep]);

  const SD=SYMBOLS[sym];

  // Cambiar símbolo
  useEffect(()=>{
    const s=SYMBOLS[sym];
    setSpot(s.price+(Math.random()-.5)*s.price*.01);
    setPrevSpot(s.price);
    setσ(s.iv);
    setPositions([]);
    setSel(null);
    setDte(14);
  },[sym]);

  const posValue=useMemo(()=>positions.reduce((s,p)=>{const T=Math.max(0.001,p.dte/365);const curr=bsp(spot,p.strike,T,p.ot,σ);return s+(p.side==='buy'?1:-1)*curr*100*p.qty;},0),[positions,spot,σ]);
  const equity=cash+posValue;
  const totalPnL=equity-25000;

  useEffect(()=>{
    const nd=new Set(done);let nxp=xp,ganadas=[];
    TIERS.forEach(t=>t.missions.forEach(m=>{if(!nd.has(m.id)&&m.ok(trades,positions)){nd.add(m.id);nxp+=m.xp;ganadas.push(m);}}));
    if(ganadas.length){setDone(nd);setXp(nxp);const last=ganadas[ganadas.length-1];showToast(`🏆 Misión Completada: ${last.title}  +${last.xp} XP`);}
  },[trades,positions]);

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),3500);};

  const strikes=useMemo(()=>{
    const step=SD.step,b=Math.round(spot/step)*step;
    return Array.from({length:15},(_,i)=>b-step*7+i*step);
  },[spot,sym]);

  const chain=useMemo(()=>strikes.map(K=>{
    const T=Math.max(0.001,dte/365),skew=σ*(1+0.12*Math.max(0,(spot-K)/spot));
    const cp=bsp(spot,K,T,'call',σ),pp=bsp(spot,K,T,'put',skew);
    const cg=bsg(spot,K,T,'call',σ),pg=bsg(spot,K,T,'put',skew);
    return{K,c:{p:cp,bid:(cp*.979).toFixed(2),ask:(cp*1.021).toFixed(2),...cg,iv:(σ*100).toFixed(1)},p:{p:pp,bid:(pp*.979).toFixed(2),ask:(pp*1.021).toFixed(2),...pg,iv:(skew*100).toFixed(1)},atm:Math.abs(K-spot)<SD.step*.6,itmc:spot>=K,itmp:spot<=K};
  }),[strikes,spot,σ,dte,sym]);

  const payoff=useMemo(()=>{
    if(!positions.length)return[];
    return Array.from({length:61},(_,i)=>{const s=spot*0.65+i*(spot*0.70/60);const pl=positions.reduce((sum,p)=>{const ev=p.ot==='call'?Math.max(0,s-p.strike):Math.max(0,p.strike-s);return sum+(p.side==='buy'?(ev-p.avg):(p.avg-ev))*100*p.qty;},0);return{s:s.toFixed(0),pnl:parseFloat(pl.toFixed(0))};});
  },[positions,spot]);

  const selInfo=useMemo(()=>{if(!sel)return null;const T=Math.max(0.001,dte/365);return{px:bsp(spot,sel.strike,T,sel.ot,σ),g:bsg(spot,sel.strike,T,sel.ot,σ)};},[sel,spot,σ,dte]);

  const avanzarDia=()=>{
    setPrevSpot(spot);
    setSpot(s=>parseFloat(Math.max(s*.85,Math.min(s*1.15,s+(Math.random()-.47)*s*SD.vol)).toFixed(sym==='SPX'?0:2)));
    setσ(v=>parseFloat(Math.max(0.08,Math.min(0.70,v+(Math.random()-.5)*.02)).toFixed(3)));
    setDte(d=>Math.max(0,d-1));
    setDia(d=>d+1);
  };

  const ejecutarOrden=()=>{
    if(!sel)return;
    const T=Math.max(0.001,dte/365),raw=bsp(spot,sel.strike,T,sel.ot,σ),px=oSide==='buy'?raw*1.018:raw*0.982,cost=parseFloat((px*100*qty).toFixed(2)),g=bsg(spot,sel.strike,T,sel.ot,σ);
    if(oSide==='buy'&&cost>cash){showToast('❌ Fondos insuficientes!');return;}
    const opp=oSide==='buy'?'sell':'buy',xi=positions.findIndex(p=>p.strike===sel.strike&&p.ot===sel.ot&&p.side===opp);
    let pnl=null,pnlPct=null,isClose=false;
    if(xi>=0){isClose=true;const ex=positions[xi],cq=Math.min(qty,ex.qty);pnl=parseFloat(((oSide==='sell'?(px-ex.avg):(ex.avg-px))*100*cq).toFixed(2));pnlPct=parseFloat(((pnl/(ex.avg*100*cq))*100).toFixed(1));setPositions(p=>cq>=ex.qty?p.filter((_,i)=>i!==xi):p.map((x,i)=>i===xi?{...x,qty:x.qty-cq}:x));}
    else{const si=positions.findIndex(p=>p.strike===sel.strike&&p.ot===sel.ot&&p.side===oSide);if(si>=0){setPositions(p=>p.map((x,i)=>i===si?{...x,qty:x.qty+qty,avg:(x.avg*x.qty+px*qty)/(x.qty+qty)}:x));}else{setPositions(p=>[...p,{id:Date.now(),strike:sel.strike,ot:sel.ot,side:oSide,qty,avg:parseFloat(px.toFixed(3)),dte,...g,sym}]);}}
    setCash(c=>parseFloat((c+(oSide==='buy'?-cost:cost)).toFixed(2)));
    const trade={id:Date.now(),sym,strike:sel.strike,ot:sel.ot,side:oSide,qty,price:parseFloat(px.toFixed(2)),cost,pnl,pnlPct,isClose,delta:g.d,time:new Date().toLocaleTimeString()};
    setTrades(t=>[trade,...t]);
    getAI(trade,g);
    setTabCentro('chain');
  };

  const getAI=async(trade,greeks)=>{
    setAiLoad(true);
    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:220,
          system:`Eres Geny, coach experto en opciones dentro de un simulador gamificado de INGRESARIOS. 
Responde SIEMPRE EN ESPAÑOL. Da exactamente 3 oraciones: 1) Comenta la mecánica de la operación 2) Explica UN concepto clave con números concretos 3) Un próximo paso accionable. 
Activo: ${sym} (${SD.name}) en $${spot.toFixed(2)}, IV ${(σ*100).toFixed(0)}%, ${dte} días al vencimiento.`,
          messages:[{role:'user',content:`Operación en ${sym}: ${trade.side==='buy'?'COMPRÓ':'VENDIÓ'} ${trade.qty}x $${trade.strike} ${trade.ot.toUpperCase()} @ $${trade.price}. Delta: ${trade.delta}. ${trade.isClose?`CERRÓ con P&L: ${f$(trade.pnl)} (${trade.pnlPct}%)`:'Nueva posición abierta.'}`}]})});
      const d=await res.json();
      setAiMsg(d.content?.find(c=>c.type==='text')?.text||'¡Buena operación! Monitorea tus griegas y siempre conoce tu pérdida máxima antes de entrar.');
    }catch{setAiMsg('¡Sólida ejecución! Observa el delta de tu posición — te dice cuántas acciones equivalentes tienes expuestas. Revisa el diagrama de payoff para visualizar tus zonas de ganancia.');}
    setAiLoad(false);
  };

  const tierDone=id=>TIERS.find(t=>t.id===id)?.missions.every(m=>done.has(m.id));
  const desbloqueado=id=>id===1||tierDone(id-1);
  const xpPct=((xp%1000)/1000)*100;
  const leccionesTier=useMemo(()=>LECCIONES.filter(l=>l.tier===tierAprender),[tierAprender]);
  const tabBtn=(k,lbl,activo)=>(<button onClick={()=>setTabCentro(k)} style={{background:activo?'#141e30':'transparent',border:`1px solid ${activo?BDR:'transparent'}`,borderRadius:7,padding:'6px 12px',color:activo?'#f1f5f9':DIM,cursor:'pointer',fontSize:12.5,fontWeight:activo?700:500,letterSpacing:.3,whiteSpace:'nowrap',transition:'all .15s'}}>{lbl}</button>);

  return(
    <div style={{background:D,minHeight:'100vh',color:'#e2e8f0',fontFamily:"'Inter',system-ui,sans-serif",fontSize:13,display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden'}}>

      {toast&&<div style={{position:'fixed',top:14,left:'50%',transform:'translateX(-50%)',background:toast.includes('❌')?'#7f1d1d':TEAL,color:toast.includes('❌')?'#fca5a5':'#000',padding:'10px 22px',borderRadius:9,fontWeight:800,zIndex:9999,fontSize:14,boxShadow:'0 4px 28px rgba(0,0,0,.6)',pointerEvents:'none',whiteSpace:'nowrap'}}>{toast}</div>}

      {/* ENCABEZADO */}
      <div style={{background:'#090e1a',borderBottom:`1px solid ${BDR}`,padding:'9px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,gap:12}}>
        {/* Logo y Botón Tutorial */}
        <div style={{display:'flex',alignItems:'center',gap:16,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#d4a017,#f0c040)',borderRadius:10,width:42,height:42,flexShrink:0,boxShadow:'0 0 16px #d4a01755'}}>
              <span style={{fontWeight:900,fontSize:24,color:'#000',letterSpacing:-1}}>G</span>
            </div>
            <div>
              <div style={{fontSize:9.5,color:'#d4a017',fontWeight:800,letterSpacing:2,marginBottom:2}}>INGRESARIOS PRESENTA</div>
              <div style={{fontWeight:900,fontSize:15,letterSpacing:1.5,color:TEAL,lineHeight:1.1}}>GENY OPTIONS ACADEMY</div>
              <div style={{fontSize:10.5,color:DIM,letterSpacing:.8,marginTop:2}}>APRENDE · PRACTICA · DOMINA</div>
            </div>
          </div>

          <button
            onClick={iniciarTour}
            style={{
              background:'linear-gradient(135deg, rgba(0, 212, 170, 0.18), rgba(2, 132, 199, 0.18))',
              border:'1px solid #00d4aa',
              borderRadius:8,
              padding:'7px 14px',
              color:'#00d4aa',
              fontWeight:700,
              fontSize:12,
              cursor:'pointer',
              display:'flex',
              alignItems:'center',
              gap:7,
              transition:'all .2s',
              boxShadow:'0 0 14px rgba(0, 212, 170, 0.25)',
              whiteSpace:'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00d4aa'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 212, 170, 0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#00d4aa88'; e.currentTarget.style.boxShadow = '0 0 14px rgba(0, 212, 170, 0.25)'; }}
          >
            <span style={{fontSize:14}}>🎯</span>
            <span>Tutorial Guiado</span>
          </button>
        </div>

        {/* Paso 1 Tour: Selector de Símbolo y Precio */}
        <div id="tour-assets" style={{display:'flex',alignItems:'center',gap:10}}>
          {/* Selector de Símbolo */}
          <div style={{background:CARD,borderRadius:10,border:`1px solid ${BDR}`,padding:'6px 12px'}}>
            <div style={{fontSize:9.5,color:DIM,fontWeight:800,letterSpacing:1.2,marginBottom:5,textAlign:'center'}}>SELECCIONA ACTIVO</div>
            <div style={{display:'flex',gap:5}}>
              {Object.values(SYMBOLS).map(s=>(
                <button key={s.label} onClick={()=>setSym(s.label)} style={{
                  background:sym===s.label?`${s.col}25`:'transparent',
                  border:`1px solid ${sym===s.label?s.col:BDR}`,
                  borderRadius:7,padding:'6px 11px',cursor:'pointer',textAlign:'center',
                  transition:'all .15s',minWidth:50,
                }}>
                  <div style={{fontWeight:800,fontSize:13,color:sym===s.label?s.col:'#94a3b8'}}>{s.label}</div>
                  <div style={{fontSize:10,color:sym===s.label?`${s.col}dd`:DIM,marginTop:1}}>{s.cat}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Precio */}
          <div style={{background:CARD,borderRadius:9,padding:'6px 16px',border:`1px solid ${SD.col}55`,textAlign:'center',flexShrink:0}}>
            <div style={{fontSize:11,color:SD.col,letterSpacing:1,fontWeight:800}}>{sym} · {SD.name}</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:2}}>
              <span style={{fontWeight:900,fontSize:19,fontFamily:'monospace'}}>${spot.toFixed(sym==='SPX'?0:2)}</span>
              <span style={{color:spot>=prevSpot?'#22c55e':'#ef4444',fontSize:12,fontWeight:800}}>{spot>=prevSpot?'▲':'▼'}{Math.abs(((spot-prevSpot)/prevSpot)*100).toFixed(2)}%</span>
            </div>
            <div style={{fontSize:10.5,color:DIM,marginTop:2}}>IV: {(σ*100).toFixed(1)}%  ·  Día {dia}</div>
          </div>
        </div>

        {/* Paso 5 Tour: Portfolio + Máquina del tiempo */}
        <div id="tour-time-machine" style={{display:'flex',alignItems:'center',gap:12}}>
          {/* Portfolio */}
          <div style={{background:CARD,borderRadius:9,padding:'6px 16px',border:`1px solid ${BDR}`,textAlign:'right',flexShrink:0}}>
            <div style={{fontSize:10,color:DIM,letterSpacing:1,fontWeight:700}}>PORTAFOLIO</div>
            <div style={{fontWeight:900,fontSize:19,fontFamily:'monospace',color:equity>=25000?'#22c55e':'#ef4444',marginTop:1}}>${equity.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            <div style={{fontSize:11,color:DIM,marginTop:2}}>Efectivo: ${cash.toLocaleString('en',{maximumFractionDigits:0})} · P&L: <span style={{color:totalPnL>=0?'#22c55e':'#ef4444',fontWeight:700}}>{totalPnL>=0?'+':''}{f$(totalPnL)}</span></div>
          </div>

          {/* XP & Avanzar Día */}
          <div style={{minWidth:170,flexShrink:0}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11.5,marginBottom:4}}>
              <span style={{color:TEAL,fontWeight:800}}>⚡ {xp.toLocaleString()} XP</span>
              <span style={{color:DIM,fontWeight:600}}>{dte} días al venc.</span>
            </div>
            <div style={{background:'#131e30',borderRadius:4,height:6,overflow:'hidden',marginBottom:7}}>
              <div style={{background:`linear-gradient(90deg,${TEAL},#0066ff)`,height:'100%',width:`${xpPct}%`,transition:'width .5s',borderRadius:4}}/>
            </div>
            <button onClick={avanzarDia} style={{width:'100%',background:'#131e30',border:`1px solid ${BDR}`,borderRadius:7,color:'#cbd5e1',cursor:'pointer',padding:'6px 10px',fontSize:12,fontWeight:700}}>⏩ Avanzar Día</button>
          </div>
        </div>
      </div>

      {/* CUERPO */}
      <div style={{display:'grid',gridTemplateColumns:'235px 1fr 305px',flex:1,overflow:'hidden'}}>

        {/* IZQUIERDA: MISIONES (Paso 6 Tour) */}
        <div id="tour-missions-area" style={{borderRight:`1px solid ${BDR}`,overflowY:'auto',background:'#08101c',padding:'12px 10px'}}>
          <div style={{fontSize:11,color:DIM,fontWeight:800,letterSpacing:1.2,marginBottom:10,paddingLeft:4}}>TUS MISIONES</div>
          {TIERS.map(t=>{
            const lock=!desbloqueado(t.id),cnt=t.missions.filter(m=>done.has(m.id)).length,active=mTab===t.id;
            return(
              <div key={t.id} style={{marginBottom:8}}>
                <button onClick={()=>!lock&&setMTab(t.id)} style={{width:'100%',background:active?'#141e30':'transparent',border:`1px solid ${active?t.col:BDR}`,borderRadius:8,padding:'8px 12px',cursor:lock?'not-allowed':'pointer',textAlign:'left',color:lock?DIM:'#f1f5f9',transition:'all .15s'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontWeight:800,fontSize:12.5}}>{t.icon} Nivel {t.id}: {t.name}</span>
                    {lock?<span style={{fontSize:12}}>🔒</span>:<span style={{fontSize:11,color:t.col,fontWeight:700}}>{cnt}/{t.missions.length}</span>}
                  </div>
                  <div style={{background:'#090e1a',borderRadius:3,height:4,marginTop:6}}>
                    <div style={{background:t.col,height:'100%',width:`${cnt/t.missions.length*100}%`,borderRadius:3,transition:'width .4s'}}/>
                  </div>
                  {lock&&<div style={{fontSize:10.5,color:DIM,marginTop:4}}>Completa Nivel {t.id-1} para desbloquear</div>}
                </button>
                {active&&!lock&&(
                  <div style={{marginTop:6}}>
                    {t.missions.map(m=>{
                      const isDone=done.has(m.id);
                      return(
                        <div key={m.id} style={{background:isDone?'#071a0e':CARD,border:`1px solid ${isDone?'#14532d':BDR}`,borderRadius:7,padding:'9px 11px',marginBottom:5}}>
                          <div style={{display:'flex',justifyContent:'space-between',gap:6}}>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:700,fontSize:12,color:isDone?'#4ade80':'#f1f5f9'}}>{isDone?'✅':'⬜'} {m.title}</div>
                              <div style={{color:'#94a3b8',fontSize:11,marginTop:3,lineHeight:1.45}}>{m.desc}</div>
                            </div>
                            <span style={{color:'#f59e0b',fontSize:11,whiteSpace:'nowrap',fontWeight:700}}>+{m.xp}XP</span>
                          </div>
                          {!isDone&&<button onClick={()=>{setTierAprender(t.id);setTabCentro('aprender');}} style={{marginTop:8,background:'transparent',border:`1px solid ${t.col}77`,borderRadius:5,color:t.col,cursor:'pointer',padding:'4px 9px',fontSize:11,fontWeight:700,width:'100%',transition:'all .15s'}}>📖 Estudiar Este Concepto</button>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{marginTop:10,background:CARD,border:'1px solid #d4a01740',borderRadius:8,padding:'10px',textAlign:'center'}}>
            <div style={{fontSize:9.5,color:'#d4a017',fontWeight:800,letterSpacing:1.5,marginBottom:4}}>ECOSISTEMA</div>
            <div style={{fontWeight:900,fontSize:13,color:'#f0c040',letterSpacing:1}}>INGRESARIOS</div>
            <div style={{fontSize:10.5,color:DIM,marginTop:3,lineHeight:1.5}}>PEDEM · Geny Trend<br/>Opciones · Psicología</div>
          </div>
          <div style={{marginTop:8,background:CARD,border:`1px solid ${BDR}`,borderRadius:8,padding:'10px',textAlign:'center'}}>
            <div style={{fontSize:10.5,color:DIM,fontWeight:700,marginBottom:5}}>PRÓXIMAMENTE</div>
            {['⚡ Nivel 4: Pro','🔥 Nivel 5: Experto','👑 Nivel 6: Maestro'].map(t=><div key={t} style={{fontSize:11,color:DIM,padding:'3px 0',opacity:.6}}>🔒 {t}</div>)}
          </div>
        </div>

        {/* CENTRO (Paso 2 y 3 Tour) */}
        <div id="tour-academy-area" style={{display:'flex',flexDirection:'column',overflow:'hidden',flex:1}}>
          <div style={{background:'#08101c',borderBottom:`1px solid ${BDR}`,padding:'9px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
            <div style={{display:'flex',gap:5}}>
              {tabBtn('aprender','📖 Aprender',tabCentro==='aprender')}
              {tabBtn('chain','📊 Chain',tabCentro==='chain')}
              {tabBtn('positions',`📂 Posiciones (${positions.length})`,tabCentro==='positions')}
              {tabBtn('history',`📋 Historial (${trades.length})`,tabCentro==='history')}
            </div>
            {tabCentro==='chain'&&(
              <div style={{display:'flex',gap:5,alignItems:'center'}}>
                <span style={{color:DIM,fontSize:11.5,marginRight:3,fontWeight:600}}>Vencimiento:</span>
                {[7,14,30,60].map(d=>(
                  <button key={d} onClick={()=>setDte(d)} style={{background:dte===d?`${TEAL}20`:'transparent',border:`1px solid ${dte===d?TEAL:BDR}`,borderRadius:6,padding:'4px 10px',color:dte===d?TEAL:DIM,cursor:'pointer',fontSize:11.5,fontWeight:dte===d?800:500,transition:'all .15s'}}>{d}D</button>
                ))}
              </div>
            )}
            {tabCentro==='aprender'&&(
              <div style={{display:'flex',gap:5}}>
                {TIERS.map(t=>(
                  <button key={t.id} onClick={()=>setTierAprender(t.id)} disabled={!desbloqueado(t.id)} style={{background:tierAprender===t.id?`${t.col}25`:'transparent',border:`1px solid ${tierAprender===t.id?t.col:BDR}`,borderRadius:6,padding:'4px 11px',color:tierAprender===t.id?t.col:DIM,cursor:desbloqueado(t.id)?'pointer':'not-allowed',fontSize:11.5,fontWeight:tierAprender===t.id?800:500,opacity:desbloqueado(t.id)?1:.4,transition:'all .15s'}}>{t.icon} {t.name}</button>
                ))}
              </div>
            )}
          </div>

          {/* APRENDER */}
          {tabCentro==='aprender'&&(
            <div style={{overflowY:'auto',flex:1,padding:18}}>
              <div style={{marginBottom:16,background:CARD,border:`1px solid ${BDR}`,borderRadius:12,padding:'14px 18px'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                  <span style={{fontSize:10.5,color:'#d4a017',fontWeight:800,letterSpacing:1.5,background:'#d4a01715',border:'1px solid #d4a01740',borderRadius:5,padding:'3px 8px'}}>INGRESARIOS</span>
                  <div style={{fontWeight:800,fontSize:15,color:'#f8fafc'}}>{TIERS.find(t=>t.id===tierAprender)?.icon} Nivel {tierAprender}: {TIERS.find(t=>t.id===tierAprender)?.name} — Guía de Estudio</div>
                </div>
                <div style={{color:'#94a3b8',fontSize:12.5,lineHeight:1.6}}>Lee cada tarjeta, luego haz clic en <strong style={{color:TEAL}}>"Practicar en el Simulador"</strong> para aplicarlo en el chain en vivo.</div>
              </div>
              {leccionesTier.map(l=><TarjetaLeccion key={l.id} leccion={l} alPracticar={()=>{setMTab(tierAprender);setTabCentro('chain');}}/>)}
            </div>
          )}

          {/* CHAIN */}
          {tabCentro==='chain'&&(
            <div id="tour-option-chain" style={{overflowY:'auto',flex:1}}>
              {/* Info del activo */}
              <div style={{background:`${SD.col}15`,borderBottom:`1px solid ${SD.col}35`,padding:'7px 16px',display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontWeight:900,fontSize:14,color:SD.col}}>{sym}</span>
                <span style={{fontSize:12,color:'#cbd5e1',fontWeight:600}}>{SD.name}</span>
                <span style={{fontSize:10.5,color:DIM,background:'#0a1020',padding:'3px 8px',borderRadius:5,border:'1px solid #1a2840'}}>{SD.cat}</span>
                <span style={{fontSize:11,color:'#94a3b8',marginLeft:'auto'}}>{SD.desc}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 96px 80px 96px 1fr',background:'#07101c',padding:'7px 14px',fontSize:11,color:DIM,position:'sticky',top:0,zIndex:10,borderBottom:`1px solid ${BDR}`,letterSpacing:.5}}>
                <span style={{color:'#22c55e',fontWeight:800}}>── CALLS ──</span>
                <span style={{color:'#22c55e',fontWeight:600}}>Compra / Venta</span>
                <span style={{textAlign:'center',color:'#f1f5f9',fontWeight:800}}>STRIKE</span>
                <span style={{color:'#ef4444',textAlign:'right',fontWeight:600}}>Compra / Venta</span>
                <span style={{color:'#ef4444',fontWeight:800,textAlign:'right'}}>── PUTS ──</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 96px 80px 96px 1fr',background:'#060e19',padding:'4px 14px',fontSize:9.5,color:'#8da2be',borderBottom:'1px solid #0c1525',fontWeight:600}}>
                <span>Δ Delta · Θ Theta · IV%</span><span>Bid / Ask</span><span/><span style={{textAlign:'right'}}>Bid / Ask</span><span style={{textAlign:'right'}}>Δ Delta · Θ Theta · IV%</span>
              </div>
              {chain.map(row=>{
                const sc=sel?.strike===row.K&&sel?.ot==='call',sp=sel?.strike===row.K&&sel?.ot==='put';
                return(
                  <div key={row.K} style={{display:'grid',gridTemplateColumns:'1fr 96px 80px 96px 1fr',padding:'6px 14px',background:row.atm?'#0b1a30':row.itmc?'#071410':'transparent',borderBottom:'1px solid #0b1525',borderLeft:`3px solid ${row.atm?TEAL:'transparent'}`}}>
                    <div onClick={()=>{setSel({strike:row.K,ot:'call'});setOSide('buy');}} style={{cursor:'pointer',background:sc?`${TEAL}22`:row.itmc?'#0e1c14':'transparent',borderRadius:5,padding:'2px 5px'}}>
                      <div style={{fontWeight:800,color:'#22c55e',fontFamily:'monospace',fontSize:13.5}}>{row.c.p.toFixed(2)}</div>
                      <div style={{fontSize:9.5,color:'#94a3b8',marginTop:1}}>Δ{row.c.d} Θ{row.c.t} {row.c.iv}%</div>
                    </div>
                    <div onClick={()=>{setSel({strike:row.K,ot:'call'});setOSide('buy');}} style={{cursor:'pointer',fontFamily:'monospace',fontSize:11.5,display:'flex',alignItems:'center',gap:3}}>
                      <span style={{color:DIM}}>{row.c.bid}</span><span style={{color:'#334155'}}>/</span><span style={{color:'#22c55e',fontWeight:700}}>{row.c.ask}</span>
                    </div>
                    <div style={{textAlign:'center',fontWeight:900,color:row.atm?TEAL:'#f1f5f9',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>{row.K}</div>
                    <div onClick={()=>{setSel({strike:row.K,ot:'put'});setOSide('buy');}} style={{cursor:'pointer',fontFamily:'monospace',fontSize:11.5,display:'flex',alignItems:'center',justifyContent:'flex-end',gap:3}}>
                      <span style={{color:'#ef4444',fontWeight:700}}>{row.p.bid}</span><span style={{color:'#334155'}}>/</span><span style={{color:DIM}}>{row.p.ask}</span>
                    </div>
                    <div onClick={()=>{setSel({strike:row.K,ot:'put'});setOSide('buy');}} style={{cursor:'pointer',background:sp?'#ef444422':row.itmp?'#140b0b':'transparent',borderRadius:5,padding:'2px 5px',textAlign:'right'}}>
                      <div style={{fontWeight:800,color:'#ef4444',fontFamily:'monospace',fontSize:13.5}}>{row.p.p.toFixed(2)}</div>
                      <div style={{fontSize:9.5,color:'#94a3b8',marginTop:1}}>Δ{row.p.d} Θ{row.p.t} {row.p.iv}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* POSICIONES */}
          {tabCentro==='positions'&&(
            <div style={{overflowY:'auto',flex:1,padding:14}}>
              {!positions.length&&<div style={{textAlign:'center',color:DIM,marginTop:60,fontSize:14,lineHeight:2}}>Sin posiciones abiertas.<br/>Ve a <strong style={{color:TEAL}}>📖 Aprender</strong> o al <strong style={{color:TEAL}}>📊 Chain</strong>.</div>}
              {positions.map(p=>{
                const T=Math.max(0.001,p.dte/365),curr=bsp(spot,p.strike,T,p.ot,σ);
                const pnl=(p.side==='buy'?(curr-p.avg):(p.avg-curr))*100*p.qty,pct=(pnl/(p.avg*100*p.qty))*100;
                const pSym=SYMBOLS[p.sym]||SD;
                return(
                  <div key={p.id} style={{background:CARD,border:`1px solid ${pnl>=0?'#14532d':'#7f1d1d'}`,borderRadius:9,padding:'12px 14px',marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <span style={{fontWeight:800,fontSize:14,color:p.ot==='call'?'#22c55e':'#ef4444'}}>{p.side==='buy'?'COMPRA':'VENTA'} {p.qty}x</span>
                        <span style={{color:pSym.col,marginLeft:8,fontWeight:800,fontSize:14}}>{p.sym}</span>
                        <span style={{color:'#f1f5f9',marginLeft:6,fontSize:13}}>${p.strike} {p.ot.toUpperCase()}</span>
                        <span style={{color:DIM,fontSize:11.5,marginLeft:8}}>{p.dte}D</span>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontWeight:800,fontFamily:'monospace',color:pnl>=0?'#22c55e':'#ef4444',fontSize:14}}>{pnl>=0?'+':''}{f$(pnl)}</div>
                        <div style={{fontSize:11,color:DIM}}>{pct>=0?'+':''}{pct.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:14,marginTop:6,fontSize:11,color:'#94a3b8'}}>
                      <span>Entrada: ${p.avg.toFixed(2)}</span><span>Ahora: ${curr.toFixed(2)}</span><span style={{color:'#60a5fa',fontWeight:600}}>Δ{p.d}</span><span style={{color:'#f59e0b',fontWeight:600}}>Θ{p.t}</span>
                    </div>
                    <button onClick={()=>{setSel({strike:p.strike,ot:p.ot});setOSide(p.side==='buy'?'sell':'buy');setTabCentro('chain');}} style={{marginTop:10,background:'#450a0a',border:'1px solid #7f1d1d',borderRadius:6,color:'#fca5a5',cursor:'pointer',padding:'5px 12px',fontSize:11.5,fontWeight:700}}>Cerrar Posición →</button>
                  </div>
                );
              })}
            </div>
          )}

          {/* HISTORIAL */}
          {tabCentro==='history'&&(
            <div style={{overflowY:'auto',flex:1,padding:14}}>
              {!trades.length&&<div style={{textAlign:'center',color:DIM,marginTop:60,fontSize:14}}>Sin operaciones aún. ¡A operar!</div>}
              {trades.map(t=>(
                <div key={t.id} style={{background:CARD,border:`1px solid ${BDR}`,borderRadius:7,padding:'9px 13px',marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <span style={{fontWeight:800,color:SYMBOLS[t.sym]?.col||TEAL,marginRight:6,fontSize:13}}>{t.sym}</span>
                    <span style={{fontWeight:700,fontSize:13,color:t.ot==='call'?'#22c55e':'#ef4444'}}>{t.side==='buy'?'COMPRA':'VENTA'} {t.qty}x ${t.strike} {t.ot.toUpperCase()}</span>
                    {t.isClose&&<span style={{fontSize:10,color:'#f59e0b',marginLeft:8,fontWeight:700,background:'#451a03',padding:'2px 6px',borderRadius:4}}>CIERRE</span>}
                    <div style={{fontSize:11,color:DIM,marginTop:3}}>@ ${t.price} · {t.time} · Δ{t.delta}</div>
                  </div>
                  {t.pnl!=null&&<div style={{textAlign:'right'}}><div style={{fontWeight:800,fontSize:13.5,color:t.pnl>=0?'#22c55e':'#ef4444',fontFamily:'monospace'}}>{t.pnl>=0?'+':''}{f$(t.pnl)}</div><div style={{fontSize:11,color:DIM}}>{t.pnlPct>=0?'+':''}{t.pnlPct}%</div></div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DERECHA (Paso 4 Tour) */}
        <div id="tour-order-payoff" style={{borderLeft:`1px solid ${BDR}`,display:'flex',flexDirection:'column',overflowY:'auto',background:'#08101c'}}>
          <div style={{padding:14,borderBottom:`1px solid ${BDR}`,flexShrink:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{fontWeight:800,fontSize:11,color:DIM,letterSpacing:1.2}}>ENTRADA DE ORDEN</div>
              {sel&&<span style={{fontSize:10.5,color:SD.col,fontWeight:800,background:`${SD.col}18`,border:`1px solid ${SD.col}40`,borderRadius:5,padding:'3px 8px'}}>{sym}</span>}
            </div>
            {sel?(
              <>
                <div style={{background:CARD,borderRadius:10,padding:12,marginBottom:10,border:`1px solid ${SD.col}44`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontWeight:800,color:sel.ot==='call'?'#22c55e':'#ef4444',fontSize:15}}>{sym} ${sel.strike} {sel.ot.toUpperCase()}</span>
                    <span style={{color:DIM,fontSize:11.5,fontWeight:600}}>{dte}D venc.</span>
                  </div>
                  {selInfo&&(
                    <>
                      <div style={{fontFamily:'monospace',fontSize:21,fontWeight:800,color:'#f8fafc',margin:'6px 0'}}>${selInfo.px.toFixed(2)} <span style={{fontSize:11.5,color:DIM,fontWeight:400}}>/ acción</span></div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
                        {[['Delta Δ',selInfo.g.d,'#60a5fa','Exposición direccional'],['Gamma Γ',selInfo.g.g,'#a78bfa','Cambio del delta'],['Theta Θ',selInfo.g.t,'#f59e0b','Decaimiento diario'],['Vega ν',selInfo.g.v,'#34d399','Sensibilidad a IV']].map(([l,v,c,hint])=>(
                          <div key={l} style={{background:'#050c18',borderRadius:6,padding:'5px 8px'}}>
                            <div style={{fontSize:10.5,color:DIM,marginBottom:2,fontWeight:600}}>{l}</div>
                            <div style={{color:c,fontWeight:800,fontFamily:'monospace',fontSize:13.5}}>{v}</div>
                            <div style={{fontSize:9.5,color:'#8da2be',marginTop:1}}>{hint}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div style={{display:'flex',gap:6,marginBottom:10}}>
                  {[['buy','COMPRAR'],['sell','VENDER']].map(([s,lbl])=>(
                    <button key={s} onClick={()=>setOSide(s)} style={{flex:1,padding:'9px',fontWeight:800,fontSize:13.5,cursor:'pointer',borderRadius:7,transition:'all .15s',background:oSide===s?(s==='buy'?'#14532d':'#7f1d1d'):'transparent',border:`1px solid ${oSide===s?(s==='buy'?'#22c55e':'#ef4444'):BDR}`,color:oSide===s?(s==='buy'?'#22c55e':'#fca5a5'):DIM}}>{lbl}</button>
                  ))}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                  <span style={{color:DIM,fontSize:12.5,flex:1,fontWeight:600}}>Contratos:</span>
                  {[-1,null,1].map((delta,i)=>delta===null?<span key="qty" style={{fontWeight:800,fontSize:16,fontFamily:'monospace',minWidth:28,textAlign:'center'}}>{qty}</span>:<button key={i} onClick={()=>setQty(q=>Math.max(1,q+delta))} style={{background:'#141e30',border:`1px solid ${BDR}`,borderRadius:6,color:'#f1f5f9',cursor:'pointer',width:28,height:28,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800}}>{delta>0?'+':'−'}</button>)}
                </div>
                {selInfo&&(
                  <>
                    <div style={{fontSize:12,color:DIM,marginBottom:6}}>Est. {oSide==='buy'?'Costo':'Crédito'}: <span style={{color:'#f8fafc',fontWeight:800,fontFamily:'monospace'}}>${(selInfo.px*(oSide==='buy'?1.018:0.982)*100*qty).toFixed(2)}</span><span style={{color:DIM}}> (×{qty}×100)</span></div>
                    <div style={{fontSize:11,color:'#cbd5e1',marginBottom:10,background:'#050c18',borderRadius:6,padding:'7px 10px',lineHeight:1.5,border:'1px solid #132238'}}>
                      {oSide==='buy'?`📌 Pérd. máx: $${(selInfo.px*1.018*100*qty).toFixed(0)} · Ganas si ${sel.ot==='call'?`${sym} sube sobre`:`${sym} cae bajo`} $${(sel.strike+(sel.ot==='call'?1:-1)*selInfo.px).toFixed(0)}`:`📌 Gan. máx: $${(selInfo.px*0.982*100*qty).toFixed(0)} · Te quedas la prima si expira sin valor`}
                    </div>
                  </>
                )}
                <button onClick={ejecutarOrden} style={{width:'100%',padding:'12px',fontWeight:800,fontSize:14,cursor:'pointer',borderRadius:8,background:`linear-gradient(135deg,${oSide==='buy'?'#166634,#15803d':'#991b1b,#7f1d1d'})`,border:'none',color:'#fff',letterSpacing:.5,boxShadow:oSide==='buy'?'0 0 16px rgba(22,102,52,0.4)':'0 0 16px rgba(153,27,27,0.4)'}}>
                  {oSide==='buy'?'📈':'📉'} {oSide==='buy'?'COMPRAR':'VENDER'} {qty} CONTRATO{qty!==1?'S':''}
                </button>
              </>
            ):(
              <div style={{textAlign:'center',padding:'20px 12px',fontSize:12.5,lineHeight:1.8}}>
                <div style={{color:TEAL,fontSize:24,marginBottom:8}}>←</div>
                <div style={{color:'#cbd5e1',marginBottom:4,fontWeight:600}}>Selecciona el activo arriba,</div>
                <div style={{color:DIM}}>luego haz clic en cualquier</div>
                <div style={{color:DIM}}>precio del chain para operar.</div>
                <div style={{marginTop:12,background:CARD,border:`1px solid ${BDR}`,borderRadius:8,padding:'10px',fontSize:11,color:'#94a3b8'}}>
                  ¿Nuevo? Empieza por <span style={{color:TEAL,cursor:'pointer',fontWeight:700}} onClick={()=>setTabCentro('aprender')}>📖 Aprender</span> primero
                </div>
              </div>
            )}
          </div>

          {/* Payoff */}
          <div style={{padding:14,borderBottom:`1px solid ${BDR}`,flexShrink:0}}>
            <div style={{fontWeight:800,fontSize:11,color:DIM,letterSpacing:1.2,marginBottom:8}}>PAYOFF AL VENCIMIENTO</div>
            {payoff.length?(
              <ResponsiveContainer width="100%" height={125}>
                <LineChart data={payoff} margin={{top:4,right:4,bottom:0,left:-8}}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#0d1828"/>
                  <XAxis dataKey="s" tick={{fontSize:9.5,fill:DIM}} interval={14}/>
                  <YAxis tick={{fontSize:9.5,fill:DIM}} tickFormatter={v=>v>=0?`$${v}`:`-$${Math.abs(v)}`}/>
                  <Tooltip contentStyle={{background:CARD,border:`1px solid ${BDR}`,borderRadius:7,fontSize:11}} formatter={v=>[`${v>=0?'+':''}$${v}`,'P&L']} labelFormatter={l=>`${sym} @ $${l}`}/>
                  <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3"/>
                  <ReferenceLine x={spot.toFixed(0)} stroke={TEAL} strokeDasharray="3 3"/>
                  <Line type="monotone" dataKey="pnl" stroke={TEAL} dot={false} strokeWidth={2.5}/>
                </LineChart>
              </ResponsiveContainer>
            ):(
              <div style={{textAlign:'center',color:DIM,fontSize:12,padding:'18px 0',background:CARD,borderRadius:8,lineHeight:1.7}}>Abre una posición<br/>para ver el diagrama de payoff</div>
            )}
          </div>

          {/* Coach IA */}
          <div style={{padding:14,flex:1}}>
            <div style={{fontWeight:800,fontSize:11,color:'#d4a017',letterSpacing:1.2,marginBottom:8}}>🤖 COACH GENY IA · INGRESARIOS</div>
            <div style={{background:CARD,border:`1px solid ${BDR}`,borderRadius:9,padding:12,minHeight:95}}>
              {aiLoad?<div style={{color:TEAL,fontSize:12.5,display:'flex',alignItems:'center',gap:8,fontWeight:600}}>⚡ Analizando tu operación...</div>
              :<div style={{color:'#e2e8f0',fontSize:12.5,lineHeight:1.75,whiteSpace:'pre-wrap'}}>{aiMsg}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Bienvenida inicial */}
      <WelcomeModal
        isOpen={welcomeOpen}
        onStartTour={iniciarTour}
        onDismiss={() => {
          setWelcomeOpen(false);
          try {
            localStorage.setItem('geny_options_academy_tour_done', 'true');
          } catch(e) {}
        }}
      />

      {/* Tutorial Spotlight Onboarding */}
      <TutorialSpotlight
        isOpen={tourOpen}
        currentStepIndex={tourStep}
        steps={TUTORIAL_STEPS}
        onNext={avanzarTour}
        onPrev={retrocederTour}
        onClose={cerrarTour}
        onGoToStep={irAPaso}
      />
    </div>
  );
}
