<template>
  <q-card>
    <q-card-section>
        <q-editor
        v-model="editor"
        :definitions="{
            generate: {
            tip: 'Generate short lived secret link',
            icon: 'lock_clock',
            label: 'Generate',
            handler: uploadIt
            }
        }"
        :toolbar="[
            ['bold', 'italic', 'strike', 'underline'],
            ['generate']
        ]"
        ></q-editor>
    </q-card-section>
    <q-separator inset></q-separator>
    <q-card-section></q-card-section>
  </q-card>
</template>

<script>
import { useQuasar } from 'quasar';
import { defineComponent, ref } from 'vue';

export default defineComponent({
  setup() {
    const $q = useQuasar();

    return {
      editor: ref(
        'After you define a new button,'
        + ' you have to make sure to put it in the toolbar too!',
      ),

      uploadIt() {
        console.log('clicked');
        $q.notify({
          message: 'Server unavailable. Check connectivity.',
          color: 'red-5',
          textColor: 'white',
          icon: 'warning',
        });
      },
    };
  },
});
</script>
