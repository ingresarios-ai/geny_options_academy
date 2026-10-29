import React, { useEffect } from 'react';
import './thankyou.css';

const WHATSAPP_SUPPORT_URL =
  'https://api.whatsapp.com/send?phone=573009121234&text=' +
  encodeURIComponent('Hola equipo de Ingresarios, acabo de comprar el Seminario de Opciones y necesito soporte con mi acceso.');

export const ThankYouPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="ty-root">
      <div className="ty-ambient-glow" aria-hidden="true" />



      {/* Main Content */}
      <main className="ty-main">
        <div className="ty-wrap">
          
          {/* Hero Section */}
          <section className="ty-hero">
            <div className="ty-status-pill">
              <span className="ty-status-dot" />
              <span>Compra Exitosa · Pago Confirmado</span>
            </div>

            <div className="ty-check-icon-wrap" aria-hidden="true">
              <svg className="ty-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            <h1 className="ty-title">
              ¡Felicitaciones por dar el paso y bienvenido al <em>Seminario de Opciones</em>!
            </h1>
            <p className="ty-lead">
              Tu inscripción ha sido procesada con éxito. Ya tienes asegurado tu lugar en el programa oficial de formación en opciones financieras y tu acceso al simulador complementario.
            </p>
          </section>

          {/* Email Notification Card */}
          <div className="ty-email-alert">
            <div className="ty-email-alert-header">
              <svg className="ty-email-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <h2 className="ty-email-alert-title">Revisa tu correo electrónico ahora</h2>
            </div>
            <div className="ty-email-alert-body">
              <p>
                Hemos enviado automáticamente tus <span className="ty-highlight">credenciales de acceso y el enlace al curso</span> al correo electrónico con el que realizaste tu compra.
              </p>
              <p>
                El correo debería llegar en los próximos <span className="ty-highlight">2 a 5 minutos</span>. En él encontrarás las instrucciones directas para acceder a la plataforma educativa con las 4 horas de contenido en video y la vinculación a tu simulador Geny Options Academy.
              </p>
              <div className="ty-email-alert-tip">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>
                  <strong>Tip importante:</strong> Si en unos minutos no ves el correo en tu bandeja principal, asegúrate de revisar tu carpeta de <strong>Spam</strong>, <strong>Correo No Deseado</strong> o la pestaña <strong>Promociones</strong>.
                </span>
              </div>
            </div>
          </div>

          {/* Steps Grid */}
          <section className="ty-steps-section">
            <span className="ty-section-heading">Pasos a seguir a continuación:</span>
            <div className="ty-steps-grid">
              <div className="ty-step-card">
                <span className="ty-step-number">Paso 1</span>
                <h3 className="ty-step-title">Abre el correo</h3>
                <p className="ty-step-desc">
                  Busca el correo de confirmación de Ingresarios o Whop en tu bandeja de entrada.
                </p>
              </div>

              <div className="ty-step-card">
                <span className="ty-step-number">Paso 2</span>
                <h3 className="ty-step-title">Activa tu cuenta</h3>
                <p className="ty-step-desc">
                  Haz clic en el enlace de activación para configurar tu acceso a la plataforma de video.
                </p>
              </div>

              <div className="ty-step-card">
                <span className="ty-step-number">Paso 3</span>
                <h3 className="ty-step-title">Practica en el simulador</h3>
                <p className="ty-step-desc">
                  Comienza el Módulo 1 y practica cada estrategia con dinero simulado antes de operar real.
                </p>
              </div>
            </div>
          </section>

          {/* Primary WhatsApp Support Card */}
          <section className="ty-support-card">
            <div className="ty-support-content">
              <span className="ty-support-badge">
                <span className="ty-status-dot" style={{ backgroundColor: '#25D366', boxShadow: '0 0 8px #25D366' }} />
                Soporte Prioritario de Alumnos
              </span>
              <h2 className="ty-support-title">
                ¿No recibiste el correo o necesitas ayuda con tu acceso?
              </h2>
              <p className="ty-support-desc">
                No te preocupes. Nuestro equipo de soporte oficial de Ingresarios está disponible por WhatsApp para verificar tu pago manualmente y entregarte tu acceso al instante.
              </p>

              <a
                href={WHATSAPP_SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="ty-wa-btn"
                id="btn-whatsapp-soporte"
              >
                <svg className="ty-wa-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.84 14.12c-.24.68-1.42 1.3-1.97 1.38-.51.08-1.18.12-3.41-.81-2.85-1.18-4.69-4.08-4.83-4.27-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09.99-2.37.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.42-.07.65.49.24.57.81 1.98.88 2.12.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.17-.3.37-.43.5-.14.14-.29.3-.12.59.16.28.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.28.14.45.12.62-.07.17-.19.73-.85.92-1.14.19-.28.38-.24.64-.14.26.09 1.66.78 1.94.92.28.14.47.21.54.33.07.12.07.7-.17 1.38z" />
                </svg>
                <span>Chatear con Soporte en WhatsApp</span>
              </a>

              <p className="ty-support-subtext">
                Atención rápida de lunes a domingo · También puedes escribirnos a{' '}
                <a href="mailto:soporte@ingresarios.com">soporte@ingresarios.com</a>
              </p>
            </div>
          </section>



        </div>
      </main>

      {/* Footer */}
      <footer className="ty-footer">
        <div className="ty-wrap ty-footer-inner">
          <div className="ty-footer-links">
            <a href="https://site.ingresarios.net/politicas-privacidad" target="_blank" rel="noopener noreferrer">
              Políticas de Privacidad
            </a>
            <span>·</span>
            <a href="https://site.ingresarios.net/terminos-de-uso-de-informacion" target="_blank" rel="noopener noreferrer">
              Términos y Condiciones
            </a>
            <span>·</span>
            <a href="https://site.ingresarios.net/politicas-tratamiento-de-datos-personales" target="_blank" rel="noopener noreferrer">
              Tratamiento de Datos
            </a>
            <span>·</span>
            <a href="https://www.ingresarios.com/descargo-testimonial" target="_blank" rel="noopener noreferrer">
              Descargo Testimonial
            </a>
          </div>
          <div className="ty-footer-copy">
            Ingresarios © {new Date().getFullYear()} · Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ThankYouPage;
