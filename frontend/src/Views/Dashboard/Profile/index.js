import { useContext, useEffect } from "react";
import { SiteContext } from "SiteContext";
import { useForm } from "react-hook-form";
import { Input, AvatarInput } from "Components/elements";
import * as yup from "yup";
import s from "./profile.module.scss";
import { useYup, useFetch } from "hooks";
import { Prompt } from "Components/modal";
import { endpoints } from "config";
import { BsMoon, BsMoonFill, BsSun, BsSunFill } from "react-icons/bs";

const profileSchema = yup.object({
  name: yup.string().required(),
  phone: yup.string().phone().required(),
  email: yup.string().email(),
});

const Toggle = ({}) => {
  const { theme, setTheme } = useContext(SiteContext);

  return (
    <button
      type="button"
      title="Toggle Light or Dark Theme"
      className={`${s.themeToggle} ${s[theme]}`}
      onClick={() =>
        setTheme((prev) => {
          if (prev === "light") {
            return "dark";
          } else if (prev === "dark") {
            return "system";
          } else {
            return "light";
          }
        })
      }
    >
      {theme === "system" ? (
        <>
          <div className={s.left}>
            <BsSun />
          </div>
          <div className={s.right}>
            <BsMoon />
          </div>
        </>
      ) : (
        <>
          <div className={s.left}>
            {theme === "light" ? <BsSunFill className={s.fill} /> : <BsSun />}
          </div>
          <div className={s.right}>
            {theme !== "light" ? <BsMoonFill className={s.fill} /> : <BsMoon />}
          </div>
        </>
      )}
    </button>
  );
};

const Settings = ({ setSidebarOpen }) => {
  const { user, setUser } = useContext(SiteContext);
  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: useYup(profileSchema),
  });
  const { put: updateProfile, loading } = useFetch(
    user.userType === "member" ? endpoints.profile : endpoints.staffProfile
  );
  useEffect(() => {
    reset({
      photo: user.photo ? [user.photo] : [],
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
      address: user.address || "",
    });
  }, [user]);
  return (
    <div className={s.wrapper}>
      <div className={s.container}>
        <form
          className="grid gap-1"
          onSubmit={handleSubmit((values) => {
            let photo = values.photo;

            const formData = new FormData();

            if (photo?.type) {
              formData.append(`photo`, photo);
            } else if (!photo) {
              formData.append(`photo`, "");
            }

            formData.append(`name`, values.name);
            formData.append(`phone`, values.phone);
            formData.append(`email`, values.email);

            updateProfile(formData).then(({ data }) => {
              if (data.success) {
                setUser(data.data);
                Prompt({
                  type: "information",
                  message: "Updates have been saved.",
                });
              } else if (data.errors) {
                Prompt({
                  type: "error",
                  message: data.message,
                });
              }
            });
          })}
        >
          <div className="flex justify-space-between">
            <h2 onClick={() => setSidebarOpen((prev) => !prev)}>Profile</h2>
            <Toggle />
          </div>
          <AvatarInput
            label="Photo"
            control={control}
            name="photo"
            className={`${s.avatar} ${
              user.userType === "staff" ? s.staff : ""
            }`}
          />
          <Input label="Name" {...register("name")} error={errors.name} />
          <Input
            label="Phone"
            {...register("phone")}
            error={errors.phone}
            disabled
          />
          <Input label="Email" {...register("email")} error={errors.email} />

          <button className="btn" disabled={loading} title="Save Changes">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
