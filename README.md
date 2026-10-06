# Geny Options Academy 🎓📊

Simulador y academia interactiva gamificada para aprender y dominar el trading de opciones financieras, presentado por **Ingresarios**.

## 🚀 Características
- **Academia de Opciones:** Lecciones estructuradas por niveles (Fundamentos, Griegas, Estrategias y Spreads).
- **Simulador en Tiempo Real:** Cadena de opciones (Option Chain) dinámica para SPY, SPX, XSP, QQQ y GLD con cálculo en vivo de Black-Scholes y Griegas (Delta, Gamma, Theta, Vega).
- **Diagrama de Payoff:** Gráficos interactivos de P&L al vencimiento para cada posición y estrategia.
- **Coach Geny IA:** Asistente inteligente enfocado en la retroalimentación y aprendizaje en cada operación.
- **Gamificación:** Misiones, puntos de experiencia (XP) y avance de días de mercado.

## 🛠️ Tecnologías
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Recharts](https://recharts.org/)

## 💻 Desarrollo Local

1. Instala las dependencias:
```bash
npm install
```

2. Inicia el servidor de desarrollo:
```bash
npm run dev
```

3. Abre en tu navegador [http://localhost:5173](http://localhost:5173).

## 📦 Compilación para Producción

```bash
npm run build
```

Los archivos optimizados para producción se generarán en la carpeta `dist/`.

## 🌐 Despliegue en Vercel

Este proyecto está preconfigurado para Vercel (`vercel.json`):
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### Variables de Entorno en Vercel
- `VITE_DEEPSEEK_API_KEY`: Clave de API de DeepSeek para habilitar la tutoría y el buscador inteligente de Coach Geny IA.

