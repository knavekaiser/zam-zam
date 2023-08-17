const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const S3 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_S3_API,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_ACCESS_KEY_SECRET,
  },
});

exports.uploadFiles = async (files, options = {}) => {
  return Promise.all(
    files.map((file) => {
      return S3.send(
        new PutObjectCommand({
          Bucket: "zamzam",
          Key: file.originalname,
          Body: file.buffer,
        })
      );
    })
  );
};

exports.deleteFiles = async (urls = []) => {
  if (typeof urls === "string") {
    urls = [urls];
  }
  return Promise.all(
    urls.map((url) =>
      S3.send(
        new DeleteObjectCommand({
          Bucket: "zamzam",
          Key: url.replace(process.env.CLOUDFLARE_S3_PUBLIC_URL, ""),
        })
      )
    )
  )
    .then((res) => {
      //
    })
    .catch((err) => console.log("files delete err", err));
};

exports.S3 = S3;
