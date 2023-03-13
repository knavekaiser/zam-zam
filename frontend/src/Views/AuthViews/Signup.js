import { useForm } from "react-hook-form";
import { Input, PasswordInput } from "Components/elements";
import { Link, useNavigate } from "react-router-dom";
import { useYup, useFetch } from "hooks";
import { paths, endpoints } from "config";
import { Prompt } from "Components/modal";
import { phone } from "phone";
import * as yup from "yup";
import s from "./auth.module.scss";

const validationSchema = yup.object({
  phone: yup.string().phone({ country: "bangladesh" }).required("Required"),
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
        signup({
          phone: number.phoneNumber,
          password: values.password,
          name: values.name,
        }).then(({ data }) => {
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
        });
      })}
    >
      <div className={"grid gap-2"}>
        <div className="flex justify-space-between align-center">
          <h1 className="text-center">Sign Up</h1>
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
          </div>
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
        />
        <button className="btn" disabled={loading}>
          Sign Up
        </button>
        <Link to={paths.signIn}>Already have an account</Link>
      </div>
    </form>
  );
};

export default Form;
