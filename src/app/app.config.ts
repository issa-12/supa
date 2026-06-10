import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      // The app has long-lived timers (presence heartbeat, timestamp refresh)
      // so it never reaches Angular "stable" state — 'registerWhenStable' would
      // stall for 30s and log NG0506. Register as soon as the app loads instead.
      registrationStrategy: 'registerImmediately',
    }),
  ],
};
