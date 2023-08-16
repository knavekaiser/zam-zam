import { useContext, useEffect } from "react";
import { SiteContext } from "@/SiteContext";
import { useForm } from "react-hook-form";
import { Input, AvatarInput, PasswordInput } from "Components/elements";
import * as yup from "yup";
import s from "./profile.module.scss";
import { useYup, useFetch } from "hooks";
import { Prompt } from "Components/modal";
import { endpoints } from "config";
import { BsMoon, BsMoonFill, BsSun, BsSunFill } from "react-icons/bs";
import { Trans } from "react-i18next";

const profileSchema = yup.object({
  name: yup.string().required(),
  phone: yup.string().phone().required(),
  email: yup.string().email(),
  password: yup.string().min(8, "Password must be 8 characters or longer"),
  oldPassword: yup
    .string()
    .when("password", ([password], schema) =>
      password ? schema.required("Please enter the old password") : schema
    ),
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
      password: "",
      oldPassword: "",
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
            delete values.photo;

            Object.entries(values).forEach(([key, value]) => {
              formData.append(key, value);
            });

            updateProfile(formData).then(({ data }) => {
              if (data.success) {
                setUser(data.data);
                Prompt({
                  type: "information",
                  message: "Updates have been saved.",
                  callback: () => {
                    reset({
                      photo: user.photo ? [user.photo] : [],
                      name: user.name || "",
                      phone: user.phone || "",
                      email: user.email || "",
                      address: user.address || "",
                      password: "",
                      oldPassword: "",
                    });
                  },
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
            <h2 onClick={() => setSidebarOpen((prev) => !prev)}>
              <Trans>Profile</Trans>
            </h2>
            <Toggle />
          </div>
          <AvatarInput
            label={<Trans>Photo</Trans>}
            control={control}
            name="photo"
            className={`${s.avatar} ${
              user.userType === "staff" ? s.staff : ""
            }`}
          />
          <Input
            label={<Trans>Name</Trans>}
            {...register("name")}
            placeholder=" "
            error={errors.name}
          />
          <Input
            label={<Trans>Phone</Trans>}
            {...register("phone")}
            error={errors.phone}
            disabled
          />
          <Input
            label={<Trans>Email</Trans>}
            {...register("email")}
            placeholder=" "
            error={errors.email}
          />

          <div className={s.divider}>
            <p>
              <Trans>Change Password</Trans>
            </p>
          </div>

          <PasswordInput
            formOptions={{ required: true }}
            label={<Trans>Old Password</Trans>}
            placeholder=" "
            control={control}
            name="oldPassword"
          />

          <PasswordInput
            formOptions={{ required: true }}
            label={<Trans>New Password</Trans>}
            control={control}
            placeholder=" "
            name="password"
          />

          <button className="btn" disabled={loading} title="Save Changes">
            <Trans>Save Changes</Trans>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
