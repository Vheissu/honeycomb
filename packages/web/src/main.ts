import Aurelia, { Registration } from 'aurelia';
import { RouterConfiguration } from '@aurelia/router';
import { MyApp } from './my-app';
import { ApiService } from './services/api';
import { AuthService } from './services/auth';
import { HiveService } from './services/hive';
import './styles/app.css';

Aurelia
  .register(
    RouterConfiguration.customize({ useUrlFragmentHash: false, useHref: false }),
    Registration.singleton(ApiService, ApiService),
    Registration.singleton(AuthService, AuthService),
    Registration.singleton(HiveService, HiveService),
  )
  .app(MyApp)
  .start();
