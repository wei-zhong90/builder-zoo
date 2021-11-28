<template>
  <div
    class="row bg-blue-grey-2"
    style="min-height: 100%; width: 100%; padding: 24px"
  >
    <div id="parent" class="justify-center content-start">
      <div class="col-8 self-start q-gutter-x-sm">
        <q-card class="no-border-radius">
          <q-card-section>
            <q-card> test </q-card>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, onMounted } from 'vue';

export default defineComponent({
  setup() {
    const authToken: any = inject('authToken');
    onMounted(() => {
      const t = authToken.value;
      console.log(t);
    });

    return {
      authToken,
    };
  },
});
</script>
