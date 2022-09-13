<script lang="ts">

export default {
  props: ['cardtitle', 'cardcontent'],
};

</script>

<template>
    <q-card-section>
        <q-card bordered>
        <q-card-section>
            <div class="text-h6">{{ cardtitle }}</div>
        </q-card-section>

        <q-separator inset></q-separator>

        <q-card-section>
            <pre>{{ cardcontent }}</pre>
        </q-card-section>
        </q-card>
    </q-card-section>
</template>
