import { useForm } from "react-hook-form";
import { Input, PasswordInput } from "Components/elements";
import { Link, useNavigate } from "react-router-dom";
import { useYup, useFetch } from "hooks";
import { paths, endpoints } from "config";
import { Prompt } from "Components/modal";
import { phone } from "phone";
import * as yup from "yup";
import s from "./auth.module.scss";
import { BsArrowLeft } from "react-icons/bs";
import { requestPermission } from "helpers/firebase";

const validationSchema = yup.object({
  phone: yup.string().phn({ country: "bangladesh" }).required("Required"),
  name: yup.string().required("Required"),
  password: yup
    .string()
    .min(8, "Password must be 8 characters or longer")
    .required("Required"),
});

const Form = ({ userType, setUserType }) => {
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({
    resolver: useYup(validationSchema),
  });
  const { post: signup, loading } = useFetch(
    userType === "member" ? endpoints.signUp : endpoints.staffSignUp
  );
  const navigate = useNavigate();

  return (
    <form
      className="grid gap-1 p-2 m-a"
      autoComplete="off"
      onSubmit={handleSubmit((values) => {
        const number = phone(values.phone, { country: "bangladesh" });
        const deviceId = localStorage.getItem("deviceId");
        if (!deviceId) {
          return Prompt({
            type: "error",
            message: "Please allow notification.",
            callback: () => requestPermission(),
          });
        }
        signup({
          phone: number.phoneNumber,
          password: values.password,
          name: values.name,
          deviceId,
        })
          .then(({ data }) => {
            if (data.success) {
              Prompt({
                type: "success",
                message: data.message,
                callback: () => navigate(paths.signIn),
              });
            } else {
              Prompt({
                type: "error",
                message: data.message,
              });
            }
          })
          .catch((err) => Prompt({ type: "error", message: err.message }));
      })}
    >
      <div className={"grid gap-2"}>
        <div
          className={`flex justify-space-between align-center ${s.logoContainer}`}
        >
          <div className={s.logo}>
            {/* <img src="/assets/Zam-Zam-1.png" /> */}
            <h1 className="text-center">ZAM-ZAM</h1>
            <span>TOWER</span>
          </div>
        </div>

        <div className={s.userTypes}>
          <button
            type="button"
            disabled={loading}
            className={`btn clear ${userType === "member" ? s.active : ""}`}
            onClick={() => {
              localStorage.setItem("userType", "member");
              setUserType("member");
            }}
          >
            Member
          </button>
          <button
            type="button"
            disabled={loading}
            className={`btn clear ${userType === "staff" ? s.active : ""}`}
            onClick={() => {
              localStorage.setItem("userType", "staff");
              setUserType("staff");
            }}
          >
            Staff
          </button>
          <span
            style={
              userType === "member"
                ? { width: "55%" }
                : { left: "55%", width: "45%" }
            }
            className={s.background}
          />
          <span className={s.background2} />
        </div>

        <Input
          label="Name"
          required
          {...register("name")}
          error={errors.name}
        />
        <Input
          label="Phone"
          required
          {...register("phone")}
          error={errors.phone}
        />
        <PasswordInput
          formOptions={{ required: true }}
          label="Password"
          control={control}
          name="password"
          autoComplete="new-password"
        />
        <button className="btn" disabled={loading}>
          Sign Up
        </button>
        <Link to={paths.signIn} className={s.signInLink}>
          <BsArrowLeft /> Already have an account
        </Link>
      </div>
    </form>
  );
};

export default Form;
