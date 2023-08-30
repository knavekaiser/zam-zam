import { useState, useEffect, useContext, useCallback } from "react";
import { Modal, Prompt } from "Components/modal";
import s from "./home.module.scss";
import { useFetch } from "hooks";
import { endpoints } from "config";
import { SiteContext } from "@/SiteContext";
import { BsList } from "react-icons/bs";
import { Trans, useTranslation } from "react-i18next";
import { PostForm } from "./Form";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaCommentAlt, FaRegCommentAlt, FaRegTrashAlt } from "react-icons/fa";
import Carousel from "Components/elements/corousel";
import { Moment } from "Components/elements";
import Menu from "Components/elements/menu";
import { BiEditAlt } from "react-icons/bi";
import Comments from "./comments";
import { motion, useScroll } from "framer-motion";

const Dashboard = ({ setSidebarOpen }) => {
  const [metadata, setMetadata] = useState(null);
  const [posts, setPosts] = useState([]);

  const { get: fetchFeed, loading } = useFetch(endpoints.feed);

  const getFeed = useCallback((metadata = {}) => {
    fetchFeed({
      query: { page: metadata.page || 1, pageSize: metadata.pageSize || 10 },
    })
      .then(({ data }) => {
        if (!data.success) {
          return Prompt({ type: "error", message: data.message });
        }
        setMetadata(data.metadata);
        return setPosts((prev) => [...prev, ...data.data]);
      })
      .catch((err) => {
        console.log(err);
        Prompt({ type: "error", message: err.message });
      });
  }, []);

  useEffect(() => {
    getFeed();
  }, []);
  return (
    <div className={`${s.contentWrapper} grid`}>
      <div
        className={`${s.head} flex all-columns justify-space-between align-center`}
      >
        <div
          className="flex align-center ml-1 pointer"
          onClick={() => setSidebarOpen((prev) => !prev)}
        >
          <BsList style={{ fontSize: "1.75rem" }} />
          <h2>
            <Trans>Latest</Trans>
          </h2>
        </div>
      </div>
      <div
        className={s.content}
        onScroll={(e) => {
          const { scrollTop, clientHeight, scrollHeight } = e.target;
          if (
            scrollHeight - scrollTop === clientHeight &&
            !loading &&
            metadata?.total > (metadata?.page || 1) * (metadata?.pageSize || 10)
          ) {
            getFeed({
              page: (metadata?.page || 0) + 1,
              pageSize: metadata?.pageSize || 10,
            });
          }
        }}
      >
        <PostForm
          onSuccess={(newPost) => setPosts((prev) => [newPost, ...prev])}
        />

        {loading && (
          <>
            <div className={`${s.milestones} ${s.loading}`}>
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

        {posts.map((post) => (
          <Card key={post._id} post={post} setPosts={setPosts} />
        ))}
      </div>
    </div>
  );
};

const Card = ({ post, setPosts }) => {
  const [actions, setActions] = useState([]);
  const [update, setUpdate] = useState(false);
  const [showCommments, setShowComments] = useState(false);
  const { user } = useContext(SiteContext);
  const {
    put: updatePost,
    remove: deletePost,
    loading: updatingPost,
  } = useFetch(endpoints.feed + "/" + post._id);
  const { post: likePost, loading } = useFetch(
    endpoints.likePost.replace("_id", post._id)
  );
  const { post: unlikePost, loading: loading2 } = useFetch(
    endpoints.unlikePost.replace("_id", post._id)
  );
  const likeHandler = useCallback(() => {
    if (post.likes?.includes(user._id)) {
      unlikePost().then(({ data }) => {
        if (!data.success) {
          return Prompt({ type: "error", message: data.message });
        }
        setPosts((prev) =>
          prev.map((p) =>
            p._id === post._id ? { ...p, likes: data.data.likes } : p
          )
        );
      });
    } else {
      likePost().then(({ data }) => {
        if (!data.success) {
          return Prompt({ type: "error", message: data.message });
        }
        setPosts((prev) =>
          prev.map((p) =>
            p._id === post._id ? { ...p, likes: data.data.likes } : p
          )
        );
      });
    }
  }, [post]);

  useEffect(() => {
    const actions = [
      // {
      //   icon: <BiEditAlt />,
      //   label: "Share",
      //   disabled: sharePost,
      //   onClick: () => {},
      // },
    ];
    if (post.user?._id === user._id) {
      actions.push(
        ...[
          {
            icon: <BiEditAlt />,
            label: "Edit",
            disabled: updatingPost,
            onClick: () => setUpdate(true),
          },
          {
            icon: <FaRegTrashAlt />,
            label: "Delete Post",
            disabled: updatingPost,
            onClick: () => {
              Prompt({
                type: "confirmation",
                message: "Are you sure you want to delete this post?",
                callback: () =>
                  deletePost()
                    .then(({ data }) => {
                      if (!data.success) {
                        return Prompt({ type: "error", message: data.message });
                      }
                      setPosts((prev) =>
                        prev.filter((p) => p._id !== post._id)
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
  }, [post]);
  return (
    <div className={s.card}>
      {actions.length > 0 && <Menu className={s.menu} options={actions} />}
      <div className={`${s.user} ${post.userType === "staff" ? s.staff : ""}`}>
        <img
          src={post.user?.photo || "/asst/avatar.webp"}
          alt={`User Photo - ${post.user?.name}`}
        />
        <div className={s.detail}>
          <span className={s.name}>{post.user?.name}</span>
          <Moment className={s.time} format="MMM dd, yy">
            {post.createdAt}
          </Moment>
        </div>
      </div>
      <div className={s.postContent}>
        {post.content?.text && (
          <div className={s.textContent}>
            <p>{post.content.text}</p>
          </div>
        )}
        {post.content?.media?.length > 0 && (
          <Carousel>
            {post.content.media.map((item) => {
              if (item.mimetype.startsWith("image")) {
                return <img key={item._id} src={item.url} />;
              }
              return null;
            })}
          </Carousel>
        )}
      </div>
      <div className={s.actions}>
        <button
          className={`btn clear`}
          onClick={likeHandler}
          disabled={loading || loading2}
        >
          {post.likes?.length > 0 && (
            <span className={s.count}>{post.likes.length}</span>
          )}
          <span className={s.icon}>
            {post.likes?.includes(user._id) ? (
              <AiFillHeart />
            ) : (
              <AiOutlineHeart />
            )}
          </span>
        </button>
        <button
          className={`btn clear`}
          onClick={() => setShowComments(!showCommments)}
        >
          {post.totalComments > 0 && (
            <span className={s.count}>{post.totalComments}</span>
          )}
          <span className={s.icon} style={{ fontSize: "1.1em" }}>
            {post.selfComment ? <FaCommentAlt /> : <FaRegCommentAlt />}
          </span>
        </button>
      </div>

      {showCommments && <Comments post_id={post._id} setPosts={setPosts} />}

      <Modal
        open={update}
        setOpen={setUpdate}
        onBackdropClick={setUpdate}
        className={s.updatePostModal}
      >
        <PostForm
          edit={post}
          onSuccess={(newPost) => {
            setUpdate(false);
            setPosts((prev) =>
              prev.map((p) => (p._id === newPost._id ? newPost : p))
            );
          }}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;
