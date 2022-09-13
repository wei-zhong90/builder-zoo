import Keycloak from 'keycloak-js';
import { createApp } from 'vue';
import { Quasar } from 'quasar';
import keycloakConfig from './keycloak.json';
import router from './router';
import store from './store';
import App from './App.vue';
import './quasar-user-options';
// import '@quasar/extras/material-icons/material-icons.css';
// import 'quasar/src/css/index.sass';

const initOptions: Keycloak.KeycloakConfig = {
  url: keycloakConfig['auth-server-url'],
  realm: keycloakConfig.realm,
  clientId: keycloakConfig.resource,
};

const keycloak: Keycloak.KeycloakInstance = Keycloak(initOptions);

// Assumes your root component is App.vue
// and placed in same folder as main.js

keycloak
  .init({ onLoad: 'login-required' })
  .then((auth) => {
    if (!auth) {
      console.log('Not auth yet');
      window.location.reload();
    } else {
      const myApp = createApp(App, { authToken: keycloak });
      myApp.use(store).use(router).use(Quasar, {
        plugins: {}, // import Quasar plugins and add here
      });
      myApp.mount('#app');
    }
    setInterval(() => {
      keycloak
        .updateToken(70)
        .then((refreshed) => {
          if (refreshed) {
            console.info(`Token refreshed ${refreshed}`);
          } else {
            console.info(
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              `Token not refreshed, valid for ${Math.round(keycloak!.tokenParsed!.exp! + keycloak!.timeSkew! - new Date().getTime() / 1000)} seconds`,
            );
          }
        })
        .catch(() => console.error('Failed to refresh token'));
    }, 300000);
  })
  .catch(() => console.error('Authentication failed'));
