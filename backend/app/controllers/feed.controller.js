const {
  appConfig: { responseFn, responseStr },
} = require("../config");
const { ObjectId } = require("mongodb");
const { appHelper, fileHelper, cdnHelper } = require("../helpers");

const {
  Deposit,
  Expense,
  Withdrawal,
  Device,
  Milestone,
  Member,
  BugReport,
  Income,
  FeedPost,
  Comment,
} = require("../models");

exports.getFeed = async (req, res) => {
  try {
    let { page, pageSize } = req.query;
    page = +page || 1;
    pageSize = 10;

    FeedPost.aggregate([
      { $match: {} },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "staffs",
          localField: "user",
          foreignField: "_id",
          as: "staffDetail",
        },
      },
      {
        $lookup: {
          from: "members",
          localField: "user",
          foreignField: "_id",
          as: "memberDetail",
        },
      },
      {
        $addFields: {
          user: {
            $cond: {
              if: {
                $eq: ["$userType", "staff"],
              },
              then: {
                _id: { $first: "$staffDetail._id" },
                name: { $first: "$staffDetail.name" },
                phone: { $first: "$staffDetail.phone" },
                email: { $first: "$staffDetail.email" },
                photo: { $first: "$staffDetail.photo" },
              },
              else: {
                _id: { $first: "$memberDetail._id" },
                name: { $first: "$memberDetail.name" },
                phone: { $first: "$memberDetail.phone" },
                email: { $first: "$memberDetail.email" },
                photo: { $first: "$memberDetail.photo" },
              },
            },
          },
        },
      },
      {
        $unset: ["staffDetail", "memberDetail"],
      },
      {
        $lookup: {
          from: "comments",
          let: {
            id: "$_id",
          },
          as: "totalComments",
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$parent", "$$id"],
                },
              },
            },
          ],
        },
      },
      {
        $set: {
          totalComments: {
            $size: "$totalComments",
          },
          selfComment: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$totalComments",
                    cond: {
                      $eq: ["$$this.user", req.authUser._id],
                    },
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $facet: {
          records: [{ $skip: pageSize * (page - 1) }, { $limit: pageSize }],
          metadata: [{ $group: { _id: null, total: { $sum: 1 } } }],
        },
      },
    ])
      .then(([{ records, metadata }]) => {
        return responseFn.success(res, {
          data: records,
          metadata: { page, pageSize, total: metadata[0]?.total || 0 },
        });
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    console.log(error);
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.post = async (req, res) => {
  try {
    new FeedPost({
      user: req.authUser._id,
      userType: req.authToken.userType,
      content: {
        text: req.body.text,
        media: req.files.media?.map((file) => ({
          name: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: file.url,
        })),
      },
      likes: [],
    })
      .save()
      .then(async (data) => {
        // send notifications here
        const newPost = await FeedPost.aggregate([
          { $match: { _id: data._id } },
          {
            $lookup: {
              from: "staffs",
              localField: "user",
              foreignField: "_id",
              as: "staffDetail",
            },
          },
          {
            $lookup: {
              from: "members",
              localField: "user",
              foreignField: "_id",
              as: "memberDetail",
            },
          },
          {
            $addFields: {
              user: {
                $cond: {
                  if: {
                    $eq: ["$userType", "staff"],
                  },
                  then: {
                    _id: { $first: "$staffDetail._id" },
                    name: { $first: "$staffDetail.name" },
                    phone: { $first: "$staffDetail.phone" },
                    email: { $first: "$staffDetail.email" },
                    photo: { $first: "$staffDetail.photo" },
                  },
                  else: {
                    _id: { $first: "$memberDetail._id" },
                    name: { $first: "$memberDetail.name" },
                    phone: { $first: "$memberDetail.phone" },
                    email: { $first: "$memberDetail.email" },
                    photo: { $first: "$memberDetail.photo" },
                  },
                },
              },
            },
          },
          { $unset: ["staffDetail", "memberDetail"] },
        ]);
        responseFn.success(
          res,
          {
            data: { ...newPost[0], totalComments: 0, selfComment: false },
          },
          responseStr.success
        );
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (err) {
    console.log(err);
    responseFn.error(res, {}, err.message);
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await FeedPost.findOne({
      _id: req.params._id,
      user: req.authUser._id,
    });
    const updates = { content: {} };

    console.log(req.body);
    if (req.body.text) {
      updates.content.text = req.body.text;
    }

    // return responseFn.error(res, {}, "test");

    FeedPost.findOneAndUpdate(
      { _id: req.params._id, user: req.authUser._id },
      updates,
      { new: true }
    )
      .then((newPost) => {
        // send notifications here
        responseFn.success(res, { data: newPost }, responseStr.success);
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (err) {
    console.log(err);
    responseFn.error(res, {}, err.message);
  }
};

exports.likePost = async (req, res) => {
  try {
    FeedPost.findOneAndUpdate(
      { _id: req.params._id },
      {
        $addToSet: { likes: req.authUser._id },
        // $push: {
        //   likes: {
        //     $each: [req.authUser._id],
        //     $position: 0,
        //   },
        // },
      },
      { new: true }
    )
      .then((post) => {
        responseFn.success(
          res,
          { data: { likes: post.likes } },
          responseStr.success
        );
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (err) {
    responseFn.error(res, {}, err.message);
  }
};

exports.unlikePost = async (req, res) => {
  try {
    FeedPost.findOneAndUpdate(
      { _id: req.params._id },
      { $pull: { likes: req.authUser._id } },
      { new: true }
    )
      .then((post) => {
        responseFn.success(
          res,
          { data: { likes: post.likes } },
          responseStr.success
        );
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (err) {
    responseFn.error(res, {}, err.message);
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await FeedPost.findOne({
      _id: req.params._id,
      user: req.authUser._id,
    });

    FeedPost.deleteOne({ _id: req.params._id, user: req.authUser._id })
      .then((data) => {
        if (data.deletedCount > 0) {
          responseFn.success(res, {}, responseStr.record_deleted);
          if (post?.content?.media?.length) {
            cdnHelper.deleteFiles(post.content.media.map((item) => item.url));
          }
        } else {
          responseFn.error(res, {}, responseStr.record_not_deleted);
        }
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (err) {
    responseFn.error(res, {}, err.message);
  }
};

exports.getComments = async (req, res) => {
  try {
    let { page, pageSize } = req.query;
    page = +page || 1;
    pageSize = 5;

    Comment.aggregate([
      { $match: { parent: ObjectId(req.params.parent_id) } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "staffs",
          localField: "user",
          foreignField: "_id",
          as: "staffDetail",
        },
      },
      {
        $lookup: {
          from: "members",
          localField: "user",
          foreignField: "_id",
          as: "memberDetail",
        },
      },
      {
        $addFields: {
          user: {
            $cond: {
              if: { $eq: ["$userType", "staff"] },
              then: {
                _id: { $first: "$staffDetail._id" },
                name: { $first: "$staffDetail.name" },
                phone: { $first: "$staffDetail.phone" },
                email: { $first: "$staffDetail.email" },
                photo: { $first: "$staffDetail.photo" },
              },
              else: {
                _id: { $first: "$memberDetail._id" },
                name: { $first: "$memberDetail.name" },
                phone: { $first: "$memberDetail.phone" },
                email: { $first: "$memberDetail.email" },
                photo: { $first: "$memberDetail.photo" },
              },
            },
          },
        },
      },
      { $unset: ["staffDetail", "memberDetail"] },
      {
        $facet: {
          records: [{ $skip: pageSize * (page - 1) }, { $limit: pageSize }],
          metadata: [{ $group: { _id: null, total: { $sum: 1 } } }],
        },
      },
    ])
      .then(([{ records, metadata }]) => {
        return responseFn.success(res, {
          data: records,
          metadata: { page, pageSize, total: metadata[0]?.total || 0 },
        });
      })
      .catch((err) => responseFn.error(res, {}, err.message));
  } catch (error) {
    console.log(error);
    return responseFn.error(res, {}, error.message, 500);
  }
};

exports.postComment = async (req, res) => {
  try {
    new Comment({
      content: { text: req.body.text },
      parent: req.params.parent_id,
      parentType: req.body.parentType,
      user: req.authUser._id,
      userType: req.authToken.userType,
    })
      .save()
      .then(async (data) => {
        const comment = await Comment.aggregate([
          { $match: { _id: data._id } },
          {
            $lookup: {
              from: "staffs",
              localField: "user",
              foreignField: "_id",
              as: "staffDetail",
            },
          },
          {
            $lookup: {
              from: "members",
              localField: "user",
              foreignField: "_id",
              as: "memberDetail",
            },
          },
          {
            $addFields: {
              user: {
                $cond: {
                  if: { $eq: ["$userType", "staff"] },
                  then: {
                    _id: { $first: "$staffDetail._id" },
                    name: { $first: "$staffDetail.name" },
                    phone: { $first: "$staffDetail.phone" },
                    email: { $first: "$staffDetail.email" },
                    photo: { $first: "$staffDetail.photo" },
                  },
                  else: {
                    _id: { $first: "$memberDetail._id" },
                    name: { $first: "$memberDetail.name" },
                    phone: { $first: "$memberDetail.phone" },
                    email: { $first: "$memberDetail.email" },
                    photo: { $first: "$memberDetail.photo" },
                  },
                },
              },
            },
          },
          { $unset: ["staffDetail", "memberDetail"] },
        ]);
        return responseFn.success(
          res,
          { data: comment[0] },
          responseStr.success
        );
      })
      .catch((err) => responseFn.error(res, {}, err.message, 500));
  } catch (error) {
    console.log(error);
    return responseFn.error(res, {}, error.message, 500);
  }
};
