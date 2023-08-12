const {
  appConfig: { responseFn, responseStr },
} = require("../config");

const { Role } = require("../models");

exports.findAll = async (req, res) => {
  try {
    const conditions = {};
    if ("name" in req.query) {
      conditions.name = {
        $regex: req.query.name,
        $options: "i",
      };
    }
    Role.find(conditions)
      .then((data) => responseFn.success(res, { data }))
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.create = async (req, res) => {
  try {
    new Role({ ...req.body })
      .save()
      .then(async (data) => responseFn.success(res, { data }))
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.update = async (req, res) => {
  try {
    Role.findOneAndUpdate({ _id: req.params._id }, req.body, { new: true })
      .then((data) => {
        responseFn.success(res, { data }, responseStr.record_updated);
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.delete = async (req, res) => {
  try {
    if (!req.params._id && !req.body.ids?.length) {
      return responseFn.error(res, {}, responseStr.select_atleast_one_record);
    }
    Role.deleteMany({ _id: { $in: [...(req.body.ids || []), req.params._id] } })
      .then((num) => responseFn.success(res, {}, responseStr.record_deleted))
      .catch((err) => responseFn.error(res, {}, err.message, 500));
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.getPermissions = async (req, res) => {
  try {
    const basicGroups = [
      { label: "Income", name: "income" },
      { label: "Expense", name: "expense" },
      { label: "Deposit", name: "deposit" },
      { label: "Withdrawal", name: "withdrawal" },
      { label: "Member", name: "member" },
      { label: "Staff", name: "staff" },
      { label: "Role", name: "role" },
      { label: "Milestone", name: "milestone" },
    ];
    const groups = [
      ...basicGroups.map((group) => ({
        ...group,
        permissions: [
          { label: `View`, value: `${group.name}_read` },
          ...(!["member"].includes(group.name)
            ? [{ label: `Add`, value: `${group.name}_create` }]
            : []),
          ...(["member"].includes(group.name)
            ? [{ label: `Send SMS`, value: `${group.name}_send_sms` }]
            : []),
          { label: `Update`, value: `${group.name}_update` },
          ...(!["role", "milestone"].includes(group.name)
            ? [{ label: `Approve`, value: `${group.name}_approve` }]
            : []),
          ...(["deposit", "expense", "withdrawal"].includes(group.name)
            ? [
                {
                  label: `Request Delete`,
                  value: `${group.name}_request_delete`,
                },
              ]
            : []),
          { label: `Delete`, value: `${group.name}_delete` },
        ],
      })),
    ];

    return responseFn.success(res, { data: groups });
  } catch (error) {
    return responseFn.error(res, {}, error.message, 500);
  }
};
