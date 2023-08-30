import { useState, useEffect, useContext, useCallback } from "react";
import { Modal, Prompt } from "Components/modal";
import s from "./home.module.scss";
import { useFetch } from "hooks";
import { endpoints } from "config";
import { SiteContext } from "@/SiteContext";
import { BsList } from "react-icons/bs";
import { Trans, useTranslation } from "react-i18next";
import { CommentForm } from "./Form";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaRegComment, FaRegTrashAlt } from "react-icons/fa";
import Carousel from "Components/elements/corousel";
import { Moment, TimeElapsed } from "Components/elements";
import Menu from "Components/elements/menu";
import { BiEditAlt } from "react-icons/bi";

const Comments = ({ post_id, setPosts }) => {
  const [metadata, setMetadata] = useState(false);
  const [comments, setComments] = useState([]);

  const { get: fetchComments, loading } = useFetch(
    endpoints.feedComments.replace("post_id", post_id)
  );

  const getComments = useCallback((metadata = {}) => {
    fetchComments({
      query: { page: metadata.page || 1, pageSize: metadata.pageSize || 5 },
    })
      .then(({ data }) => {
        if (!data.success) {
          return Prompt({ type: "error", message: data.message });
        }
        setMetadata(data.metadata);
        setComments((prev) => [...prev, ...data.data]);
      })
      .catch((err) => {
        console.log(err);
        Prompt({ type: "error", message: err.message });
      });
  }, []);

  useEffect(() => {
    getComments();
  }, []);
  return (
    <div className={`${s.comments} grid`}>
      <CommentForm
        parent_type="post"
        parent_id={post_id}
        onSuccess={(newComm) => {
          setComments((prev) => [newComm, ...prev]);
          setPosts((prev) =>
            prev.map((p) =>
              p._id === post_id
                ? {
                    ...p,
                    totalComments: (p.totalComments || 0) + 1,
                    selfComment: true,
                  }
                : p
            )
          );
        }}
      />

      {loading && (
        <>
          <div className={`${s.comments} ${s.loading}`}>
            <div className={s.milestoneInfoWrapper}>
              <div className={s.milestoneInfo}>
                <div className={s.left}>
                  <h4 className="skl-loading" />
                  <p className={`skl-loading`} />
                  <p className={`skl-loading`} />
                </div>
                <div className={s.right}>
                  <div className={`${s.money} skl-loading`} />
                  <p className={`skl-loading`} />
                </div>
              </div>
            </div>

            <p className={`${s.progress} skl-loading`} />
          </div>
          <div className={`${s.card} ${s.loading}`}>
            <label className="skl-loading" />
            <p className={`${s.amount} skl-loading`} />
          </div>
          <div className={`${s.card} ${s.loading}`}>
            <label className="skl-loading" />
            <p className={`${s.amount} skl-loading`} />
          </div>
          <div className={`${s.card} ${s.loading}`}>
            <label className="skl-loading" />
            <p className={`${s.amount} skl-loading`} />
          </div>
          <div className={`${s.card} ${s.loading}`}>
            <label className="skl-loading" />
            <p className={`${s.amount} skl-loading`} />
          </div>
        </>
      )}

      {comments.map((comm) => (
        <Comment key={comm._id} comment={comm} setComments={setComments} />
      ))}

      {metadata.total > metadata.page * metadata.pageSize && (
        <div className={s.loadMore}>
          <button
            className="btn clear"
            onClick={() => {
              getComments({
                pageSize: metadata?.pageSize,
                page: (metadata?.page || 0) + 1,
              });
            }}
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
};

const Comment = ({ comment, setComments }) => {
  const [edit, setEdit] = useState(false);
  const [replies, setReplies] = useState([]);
  const [actions, setActions] = useState([]);
  const [update, setUpdate] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const { user } = useContext(SiteContext);
  const {
    put: updateComment,
    remove: deleteComment,
    loading: updatingComment,
  } = useFetch(
    endpoints.feedComments.replace(
      "post_id",
      comment.parent?._id || comment.parent
    ) +
      "/" +
      comment._id
  );
  const { post: likeComment, loading } = useFetch(
    endpoints.likePost.replace("_id", comment._id)
  );
  const { post: unlikeComment, loading: loading2 } = useFetch(
    endpoints.unlikePost.replace("_id", comment._id)
  );
  const likeHandler = useCallback(() => {
    if (comment.likes?.includes(user._id)) {
      unlikeComment().then(({ data }) => {
        if (!data.success) {
          return Prompt({ type: "error", message: data.message });
        }
        setReplies((prev) =>
          prev.map((p) =>
            p._id === comment._id ? { ...p, likes: data.data.likes } : p
          )
        );
      });
    } else {
      likeComment().then(({ data }) => {
        if (!data.success) {
          return Prompt({ type: "error", message: data.message });
        }
        setReplies((prev) =>
          prev.map((p) =>
            p._id === comment._id ? { ...p, likes: data.data.likes } : p
          )
        );
      });
    }
  }, [comment]);

  useEffect(() => {
    const actions = [
      // {
      //   icon: <BiEditAlt />,
      //   label: "Share",
      //   disabled: sharePost,
      //   onClick: () => {},
      // },
    ];
    if (comment.user?._id === user._id) {
      actions.push(
        ...[
          {
            icon: <BiEditAlt />,
            label: "Edit",
            disabled: updatingComment,
            onClick: () => setEdit(true),
          },
          {
            icon: <FaRegTrashAlt />,
            label: "Delete Comment",
            disabled: updatingComment,
            onClick: () => {
              Prompt({
                type: "confirmation",
                message: "Are you sure you want to delete this comment?",
                callback: () =>
                  deleteComment()
                    .then(({ data }) => {
                      if (!data.success) {
                        return Prompt({ type: "error", message: data.message });
                      }
                      setReplies((prev) =>
                        prev.filter((p) => p._id !== comment._id)
                      );
                    })
                    .catch((err) =>
                      Prompt({ type: "error", message: err.message })
                    ),
              });
            },
          },
        ]
      );
    }
    if (actions.length) {
      setActions(actions);
    }
  }, [comment]);

  if (edit) {
    return (
      <CommentForm
        edit={comment}
        onSuccess={(newComment) => {
          setComments((prev) =>
            prev.map((comm) => (comm._id === comment._id ? newComment : comm))
          );
          setEdit(false);
        }}
      />
    );
  }
  return (
    <div className={s.comment}>
      <div
        className={`${s.user} ${comment.userType === "staff" ? s.staff : ""}`}
      >
        <img
          src={comment.user?.photo || "/asst/avatar.webp"}
          alt={`User Photo - ${comment.user?.name}`}
        />
      </div>
      <div className={s.commentContentWrapper}>
        <div className={s.commentContent}>
          {actions.length > 0 && <Menu className={s.menu} options={actions} />}
          <div className={s.userDetail}>
            <span className={s.name}>{comment.user?.name}</span>
          </div>
          {comment.content?.text && (
            <div className={s.textContent}>
              <p>{comment.content.text}</p>
            </div>
          )}
          {comment.content?.media?.length > 0 && (
            <Carousel>
              {comment.content.media.map((item) => {
                if (item.mimetype.startsWith("image")) {
                  return <img key={item._id} src={item.url} />;
                }
                return null;
              })}
            </Carousel>
          )}

          <div className={s.actions}>
            {/* <button
       className={`btn clear`}
       onClick={likeHandler}
       disabled={loading || loading2}
     >
       {comment.likes?.length > 0 && (
         <span className={s.count}>{comment.likes.length}</span>
       )}
       <span className={s.label}>Like</span>
     </button>
     <button
       className={`btn clear`}
       onClick={() => setShowCommentForm(!showCommentForm)}
     >
       <span className={s.label}>Reply</span>
     </button> */}
            <button className={`btn clear`}>
              <span className={s.label}>
                <TimeElapsed time={comment.createdAt} />
              </span>
            </button>
          </div>
        </div>

        {showCommentForm && (
          <>
            <div className={s.commentFormWrapper}>
              <div
                className={`${s.user} ${
                  user.userType === "staff" ? s.staff : ""
                }`}
              >
                <img
                  src={user?.photo || "/asst/avatar.webp"}
                  alt={`User Photo - ${user?.name}`}
                />
              </div>
              <CommentForm
                parent_type="comment"
                parent_id={comment._id}
                onSuccess={(newPost) => {
                  setUpdate(false);
                  setReplies((prev) =>
                    prev.map((p) => (p._id === newPost._id ? newPost : p))
                  );
                }}
              />
            </div>
            {replies.map((comment) => (
              <Comment
                key={comment._id}
                comment={comment}
                setComments={setReplies}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Comments;
