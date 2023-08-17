const multer = require("multer");
const multerS3 = require("multer-s3");
const {
  appConfig: { responseFn, responseStr, ...appConfig },
} = require("../config");
const cdnHelper = require("../helpers/cdn.helper");
const { ObjectId } = require("mongodb");

const getPath = (file) => `${process.env.CLOUDFLARE_S3_PUBLIC_URL}${file.key}`;

const upload = (fields, pathname, options) => {
  let upload = multer({
    storage: multerS3({
      s3: cdnHelper.S3,
      bucket: "zamzam",
      metadata: function (req, file, cb) {
        cb(null, {
          uploadedBy: req.authUser?._id?.toString() || null,
          originalName: file.originalname,
          mimetype: file.mimetype,
          fieldName: file.fieldname,
        });
      },
      key: function (req, file, cb) {
        cb(
          null,
          `${
            pathname ? pathname + "/" : ""
          }${ObjectId()}.${file.mimetype.replace(/.*\//, "")}`
        );
      },
    }),
    limits: { fileSize: (options?.fileSize || 10) * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (options?.fileTypes) {
        if (options.fileTypes.test(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            responseStr.unsupported_file_type.replace(
              "{fileTypes}",
              `${options.fileTypes}`.replace(/\/|\//g, "").split("|").join(", ")
            ),
            false
          );
        }
      } else {
        cb(null, true);
      }
    },
  });

  upload = upload.fields(Array.isArray(fields) ? fields : [fields]);

  return (req, res, next) => {
    upload(req, res, async (err) => {
      // grab the file
      // const files = (Object.values(req.files).flat() || []).map((item) => ({
      //   ...item,
      //   url: `${process.env.CLOUDFLARE_S3_PUBLIC_URL}${item.key}`,
      // }));

      // console.log("files=>", files);

      if (Object.entries(req.files || {}).length) {
        Object.entries(req.files).forEach(([fieldname, files]) => {
          files.forEach((file) => {
            const multiple =
              fields.length &&
              fields.find((item) => item.name === fieldname).multiple;
            if (fieldname.includes(".")) {
              fieldname.split(".").reduce((p, c, i, arr) => {
                if (i < arr.length - 1) {
                  p[c] = { ...p[c] };
                } else {
                  p[c] = multiple
                    ? [
                        ...(req.body[fieldname] || []),
                        ...(p[c] || []),
                        getPath(file),
                      ]
                    : getPath(file);
                }
                return p[c];
              }, req.body);
            } else {
              req.body[fieldname] = multiple
                ? [...(req.body[fieldname] || []), getPath(file)]
                : getPath(file);
            }
          });

          if (fieldname.includes(".")) {
            delete req.body[fieldname];
          }
        });
      }

      Object.entries(req.body).forEach(([key, value]) => {
        if (typeof value === "string" && value.isJSON()) {
          req.body[key] = JSON.parse(value);
        }
      });

      Object.entries(req.body).forEach(([key, value]) => {
        if (key.includes(".")) {
          const multiple =
            fields.length && fields.find((item) => item.name === key)?.multiple;
          key.split(".").reduce((p, c, i, arr) => {
            if (i < arr.length - 1) {
              p[c] = { ...p[c] };
            } else {
              p[c] = multiple && typeof value === "string" ? [value] : value;
            }
            return p[c];
          }, req.body);

          delete req.body[key];
        }
      });

      next();
    });
  };
};

module.exports = { upload };
