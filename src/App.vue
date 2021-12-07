<script lang="ts">
import { ref, toRefs, provide } from 'vue';

export default {
  props: ['authToken'],
  setup(props: any): any {
    const leftDrawerOpen = ref(false);
    const { authToken } = toRefs(props);
    console.log(JSON.stringify(authToken.value.tokenParsed, undefined, 2));

    provide('authToken', authToken);

    return {
      layout: ref(false),
      selected: ref(false),
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
    };
  },
};
</script>

<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>
          <router-link to="/" style="text-decoration: none; color: inherit">
            <q-avatar>
              <img
                src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg"
              />
            </q-avatar>
            Builder Zoo
          </router-link>
        </q-toolbar-title>
        <q-btn
          label="Logout"
          color="primary"
          @click="authToken.logout()"
        ></q-btn>
      </q-toolbar>
    </q-header>

    <q-dialog v-model="layout">
      <q-layout view="Lhh lpR fff" container class="bg-white"> </q-layout>
    </q-dialog>

    <q-drawer
      v-model="leftDrawerOpen"
      :width="200"
      :breakpoint="500"
      side="left"
      bordered
    >
      <q-scroll-area class="fit">
        <q-list padding class="menu-list">
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="fingerprint"></q-icon>
            </q-item-section>

            <q-item-section>
              <router-link
                to="/accesstest"
                style="text-decoration-line: none; color: inherit"
                >access test</router-link
              >
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view></router-view>
    </q-page-container>
  </q-layout>
</template>
