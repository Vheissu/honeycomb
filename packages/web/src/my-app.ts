import { route } from '@aurelia/router';

@route({
  routes: [
    {
      path: ['', 'home'],
      component: import('./pages/home/home'),
      title: 'Home',
    },
    {
      path: 'docs',
      component: import('./pages/docs/docs'),
      title: 'Docs',
    },
    {
      path: 'playground',
      component: import('./pages/playground/playground'),
      title: 'Playground',
    },
    {
      path: 'auth/callback',
      component: import('./pages/auth-callback/auth-callback'),
      title: 'Auth Callback',
    },
    {
      path: 'not-found',
      component: import('./pages/not-found/not-found'),
      title: 'Not Found',
    },
    {
      path: '*path',
      component: import('./pages/not-found/not-found'),
      title: 'Not Found',
    },
  ],
})
export class MyApp {}
