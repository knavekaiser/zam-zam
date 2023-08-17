const multer = require("multer");
const {
  appConfig: { responseFn, responseStr, ...appConfig },
} = require("../config");
const fs = require("fs");
const path = require("path");

const uploadDir = __dirname.replace(/(\\|\/)app.*/, "") + appConfig.uploadDir;
const getPath = (str) =>
  str
    .replace(/\\/g, "/")
    .replace(new RegExp(`.*(?=${appConfig.uploadDir})`, "gi"), "");

const upload = (fields, uploadPath, options) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      Object.entries(req.body).forEach(([key, value]) => {
        if (typeof value === "string" && value.isJSON()) {
          req.body[key] = JSON.parse(value);
        }
      });
      cb(null, uploadDir + uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const multiple =
        fields.length &&
        fields.find((item) => item.name === file.fieldname)?.multiple;
      const fileName = `${
        req.authUser?._id ? req.authUser?._id + "_" : ""
      }${Date.now()}_${file.fieldname}${
        multiple ? `_${Math.random().toString(36).substr(-8)}_` : ""
      }${ext}`;

      cb(null, fileName);
    },
  });
  let upload = multer({
    storage,
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
    upload(req, res, (err) => {
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
                        getPath(file.path),
                      ]
                    : getPath(file.path);
                }
                return p[c];
              }, req.body);
            } else {
              req.body[fieldname] = multiple
                ? [...(req.body[fieldname] || []), getPath(file.path)]
                : getPath(file.path);
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

      if (err) {
        if (err.code === "LIMIT_FILE_SIZE")
          return responseFn.error(
            res,
            {},
            responseStr.file_too_large.replace(
              "{maxSize}",
              `${options.fileSize || 10}MB`
            )
          );
        return responseFn.error(res, {}, err?.message || err);
      }
      next();
    });
  };
};

const removeFiles = async (req, res, next) => {
  const { Model, collection } = req;

  const fileFields = collection.fields
    .filter((field) => field.inputType === "file")
    .map((item) => item.name);
  const records = await Model.find(
    { _id: { $in: [...(req.body.ids || []), req.params.id] } },
    fileFields.join(" ")
  );
  const links = [];
  records.forEach((record) => {
    fileFields.forEach((field) => {
      if (record[field]?.length > 0)
        if (typeof record[field] === "string") {
          links.push(
            uploadDir + record[field].replace(appConfig.uploadDir, "")
          );
        } else {
          links.push(
            ...record[field].map(
              (link) => uploadDir + link.replace(appConfig.uploadDir, "")
            )
          );
        }
    });
  });

  links.forEach((link) => {
    fs.unlink(link, () => {
      // store reminder to remove the files later
    });
  });

  next();
};

module.exports = { upload, removeFiles };
