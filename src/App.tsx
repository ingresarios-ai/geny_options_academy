import React, { useEffect, useState } from 'react';
import SalesPage from './SalesPage';
import GenyOptionsAcademyES from '../geny_options_academy_es';
import ThankYouPage from './ThankYouPage';

/**
 * Ruteo:
 *  - "/"               → Sales Page (Página de ventas oficial en la raíz)
 *  - "/simulador"      → Simulador privado de opciones (protegido contra indexación)
 *  - "/graciascompra"  → Página de agradecimiento y confirmación de compra (noindex)
 */
export type RouteName = 'sales' | 'simulator' | 'thank-you';

const getActiveRoute = (): RouteName => {
  if (typeof window === 'undefined') return 'sales';
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const hash = window.location.hash.toLowerCase();

  if (
    path === '/graciascompra' ||
    path.startsWith('/graciascompra/') ||
    path === '/gracias-compra' ||
    path.startsWith('/gracias-compra/') ||
    hash === '#graciascompra'
  ) {
    return 'thank-you';
  }

  if (path === '/simulador' || path.startsWith('/simulador/') || hash === '#simulador') {
    return 'simulator';
  }

  return 'sales';
};

export const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<RouteName>(getActiveRoute);

  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentRoute(getActiveRoute());
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

    if (currentRoute === 'simulator') {
      document.title = 'Simulador de Opciones | Geny Options Academy';
      robotsMeta.content = 'noindex, nofollow, noarchive, nosnippet';
    } else if (currentRoute === 'thank-you') {
      document.title = '¡Compra Exitosa! · Seminario de Opciones | Ingresarios';
      robotsMeta.content = 'noindex, nofollow, noarchive, nosnippet';
    } else {
      document.title = 'Seminario de Opciones | Ingresarios';
      robotsMeta.content = 'index, follow';
    }
  }, [currentRoute]);

  if (currentRoute === 'simulator') {
    return <GenyOptionsAcademyES />;
  }

  if (currentRoute === 'thank-you') {
    return <ThankYouPage />;
  }

  return <SalesPage />;
};

export default App;
