const yup = require("yup");

module.exports = {
  addPost: yup.object({
    body: yup.object({
      text: yup
        .string()
        .required()
        .max(250, "Content must be less or equal to 250"),
    }),
  }),
  postComment: yup.object({
    params: yup.object({
      parent_id: yup
        .string()
        .objectId()
        .test("checkParent", "Parent is not found.", function (v, schema) {
          console.log(v, this);
          return schema;
        }),
    }),
    body: yup.object({
      parentType: yup.string().oneOf(["post", "comment"]).required(),
      text: yup
        .string()
        .required()
        .max(250, "Content must be less or equal to 250"),
    }),
  }),
};
