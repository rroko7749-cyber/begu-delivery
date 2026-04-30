const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // Для MinIO и Cloudflare R2
});

const uploadFile = async (file, folder = 'documents') => {
  const key = `${folder}/${Date.now()}-${file.originalname}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    },
  });

  await upload.done();

  return {
    key,
    url: `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`,
  };
};

const deleteFile = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
};

const getFileUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

module.exports = {
  uploadFile,
  deleteFile,
  getFileUrl,
};
