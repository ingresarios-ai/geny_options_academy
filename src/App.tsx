import React, { useEffect, useState } from 'react';
import SalesPage from './SalesPage';
import GenyOptionsAcademyES from '../geny_options_academy_es';

/**
 * Ruteo:
 *  - "/"           → Sales Page (Página de ventas oficial en la raíz)
 *  - "/simulador"  → Simulador privado de opciones (protegido contra indexación)
 */
const isSimulatorRoute = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const hash = window.location.hash.toLowerCase();
  return path === '/simulador' || path.startsWith('/simulador/') || hash === '#simulador';
};

export const App: React.FC = () => {
  const [isSim, setIsSim] = useState<boolean>(isSimulatorRoute);

  useEffect(() => {
    const handleRouteChange = () => {
      setIsSim(isSimulatorRoute());
    };

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  // Control estricto de indexación y SEO por ruta
  useEffect(() => {
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }

    if (isSim) {
      document.title = 'Simulador de Opciones | Geny Options Academy';
      robotsMeta.content = 'noindex, nofollow, noarchive, nosnippet';
    } else {
      document.title = 'Seminario de Opciones | Ingresarios';
      robotsMeta.content = 'index, follow';
    }
  }, [isSim]);

  return isSim ? <GenyOptionsAcademyES /> : <SalesPage />;
};

export default App;
