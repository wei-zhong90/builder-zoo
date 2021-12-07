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
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const region = 'ap-northeast-1';

export default defineComponent({
  setup() {
    const authToken: any = inject('authToken');
    onMounted(() => {
      const t = authToken.value;
      console.log(t);
      const client = new S3Client({
        region,
        credentials: fromCognitoIdentityPool({
          identityPoolId: 'ap-northeast-1:0f6ca17c-6051-407e-b3b3-003a20a34e49',
          logins: {
            'auth.cloudmega.online/auth/realms/BuilderZoo': t.token,
          },
          clientConfig: { region },
        }),
      });
      console.log(client);
      const command = new ListObjectsV2Command({ Bucket: 'eks-demo-index' });
      client.send(command).then((data) => console.log(data.Contents));
    });

    return {
      authToken,
    };
  },
});
</script>
