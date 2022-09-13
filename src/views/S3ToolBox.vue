<!-- eslint-disable @typescript-eslint/no-var-requires -->
<template>
  <div
    class="row bg-blue-grey-2"
    style="min-height: 100%; width: 100%; padding: 24px"
  >
    <div id="parent" class="justify-center content-start">
      <div class="col-8 self-start q-gutter-x-sm">
        <S3Uploader
        :authToken="authToken.token"
        bucket="document-share-wei"
        :prefix="authToken.idTokenParsed.preferred_username"
        label="S3 upload"
        multiple
        batch
        style="max-width: 300px"
      ></S3Uploader>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, inject } from 'vue';

// import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
// import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import S3Uploader from '@/components/s3uploader';

// const region = 'ap-northeast-1';

export default defineComponent({
  components: {
    S3Uploader,
  },
  setup() {
    const authToken = inject('authToken');
    // onMounted(() => {
    //   const t = authToken.value;
    //   console.log(t);
    //   const client = new S3Client({
    //     region,
    //     credentials: fromCognitoIdentityPool({
    //       identityPoolId: 'ap-northeast-1:0f6ca17c-6051-407e-b3b3-003a20a34e49',
    //       logins: {
    //         'auth.cloudmega.online/auth/realms/BuilderZoo': t.token,
    //       },
    //       clientConfig: { region },
    //     }),
    //   });
    //   console.log(client);
    //   const command = new ListObjectsV2Command({ Bucket: 'eks-demo-index' });
    //   client.send(command).then((data) => console.log(data.Contents));
    // });

    return {
      authToken,
    };
  },
});
</script>
