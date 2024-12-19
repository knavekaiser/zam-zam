const {
  appConfig: { responseFn },
} = require("../config");
const { cdnHelper } = require("../helpers");

exports.validate = (schema) => async (req, res, next) => {
  try {
    const values = await schema.validate({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    req.body = values.body;
    req.query = values.query;
    req.params = values.params;

    return next();
  } catch (err) {
    if (req.files?.length) {
      await cdnHelper.deleteFiles(req.files.map((file) => file.key));
    }
    return responseFn.error(res, {}, err.message, 400);
  }
};
