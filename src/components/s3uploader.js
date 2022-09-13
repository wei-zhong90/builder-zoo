/* eslint-disable block-scoped-var */
/* eslint-disable no-var */
/* eslint-disable vars-on-top */
/* eslint-disable no-plusplus */
/* eslint-disable no-shadow */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-useless-return */
import {
  createUploaderComponent,
} from 'quasar';
import { computed, ref, watch } from 'vue';
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  S3Client,
}
  from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

// export a Vue component
export default createUploaderComponent({
  // defining the QUploader plugin here

  name: 'S3Uploader', // your component's name

  props: {
    authToken: {
      type: String,
    },
    blocking: {
      type: Boolean,
      default: true,
    },
    /** The firebase storage directory your files will be uploaded to */
    bucket: {
      type: String,
    },
    prefix: {
      type: String,
    },

    // ...your custom props
  },

  emits: [
    // ...your custom events name list
  ],

  injectPlugin({ props, emit, helpers }) {
    // can call any other composables here
    // as this function will run in the component's setup()
    const uploadTaskList = ref([]);
    const uploadProgressList = ref([]);
    const uploadInProgress = ref(false);

    const uploadedFiles = ref([]);

    watch(
      () => uploadProgressList,
      () => {
        uploadInProgress.value = false;
        if (uploadProgressList.value.length) {
          uploadInProgress.value = uploadProgressList.value.reduce(
            (prev, curr) => prev || curr,
            false,
          );

          // Uploads complete - emit uploaded event with file details
          // eslint-disable-next-line max-len
          if (uploadedFiles.value && (uploadedFiles.value.length >= uploadProgressList.value.length)) {
            emit('uploaded', uploadedFiles);
          }
        }
      },
      { deep: true },
    );

    // [ REQUIRED! ]
    // We're working on uploading files
    const isUploading = computed(() => uploadInProgress.value);

    // [ optional ]
    // Shows overlay on top of the
    // uploader signaling it's waiting
    // on something (blocks all controls)
    const isBusy = computed(() => (props.blocking ? uploadInProgress.value : false));

    // [ REQUIRED! ]
    // Abort and clean up any process
    // that is in progress
    function abort() {
      uploadTaskList.value.forEach((uploadTask) => {
        uploadTask.cancel();
      });
    }

    // [ REQUIRED! ]
    // Start the uploading process
    function upload() {
      // Reset uploads
      uploadTaskList.value = [];
      uploadProgressList.value = [];
      const t = props.authToken;
      const region = 'cn-north-1';
      const parts = 3;
      console.log(t);

      helpers.queuedFiles.value.forEach(async (fileToUpload) => {
        if (helpers.uploadedFiles.value.includes(fileToUpload)) return;

        const createParams = {
          Bucket: props.bucket,
          Key: `AROAYUAY5VKLB5EAMWQYS:${props.prefix}/${fileToUpload.name}`,
        };

        const client = new S3Client({
          region,
          credentials: fromCognitoIdentityPool({
            identityPoolId: 'cn-north-1:b8286d16-248e-402d-a2d0-944b750d451d',
            logins: {
              'auth.weitogo.org/realms/BuilderZoo': t,
            },
            clientConfig: { region },
            RoleSessionName: props.prefix,
          }),
        });

        console.log(client);
        const data = await client.send(
          new CreateMultipartUploadCommand(createParams),
        );
        console.log('Upload started. Upload ID: ', data.UploadId);
        let n;
        for (n = 1; n <= parts; n++) {
          const uploadParams = {
            Bucket: createParams.Bucket,
            Key: createParams.Key,
            PartNumber: n,
            UploadId: data.UploadId,
          };

          try {
            const data = await client.send(new UploadPartCommand(uploadParams));
            console.log('Part uploaded. ETag: ', data.ETag);

            var completeParams = {
              Bucket: createParams.Bucket,
              Key: createParams.Key,
              MultipartUpload: {
                Parts: [
                  {
                    ETag: data.ETag,
                    PartNumber: n,
                  },
                ],
              },
              UploadId: uploadParams.UploadId,
            };
          } catch (err) {
            console.log('Error uploading part', err);
          }
        }

        try {
          // Complete the mutlipart upload.
          const data = await client.send(
            new CompleteMultipartUploadCommand(completeParams),
          );
          console.log('Upload completed. File location: ', data.Location);
        } catch (err) {
          console.log('Error ', err);
        }
      });
    }

    return {
      isUploading,
      isBusy,

      abort,
      upload,
    };
  },
});
