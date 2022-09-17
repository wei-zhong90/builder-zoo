<!-- eslint-disable max-len -->
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
                :authToken="authToken"
                :bucket="authToken.tokenParsed.bucketname"
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
                      no-data-label="Empty bucket"
                      no-results-label="The filter didn't uncover any results"
                      :rows="rows"
                      :columns="columns"
                      :loading="loading"
                      :filter="filter"
                      row-key="filename"
                      v-model:pagination="pagination"
                      selection="multiple"
                      v-model:selected="selected"
                      >
                        <template v-slot:top>
                          <q-btn
                            color="negative"
                            icon-right="delete_forever"
                            no-caps
                            @click="deleteSelected"
                          />
                          <q-space></q-space>
                          <q-input
                          dense
                          debounce="300"
                          v-model="filter"
                          placeholder="Search"
                          >
                            <template v-slot:append>
                              <q-icon name="search"></q-icon>
                            </template>
                          </q-input>
                          <q-space></q-space>
                          <q-btn
                          icon="refresh"
                          color="primary"
                          @click="updatetable"></q-btn>
                        </template>
                        <!-- <template v-slot:body-cell-filename="props">
                          <q-td :props="props">
                            <div>
                              <q-badge color="purple" :label="props.value"></q-badge>
                            </div>
                              {{ props.row.filename }}
                          </q-td>
                        </template> -->
                        <template v-slot:no-data="{ message, }">
                          <div class="full-width row flex-center text-accent q-gutter-sm">
                            <q-icon v-if="loading===true" size="2em" name="hourglass_top"></q-icon>
                            <q-icon v-else size="2em" name="sentiment_dissatisfied"></q-icon>
                            <span>
                              {{ message }}
                            </span>
                          </div>
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
                        <template #body-cell-delete="props">
                          <q-td :props="props">
                            <q-btn
                              icon="delete"
                              color="negative"
                              @click="deletebox(props.value, rows.indexOf(props.row))"
                            />
                          </q-td>
                        </template>
                      </q-table>
                  </div>
              </div>
            </q-card-section>
            <!-- <q-separator vertical></q-separator>
            <q-card-section style="min-height: 100vh; width: 400px;">
              <editorUploader/>
            </q-card-section> -->
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
                    :rules="[ val => Number(val) <= 10080 || 'Please input number under 10080 (Minutes)']"
                  >
                    <template v-slot:prepend>
                      <q-icon name="event"></q-icon>
                    </template>
                    <template v-slot:append>
                      <q-icon name="close" @click="text = ''" class="cursor-pointer"></q-icon>
                    </template>

                    <template v-slot:hint>
                      In Minute (longest as 10080 min(7 days))
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
                  <q-inner-loading :showing="!presignedURL&&innerloading">
                    <q-spinner-gears size="50px" color="primary"></q-spinner-gears>
                  </q-inner-loading>
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

// eslint-disable-next-line @typescript-eslint/no-var-requires
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
}
  from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { exportFile, useQuasar, copyToClipboard } from 'quasar';
import axios from 'axios';
import S3Uploader from '@/components/s3uploader';
// import editorUploader from '@/components/editorUploader.vue';

export default defineComponent({
  components: {
    S3Uploader,
    // editorUploader,
  },
  setup() {
    const $q = useQuasar();
    const selected = ref([]);
    const innerloading = ref(false);
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
      {
        name: 'delete', align: 'center', label: 'Delete', field: 'delete',
      },
    ];

    const rows = ref([]);

    const stsclient = new STSClient({
      region,
      credentials: fromCognitoIdentityPool({
        identityPoolId: authToken.value.tokenParsed.poolid,
        logins: {
          'auth.weitogo.org/realms/BuilderZoo': authToken.value.token,
        },
        clientConfig: { region },
      }),
    });

    const stsparams = {
      RoleArn: authToken.value.tokenParsed.rolearn,
      RoleSessionName: authToken.value.idTokenParsed.preferred_username.replace(/\s/g, ''),
    };

    const command = new AssumeRoleCommand(stsparams);

    function downloadfile(info) {
      // console.log(info);
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
                loading.value = false;
                if (status !== true) {
                  $q.notify({
                    message: 'Browser denied file download...',
                    color: 'negative',
                    icon: 'warning',
                  });
                }
              },
              (err) => {
                console.log(err);
                loading.value = false;
              },
            );
        },
        (err) => {
          console.log(err);
          loading.value = false;
          authToken.value.logout({ redirectUri: 'https://s3toolbox.weitogo.org/' });
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

    function deletebox(info, index) {
      loading.value = true;
      rows.value.splice(index, 1);
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

          const deleteparam = {
            Bucket: info.bucket,
            Key: info.key,
          };
          const deletecommand = new DeleteObjectCommand(deleteparam);

          client.send(deletecommand).then(
            (data) => {
              console.log(data.$metadata);
              loading.value = false;
            },
            (err) => {
              console.log(err);
              loading.value = false;
            },
          );
        },
        (err) => {
          console.log(err);
          loading.value = false;
          authToken.value.logout({ redirectUri: 'https://s3toolbox.weitogo.org/' });
        },
      );
    }

    function generateUrl() {
      innerloading.value = true;
      const getconfig = {
        method: 'get',
        url: 'https://j1npbxz4mi.execute-api.ap-northeast-1.amazonaws.com/geturl',
        headers: {
          // eslint-disable-next-line quote-props
          'Authorization': `Bearer ${authToken.value.token}`,
          'Content-Type': 'application/json',
        },
        params: {
          Bucket: urlparam.value.bucket,
          Key: urlparam.value.key,
          Exp: Number(text.value) ? Number(text.value) * 60 : 3600,
        },
      };
      axios(getconfig).then(
        (data) => {
          console.log(data);
          innerloading.value = false;
          presignedURL.value = data.data.url;
          text.value = '';
        },
        (err) => {
          console.log(err);
          innerloading.value = false;
          presignedURL.value = err;
          text.value = '';
        },
      );
    }

    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function updatetable(_) {
      console.log(_);
      loading.value = true;
      rows.value = [];
      sleep(1000).then(
        () => {
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
                Bucket: authToken.value.tokenParsed.bucketname,
                Prefix: `${authToken.value.tokenParsed.roleid}:${authToken.value.idTokenParsed.preferred_username.replace(/\s/g, '')}/`,
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
                        filename,
                        filesize,
                        lastmodified,
                        download,
                        presignurl: download,
                        delete: download,
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
            (err) => {
              console.log(err);
              loading.value = false;
              authToken.value.logout({ redirectUri: 'https://s3toolbox.weitogo.org/' });
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
            Bucket: authToken.value.tokenParsed.bucketname,
            Prefix: `${authToken.value.tokenParsed.roleid}:${authToken.value.idTokenParsed.preferred_username.replace(/\s/g, '')}/`,
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
                    filename,
                    filesize,
                    lastmodified,
                    download,
                    presignurl: download,
                    delete: download,
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
        (err) => {
          console.log(err);
          loading.value = false;
          authToken.value.logout({ redirectUri: 'https://s3toolbox.weitogo.org/' });
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
      deletebox,
      icon,
      text,
      filter: ref(''),
      columns,
      rows,
      loading,
      selected,
      presignedURL,
      innerloading,
      deleteSelected() {
        selected.value.filter((item) => {
          deletebox(item.delete, rows.value.indexOf(item));
          // console.log(rows.value);
          return item;
        });
        selected.value = [];
      },
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
