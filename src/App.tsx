import React, { useEffect, useState } from 'react';
import SalesPage, { SalesVariant } from './SalesPage';
import GenyOptionsAcademyES from '../geny_options_academy_es';
import ThankYouPage from './ThankYouPage';

/**
 * Ruteo:
 *  - "/"                          → Sales Page principal: Versión 1 (Institucional · Más allá de lo básico)
 *  - "/?variante2" | "/variante2" → Sales Page Variante 2 (Marketera · Nivel Estratégico)
 *  - "/?original"  | "/original"  → Sales Page Original (Desde cero / CDT)
 *  - "/?variante1" | "/variante1" → Alias compatible hacia Versión 1
 *  - "/simulador"                 → Simulador privado de opciones (protegido contra indexación)
 *  - "/graciascompra"             → Página de agradecimiento y confirmación de compra (noindex)
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

const getSalesVariant = (): SalesVariant => {
  if (typeof window === 'undefined') return 'v1';
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const params = new URLSearchParams(search);

  if (
    params.has('original') ||
    params.has('variante0') ||
    params.has('v0') ||
    params.get('variante') === '0' ||
    params.get('variant') === '0' ||
    params.get('variante') === 'original' ||
    params.get('variant') === 'original' ||
    path === '/original' ||
    path === '/variante0' ||
    path === '/v0' ||
    hash === '#original'
  ) {
    return 'default';
  }

  if (
    params.has('variante2') ||
    params.has('variente2') ||
    params.has('v2') ||
    params.get('variante') === '2' ||
    params.get('variant') === '2' ||
    path === '/variante2' ||
    path === '/variente2' ||
    path === '/v2' ||
    hash === '#variante2'
  ) {
    return 'v2';
  }

  // Por defecto en "/" (y también en "/?variante1" | "/variante1") mostramos la Versión 1
  return 'v1';
};

const isAlternateVariantSlug = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const params = new URLSearchParams(window.location.search.toLowerCase());
  const variantPaths = ['/variante1', '/variente1', '/v1', '/variante2', '/variente2', '/v2', '/original', '/variante0', '/v0'];
  if (variantPaths.includes(path)) return true;
  const variantParams = ['variante1', 'variente1', 'v1', 'variante2', 'variente2', 'v2', 'original', 'variante0', 'v0', 'variante', 'variant'];
  return variantParams.some((k) => params.has(k));
};

export const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<RouteName>(getActiveRoute);
  const [salesVariant, setSalesVariant] = useState<SalesVariant>(getSalesVariant);

  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentRoute(getActiveRoute());
      setSalesVariant(getSalesVariant());
    };

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  // Control estricto de indexación y SEO por ruta y variante
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
    } else if (salesVariant === 'v2') {
      document.title = 'Ya sabes qué es un Call y un Put… da el salto | Seminario de Opciones · Ingresarios';
      robotsMeta.content = 'noindex, nofollow';
    } else if (salesVariant === 'default') {
      document.title = 'Seminario de Opciones | Ingresarios';
      robotsMeta.content = 'noindex, nofollow';
    } else {
      document.title = 'Seminario de Opciones Financieras | De los fundamentos a las estrategias · Ingresarios';
      robotsMeta.content = isAlternateVariantSlug() ? 'noindex, nofollow' : 'index, follow';
    }
  }, [currentRoute, salesVariant]);

  if (currentRoute === 'simulator') {
    return <GenyOptionsAcademyES />;
  }

  if (currentRoute === 'thank-you') {
    return <ThankYouPage />;
  }

  return <SalesPage variant={salesVariant} />;
};

export default App;
