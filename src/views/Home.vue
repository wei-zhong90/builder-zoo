<template>
  <div
    class="row bg-blue-grey-2"
    style="min-height: 100%; width: 100%; padding: 24px"
  >
    <div id="parent" class="justify-center content-start">
      <div class="col-8 self-start q-gutter-x-sm">
        <q-card class="no-border-radius">
          <q-card-section horizontal>
            <q-card-section>

              <my-card-vue :cardcontent="authToken.tokenParsed" cardtitle="Access Token">
              </my-card-vue>

              <q-separator inset></q-separator>

              <q-card-section bordered style="width: 600px; overflow-wrap: break-word">
                {{ authToken.token }}
              </q-card-section>

            </q-card-section>

            <q-separator vertical></q-separator>

            <my-card-vue :cardcontent="authToken.idTokenParsed" cardtitle="Identity Token">
            </my-card-vue>

            <q-separator vertical></q-separator>

            <my-card-vue :cardcontent="authToken.refreshTokenParsed" cardtitle="Refresh Token">
            </my-card-vue>

          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';
import myCardVue from '@/components/myCard.vue';

export default defineComponent({
  components: {
    myCardVue,
  },
  setup() {
    const authToken: any = inject('authToken');
    return {
      authToken,
    };
  },
});
</script>
