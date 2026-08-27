import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

/* =========================================================
   Suppress noisy third-party payment-gateway console logs
   (Razorpay, Stripe, Sardine, hCaptcha). These are NOT
   DriveU errors — they come from external payment iframes
   and cannot be fixed from our side.
   ========================================================= */
(function suppressThirdPartyConsoleNoise(): void {
  const noisyPatterns = [
    'sardine',
    'stripe',
    'hcaptcha',
    'razorpay',
    'content-security-policy',
    'mixed content',
    'preloaded using link preload',
    'worker-src',
    'err_connection_closed',
    'bg.png'
  ];

  const shouldHide = (args: any[]): boolean => {
    const text = args
      .map(a => (typeof a === 'string' ? a : (a?.message || '')))
      .join(' ')
      .toLowerCase();

    return noisyPatterns.some(p => text.includes(p));
  };

  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);
  const originalLog = console.log.bind(console);

  console.error = (...args: any[]) => {
    if (shouldHide(args)) { return; }
    originalError(...args);
  };

  console.warn = (...args: any[]) => {
    if (shouldHide(args)) { return; }
    originalWarn(...args);
  };

  console.log = (...args: any[]) => {
    if (shouldHide(args)) { return; }
    originalLog(...args);
  };
})();

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));