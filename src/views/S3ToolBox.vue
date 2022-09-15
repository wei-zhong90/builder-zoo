<!-- eslint-disable @typescript-eslint/no-var-requires -->
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
              <S3Uploader
                :authToken="authToken.token"
                bucket="document-share-wei"
                :prefix="authToken.idTokenParsed.preferred_username.replace(/\s/g,'')"
                label="S3 upload (Max 5 files)"
                multiple
                max-files="5"
                batch
                @uploaded="updatetable"
                style="max-width: 300px"
              ></S3Uploader>
            </q-card-section>
            <q-separator vertical></q-separator>
            <q-card-section>
              <div id="q-app" style="min-height: 100vh;">
                  <div class="q-pa-md">
                      <q-table
                      title="Objects Table"
                      :rows="rows"
                      :columns="columns"
                      :loading="loading"
                      row-key="name"
                      v-model:pagination="pagination"
                      >
                      <template v-slot:top>
                        <q-space></q-space>
                        <q-btn icon="refresh" @click="updatetable"></q-btn>
                      </template>
                        <template #body-cell-download="props">
                          <q-td :props="props">
                            <q-btn
                              icon="cloud_download"
                              @click="downloadfile(props.value)"
                            />
                          </q-td>
                        </template>
                        <template #body-cell-presignurl="props">
                          <q-td :props="props">
                            <q-btn
                              icon="share"
                              @click="openbox(props.value)"
                            />
                          </q-td>
                        </template>
                      </q-table>
                  </div>
              </div>
            </q-card-section>
          </q-card-section>
        </q-card>
        <q-dialog v-model="icon">
          <q-card style="width: 600px;">
            <q-card-section class="row items-center q-pb-none">
              <q-space></q-space>
              <q-btn icon="close" flat round dense v-close-popup></q-btn>
            </q-card-section>

            <q-card-section>
              <q-card>
                <q-card-section>
                  <q-input
                    rounded
                    outlined
                    bottom-slots
                    v-model="text"
                    label="Presigned URL lifespan"
                  >
                    <template v-slot:prepend>
                      <q-icon name="event"></q-icon>
                    </template>
                    <template v-slot:append>
                      <q-icon name="close" @click="text = ''" class="cursor-pointer"></q-icon>
                    </template>

                    <template v-slot:hint>
                      In Minute
                    </template>
                  </q-input>
                </q-card-section>
                <q-separator inset></q-separator>
                <q-card-section
                  bordered
                  style="height: 400px;"
                >
                  <q-card v-if="presignedURL">
                    <q-card-section
                      bordered
                      style="width: 500px; word-break: break-all;"
                    >
                      {{ presignedURL }}
                    </q-card-section>
                  </q-card>
                </q-card-section>
                <q-separator inset></q-separator>
                <q-card-section class="row">
                  <q-btn
                  v-if="presignedURL"
                  icon="content_copy"
                  color="primary"
                  label="Copy Link"
                  @click="copyToClipboard(presignedURL)"></q-btn>
                  <q-space></q-space>
                  <q-btn
                  icon="link"
                  color="primary"
                  label="Generate Link"
                  @click="generateUrl"></q-btn>
                </q-card-section>
              </q-card>
            </q-card-section>
          </q-card>
        </q-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import {
  defineComponent, inject, ref,
  onMounted,
} from 'vue';

// import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
// import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
}
  from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { exportFile, useQuasar, copyToClipboard } from 'quasar';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import S3Uploader from '@/components/s3uploader';

// const region = 'ap-northeast-1';

export default defineComponent({
  components: {
    S3Uploader,
  },
  setup() {
    const $q = useQuasar();
    const region = 'cn-north-1';
    const authToken = inject('authToken');
    const text = ref('');
    const loading = ref(false);
    const icon = ref(false);
    const presignedURL = ref('');
    const urlparam = ref({
      bucket: '',
      key: '',
    });

    const columns = [
      {
        name: 'filename', style: 'width: 550px; overflow-wrap: break-word', align: 'left', label: 'File Name', field: 'filename', sortable: true,
      },
      {
        name: 'filesize', align: 'left', label: 'File Size (MB)', field: 'filesize', sortable: true,
      },
      {
        name: 'lastmodified', align: 'left', label: 'Last Modified', field: 'lastmodified', sortable: true,
      },
      {
        name: 'download', align: 'center', label: 'Download', field: 'download',
      },
      {
        name: 'presignurl', align: 'center', label: 'Presigned URL', field: 'presignurl',
      },
    ];

    const rows = ref([]);

    const stsclient = new STSClient({
      region,
      credentials: fromCognitoIdentityPool({
        identityPoolId: 'cn-north-1:b8286d16-248e-402d-a2d0-944b750d451d',
        logins: {
          'auth.weitogo.org/realms/BuilderZoo': authToken.value.token,
        },
        clientConfig: { region },
      }),
    });

    const stsparams = {
      RoleArn: 'arn:aws-cn:iam::592757762710:role/s3-policy-assume-role',
      RoleSessionName: authToken.value.idTokenParsed.preferred_username.replace(/\s/g, ''),
    };

    const command = new AssumeRoleCommand(stsparams);

    function downloadfile(info) {
      // console.log(info);
      stsclient.send(command).then(
        (response) => {
          const client = new S3Client({
            region,
            credentials: {
              accessKeyId: response.Credentials.AccessKeyId,
              secretAccessKey: response.Credentials.SecretAccessKey,
              sessionToken: response.Credentials.SessionToken,
            },
          });
          const downloadparam = {
            Bucket: info.bucket,
            Key: info.key,
          };
          const filename = info.key.split('/').pop();
          const downloadcommand = new GetObjectCommand(downloadparam);
          client.send(downloadcommand).then(
            (data) => {
              const reader = data.Body.getReader();
              return new ReadableStream({
                start(controller) {
                  // eslint-disable-next-line no-use-before-define
                  return pump();

                  function pump() {
                    return reader.read().then(({ done, value }) => {
                      // When no more data needs to be consumed, close the stream
                      if (done) {
                        controller.close();
                        return;
                      }

                      // Enqueue the next data chunk into our target stream
                      controller.enqueue(value);
                      // eslint-disable-next-line consistent-return
                      return pump();
                    });
                  }
                },
              });
            },
          ).then(
            (stream) => new Response(stream),
          ).then(
            (streamdata) => streamdata.blob(),
          )
            .then(
              (blob) => {
                const status = exportFile(filename, blob);
                if (status !== true) {
                  $q.notify({
                    message: 'Browser denied file download...',
                    color: 'negative',
                    icon: 'warning',
                  });
                }
              },
            );
        },
      );
    }

    function openbox(info) {
      if (presignedURL.value) presignedURL.value = '';
      if (text.value) text.value = '';
      icon.value = true;
      urlparam.value.bucket = info.bucket;
      urlparam.value.key = info.key;
    }

    function generateUrl() {
      icon.value = true;
      const expiretime = Number(text.value) ? Number(text.value) * 60 : 3600;
      stsclient.send(command).then(
        (response) => {
          const client = new S3Client({
            region,
            credentials: {
              accessKeyId: response.Credentials.AccessKeyId,
              secretAccessKey: response.Credentials.SecretAccessKey,
              sessionToken: response.Credentials.SessionToken,
            },
          });

          const getObjectParam = {
            Bucket: urlparam.value.bucket,
            Key: urlparam.value.key,
          };
          const getcommand = new GetObjectCommand(getObjectParam);
          getSignedUrl(client, getcommand, { expiresIn: expiretime }).then(
            (url) => {
              presignedURL.value = url;
              text.value = '';
            },
          );
        },
      );
    }

    function updatetable(_) {
      console.log(_);
      loading.value = true;
      rows.value = [];
      stsclient.send(command).then(
        (response) => {
          const client = new S3Client({
            region,
            credentials: {
              accessKeyId: response.Credentials.AccessKeyId,
              secretAccessKey: response.Credentials.SecretAccessKey,
              sessionToken: response.Credentials.SessionToken,
            },
          });

          const listParams = {
            Bucket: 'document-share-wei',
            Prefix: `AROAYUAY5VKLFYKHOD7RL:${authToken.value.idTokenParsed.preferred_username.replace(/\s/g, '')}/`,
          };

          const listcommand = new ListObjectsV2Command(listParams);

          client.send(listcommand).then(
            (data) => {
              // console.log(data);
              if (data.Contents) {
                data.Contents.forEach((element) => {
                // console.log(element);
                  const filename = element.Key.split('/').pop();
                  const filesize = (element.Size / 1024 / 1024).toFixed(2);
                  const lastmodified = element.LastModified.toLocaleDateString();
                  const download = {
                    bucket: listParams.Bucket,
                    key: element.Key,
                  };
                  rows.value = [...rows.value, {
                    filename, filesize, lastmodified, download, presignurl: download,
                  }];
                });
                loading.value = false;
              } else {
                console.log('empty bucket');
                loading.value = false;
              }
            },
          );
        },
      );
    }
    onMounted(() => {
      loading.value = true;
      stsclient.send(command).then(
        (response) => {
          const client = new S3Client({
            region,
            credentials: {
              accessKeyId: response.Credentials.AccessKeyId,
              secretAccessKey: response.Credentials.SecretAccessKey,
              sessionToken: response.Credentials.SessionToken,
            },
          });
          const listParams = {
            Bucket: 'document-share-wei',
            Prefix: `AROAYUAY5VKLFYKHOD7RL:${authToken.value.idTokenParsed.preferred_username.replace(/\s/g, '')}/`,
          };
          const listcommand = new ListObjectsV2Command(listParams);
          client.send(listcommand).then(
            (data) => {
              // console.log(data);
              if (data.Contents) {
                data.Contents.forEach((element) => {
                // console.log(element);
                  const filename = element.Key.split('/').pop();
                  const filesize = (element.Size / 1024 / 1024).toFixed(2);
                  const lastmodified = element.LastModified.toLocaleDateString();
                  const download = {
                    bucket: listParams.Bucket,
                    key: element.Key,
                  };
                  rows.value = [...rows.value, {
                    filename, filesize, lastmodified, download, presignurl: download,
                  }];
                });
                loading.value = false;
              } else {
                console.log('empty string detected!');
                loading.value = false;
              }
            },
            (err) => {
              loading.value = false;
              console.log(err);
            },
          );
        },
      );
    });

    return {
      authToken,
      updatetable,
      downloadfile,
      generateUrl,
      openbox,
      copyToClipboard,
      icon,
      text,
      columns,
      rows,
      loading,
      presignedURL,
      pagination: ref({
        sortBy: 'desc',
        descending: false,
        page: 1,
        rowsPerPage: 10,
      }),
    };
  },
});
</script>
