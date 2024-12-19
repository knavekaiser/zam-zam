const { cdnHelper } = require("../helpers/index.js");
const { ObjectId } = require("mongodb");
const path = require("path");
const multer = require("multer");
const { responseFn, responseStr } = require("../config/app.config.js");
const { appConfig } = require("../config/index.js");

const initMulter = (fields) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: (appConfig.supportedFileSizes || 10) * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const field = fields.find((field) => field.name === file.fieldname);
      if (
        (field.mimetype || appConfig.supportedFileTypes).test(file.mimetype)
      ) {
        cb(null, true);
      } else {
        cb(
          responseStr.unsupported_file_type.replace(
            "{fileTypes}",
            `${appConfig.supportedFileTypes}`
              .replace(/\/|\//g, "")
              .split("|")
              .join(", ")
          ),
          false
        );
      }
    },
    filename: (req, file, cb) => {
      const field = fields.find((field) => field.name === file.name);
      const ext = path.extname(file.name);
      cb(null, `${field.pathname}${new ObjectId()}${ext}`);
    },
  });

const uploadHandler = async (fields, req) => {
  let response = [];

  const rawFiles = [];
  const files = await Promise.all(
    fields
      .map((field) => {
        if (field.raw) {
          rawFiles.push({
            field: field.name,
            ...(field.multiple
              ? { files: req.files[field.name] }
              : { file: req.files[field.name]?.[0] }),
          });
          return;
        }
        if (field.name in req.body) {
          const value = req.body[field.name];
          if (!value || value === "null") {
            req.body[field.name] = field.multiple ? [] : null;
          } else if (typeof value === "string") {
            req.files[field.name] = JSON.parse(value);
            if (!Array.isArray(req.files[field.name])) {
              req.files[field.name] = [req.files[field.name]];
            }
            delete req.body[field.name];
          }
        }

        if (!(field.name in (req.files || {}))) return null;
        const files = (req.files[field.name] || []).filter(
          (file) => file && file.buffer
        );
        const existingFiles = (req.files[field.name] || []).filter(
          (file) => file && file.url
        );

        if (existingFiles.length) {
          if (field.multiple) {
            req.body[field.name] =
              field.store === "keyOnly"
                ? existingFiles.map((file) => file.url)
                : existingFiles;
          } else {
            req.body[field.name] =
              field.store === "keyOnly"
                ? existingFiles[0].url
                : existingFiles[0];
          }
        } else {
          if (field.multiple) {
            req.body[field.name] = [];
          } else {
            req.body[field.name] = null;
          }
        }
        if (!files?.length) return null;

        return files.map(async (file) => {
          const ext = path.extname(file.originalname);
          return {
            metadata: {
              field: field.name,
              size: file.size,
              originalName: file.originalname,
              mime: file.mimetype || file.type,
            },
            key: `${field.pathname}${new ObjectId()}${ext}`,
            buffer: file.buffer,
          };
        });
      })
      .filter((x) => x)
      .flat()
  ).catch((err) => {
    throw err;
  });

  response = await cdnHelper.uploadFiles(files);
  req.files = [...response, ...rawFiles];

  response.forEach((file, i) => {
    const field = fields.find((item) => item.name === file.field);
    const final =
      field.store === "keyOnly"
        ? file.key
        : {
            url: file.key,
            mime: file.mime,
            size: file.size,
            name: file.originalName,
            ...(file.dimensions && { dimensions: file.dimensions }),
          };

    if (!field.multiple) {
      req.body[field.name] = final;
      return;
    }

    if (req.body[field.name]) {
      if (Array.isArray(req.body[field.name])) {
        req.body[field.name] = [...req.body[field.name], final];
      } else {
        req.body[field.name] = [req.body[field.name], final];
      }
    } else {
      req.body[field.name] = final;
    }
  });

  return req;
};

exports.upload = (fields) => {
  let upload = initMulter(fields);

  upload = upload.fields(
    fields.map((f) => ({ name: f.name, maxCount: f.maxCount || 1 }))
  );

  return (req, res, next) => {
    return upload(req, res, async (err) => {
      if (err) {
        return responseFn.error(res, {}, err, 400);
      }

      await uploadHandler(fields, req)
        .then((req) => {
          if (req.body.json) {
            req.body = { ...req.body, ...JSON.parse(req.body.json) };
            delete req.body.json;
          }
          return next();
        })
        .catch((err) => {
          return responseFn.error(res, {}, err.message, 400);
        });
    });
  };
};
