import { phone } from "phone";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import * as yup from "yup";

export const findProperties = function (prop, obj) {
  const arr = [];
  const findProperties = (obj, parent) => {
    for (var key in obj) {
      if (key === prop) {
        arr.push({
          prop: key,
          value: obj[key],
          path: `${parent ? parent + "." : ""}${prop}`.split("."),
        });
      } else if (obj[key] && typeof obj[key] === "object") {
        findProperties(obj[key], `${parent ? parent + "." : ""}${key}`);
      }
    }
  };
  findProperties(obj);
  return arr;
};

export const toCSV = (columns, data) => {
  // columns = ["Account Number", "Name"],
  // data = [["1234", "Angela f"], ["5421", "John B"]]

  let headers = columns.map((item) => `"${item}"`).join(",");
  let body = data
    .map((row) => row.map((item) => `"${item}"`).join(","))
    .join("\r\n");

  return "data:text/csv;charset=utf-8," + headers + "\r\n" + body;
};

export const fingerprint = () =>
  new Promise((res, rej) => {
    FingerprintJS.load().then((fp) => {
      console.log();
      fp.get()
        .then((result) => {
          if ("visitorId" in result) {
            res(result.visitorId);
          }
        })
        .catch((err) => rej(err));
    });
  });

yup.addMethod(
  yup.string,
  "phn",
  function (options, message = "Please enter a valid number") {
    return this.test("phone", "Please enter a valid number", function (value) {
      const { path, createError } = this;
      return (
        !value ||
        phone(value, options || {})?.isValid ||
        createError({
          path,
          message,
        })
      );
    });
  }
);
