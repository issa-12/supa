import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { installApiBase } from './app/core/api-base';

// Point relative /api calls at the right backend before anything fetches.
installApiBase();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
