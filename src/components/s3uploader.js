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
  S3Client,
}
  from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { Upload } from '@aws-sdk/lib-storage';
import { XhrHttpHandler } from '@aws-sdk/xhr-http-handler';

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
    async function upload() {
      // Reset uploads
      uploadTaskList.value = [];
      uploadProgressList.value = [];
      const t = props.authToken;
      const region = 'cn-north-1';
      console.log(t);

      const stsclient = new STSClient({
        region,
        credentials: fromCognitoIdentityPool({
          identityPoolId: 'cn-north-1:b8286d16-248e-402d-a2d0-944b750d451d',
          logins: {
            'auth.weitogo.org/realms/BuilderZoo': t,
          },
          clientConfig: { region },
        }),
      });

      const stsparams = {
        RoleArn: 'arn:aws-cn:iam::592757762710:role/s3-policy-assume-role',
        RoleSessionName: props.prefix,
      };

      const command = new AssumeRoleCommand(stsparams);

      const response = await stsclient.send(command);

      const client = new S3Client({
        region,
        credentials: {
          accessKeyId: response.Credentials.AccessKeyId,
          secretAccessKey: response.Credentials.SecretAccessKey,
          sessionToken: response.Credentials.SessionToken,
        },
        requestHandler: new XhrHttpHandler({}),
      });

      helpers.queuedFiles.value.forEach(async (fileToUpload) => {
        if (helpers.uploadedFiles.value.includes(fileToUpload)) return;

        const createParams = {
          Bucket: props.bucket,
          Key: `AROAYUAY5VKLFYKHOD7RL:${props.prefix}/${fileToUpload.name}`,
          Body: fileToUpload,
        };

        const upload = new Upload({
          client,
          params: createParams,
        });

        upload.on('httpUploadProgress', (progress) => {
          console.log(
            progress.loaded, // Bytes uploaded so far.
            progress.total, // Total bytes. Divide these two for progress percentage.
          );
        });
        await upload.done();

        // console.log(client);
        // const data = await client.send(
        //   new CreateMultipartUploadCommand(createParams),
        // );
        // console.log('Upload started. Upload ID: ', data.UploadId);
        // let n;
        // for (n = 1; n <= parts; n++) {
        //   const uploadParams = {
        //     Bucket: createParams.Bucket,
        //     Key: createParams.Key,
        //     PartNumber: n,
        //     UploadId: data.UploadId,
        //   };

        //   try {
        //     const data = await client.send(new UploadPartCommand(uploadParams));
        //     console.log('Part uploaded. ETag: ', data.ETag);

        //     var completeParams = {
        //       Bucket: createParams.Bucket,
        //       Key: createParams.Key,
        //       MultipartUpload: {
        //         Parts: [
        //           {
        //             ETag: data.ETag,
        //             PartNumber: n,
        //           },
        //         ],
        //       },
        //       UploadId: uploadParams.UploadId,
        //     };
        //   } catch (err) {
        //     console.log('Error uploading part', err);
        //   }
        // }

        // try {
        //   // Complete the mutlipart upload.
        //   const data = await client.send(
        //     new CompleteMultipartUploadCommand(completeParams),
        //   );
        //   console.log('Upload completed. File location: ', data.Location);
        // } catch (err) {
        //   console.log('Error ', err);
        // }
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
