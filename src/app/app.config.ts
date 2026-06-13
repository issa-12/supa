import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      // DISABLED by default for portability: the app is served over HTTPS with a
      // self-signed cert, and browsers refuse to register a service worker over
      // an untrusted cert — they log "An SSL certificate error occurred when
      // fetching the script" (surfaced as NG05604), which can't be suppressed.
      // Trusting the cert per-machine (mkcert) isn't viable across workstations,
      // so we keep the console clean everywhere by not registering the SW.
      //
      // To re-enable the PWA on a machine where the cert IS trusted (mkcert) or
      // in production behind a real cert, set `enabled: !isDevMode()` and use
      // 'registerImmediately' (the app never reaches Angular "stable" because of
      // long-lived timers, so 'registerWhenStable' would stall 30s → NG0506).
      enabled: false,
      registrationStrategy: 'registerImmediately',
    }),
  ],
};
