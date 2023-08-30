import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Textarea } from "Components/elements";
import { useYup, useFetch } from "hooks";
import { Prompt } from "Components/modal";
import * as yup from "yup";
import s from "./home.module.scss";
import { endpoints } from "config";
import { Trans, useTranslation } from "react-i18next";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { resizeImg } from "helpers";
import { IoSend } from "react-icons/io5";
import { useContext } from "react";
import { SiteContext } from "@/SiteContext";

export const PostForm = ({ edit, onSuccess }) => {
  const imgInput = useRef();
  const { handleSubmit, control, watch, reset, setValue } = useForm();
  const { put: updatePost, post: addPost } = useFetch(
    endpoints.feed + `/${edit?._id || ""}`
  );
  const media = watch("media");
  const { i18n } = useTranslation();
  useEffect(() => {
    if (edit) {
      reset({
        text: edit?.content?.text || "",
        media: edit?.content?.media || [],
      });
    }
  }, [edit]);
  return (
    <form
      onSubmit={handleSubmit((values) => {
        if (!values.text && !values.media?.length) {
          return;
        }
        const formData = new FormData();
        if (values.text) {
          formData.append("text", values.text);
        }
        if (values.media?.length) {
          for (let i = 0; i < values.media.length; i++) {
            formData.append("media", values.media[i]);
          }
        }
        (edit ? updatePost : addPost)(formData)
          .then(({ data }) => {
            if (data.success) {
              reset({
                text: "",
                media: [],
              });
              return onSuccess(data.data);
            }
            return Prompt({ type: "error", message: data.message });
          })
          .catch((err) => Prompt({ type: "error", message: err.message }));
      })}
      className={s.postForm}
    >
      <Textarea
        control={control}
        name="text"
        placeholder="What's going on..."
      />
      {media?.length > 0 && (
        <div className={s.thumbnails}>
          {media.map((file, i) => {
            if (file.type.startsWith("image")) {
              const url = URL.createObjectURL(file);
              return (
                <div className={s.mediaWrapper} key={i}>
                  <button
                    type="button"
                    className="btn clear"
                    onClick={() =>
                      setValue(
                        "media",
                        media.filter((item) => item.name !== file.name)
                      )
                    }
                  >
                    <IoMdCloseCircleOutline />
                  </button>
                  <img src={url} />
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
      <div className={s.control}>
        <div className={s.left}>
          <input
            className={s.input}
            ref={imgInput}
            type="file"
            display="hidden"
            multiple
            accept="image/png, image/gif, image/jpeg, image/jpg"
            onChange={async (e) => {
              const files = [];
              for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                if (!(media || []).some((item) => item.name === file.name)) {
                  files.push(await resizeImg(file));
                }
              }
              setValue("media", [...(media || []), ...files]);
            }}
          />
          <button
            type="button"
            className="btn clear"
            onClick={() => {
              imgInput.current.click();
            }}
          >
            Photo
          </button>
          {/* <button type="button" className="btn clear">Video</button> */}
        </div>
        <div className={s.right}>
          <button className={"btn"}>{edit ? "Update Post" : "Post"}</button>
        </div>
      </div>
    </form>
  );
};

export const CommentForm = ({ parent_type, parent_id, edit, onSuccess }) => {
  const { user } = useContext(SiteContext);
  const { handleSubmit, control, reset } = useForm();
  const { put: updatePost, post: addPost } = useFetch(
    endpoints.feedComments.replace("post_id", parent_id) + `/${edit?._id || ""}`
  );
  useEffect(() => {
    if (edit) {
      reset({
        text: edit?.content?.text || "",
        media: edit?.content?.media || [],
      });
    }
  }, [edit]);
  return (
    <div className={s.commentForm}>
      <div className={`${s.user} ${user.userType === "staff" ? s.staff : ""}`}>
        <img
          src={user?.photo || "/asst/avatar.webp"}
          alt={`User Photo - ${user?.name}`}
        />
      </div>
      <form
        onSubmit={handleSubmit((values) => {
          if (!values.text && !values.media?.length) {
            return;
          }
          const formData = new FormData();
          formData.append("parentType", parent_type);
          if (values.text) {
            formData.append("text", values.text);
          }
          if (values.media?.length) {
            for (let i = 0; i < values.media.length; i++) {
              formData.append("media", values.media[i]);
            }
          }
          (edit ? updatePost : addPost)(formData)
            .then(({ data }) => {
              if (data.success) {
                reset();
                return onSuccess(data.data);
              }
              return Prompt({ type: "error", message: data.message });
            })
            .catch((err) => Prompt({ type: "error", message: err.message }));
        })}
      >
        <Textarea
          control={control}
          name="text"
          placeholder="What's going on..."
        />

        <div className={s.control}>
          <button className={"btn secondary clear"}>
            <IoSend />
          </button>
        </div>
      </form>
    </div>
  );
};
