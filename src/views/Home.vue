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
              <q-card bordered style="width: 600px; overflow-wrap: break-word">
                <q-card-section>
                  <div class="text-h6">Access Token</div>
                </q-card-section>

                <q-separator inset></q-separator>

                <q-card-section>
                  <pre>{{ authToken.tokenParsed }}</pre>
                </q-card-section>

                <q-separator inset></q-separator>

                <q-card-section>
                  {{ authToken.token }}
                </q-card-section>
              </q-card>
            </q-card-section>

            <q-separator vertical></q-separator>

            <q-card-section>
              <q-card bordered>
                <q-card-section>
                  <div class="text-h6">Identity Token</div>
                </q-card-section>

                <q-separator inset></q-separator>

                <q-card-section>
                  <pre>{{ authToken.idTokenParsed }}</pre>
                </q-card-section>
              </q-card>
            </q-card-section>

            <q-separator vertical></q-separator>

            <q-card-section>
              <q-card bordered>
                <q-card-section>
                  <div class="text-h6">Refresh Token</div>
                </q-card-section>

                <q-separator inset></q-separator>

                <q-card-section>
                  <pre>{{ authToken.refreshTokenParsed }}</pre>
                </q-card-section>
              </q-card>
            </q-card-section>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from 'vue';

export default defineComponent({
  setup() {
    const authToken: unknown = inject('authToken');
    return {
      authToken,
    };
  },
});
</script>
