import { useContext, useEffect } from "react";
import { SiteContext } from "SiteContext";
import { useForm } from "react-hook-form";
import { Input, AvatarInput } from "Components/elements";
import * as yup from "yup";
import s from "./settings.module.scss";
import { useYup, useFetch } from "hooks";
import { Prompt } from "Components/modal";
import { endpoints } from "config";

const profileSchema = yup.object({
  name: yup.string().required(),
  phone: yup.string().phone().required(),
  email: yup.string().email(),
});

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
          <h2 onClick={() => setSidebarOpen((prev) => !prev)}>Profile</h2>
          <AvatarInput
            label="Photo"
            control={control}
            name="photo"
            className={s.avatar}
          />
          <Input label="Name" {...register("name")} error={errors.name} />
          <Input
            label="Phone"
            {...register("phone")}
            error={errors.phone}
            disabled
          />
          <Input label="Email" {...register("email")} error={errors.email} />

          <button className="btn" disabled={loading}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
