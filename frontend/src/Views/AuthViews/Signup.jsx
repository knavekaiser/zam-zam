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
import { fingerprint } from "helpers";
import { motion } from "framer-motion";

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
    <motion.form
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.5 }}
      className="grid gap-1 m-a"
      autoComplete="off"
      onSubmit={handleSubmit(async (values) => {
        const number = phone(values.phone, { country: "bangladesh" });
        let deviceId = localStorage.getItem("deviceId");
        if (!deviceId) {
          deviceId = await fingerprint();
          localStorage.setItem("deviceId", deviceId);
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
        <div className={s.userTypes}>
          <button
            title="Member"
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
            title="Staff"
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
        <button className="btn" disabled={loading} title="Submit">
          Sign Up
        </button>
        <Link to={paths.signIn} className={s.signInLink}>
          <BsArrowLeft /> Already have an account
        </Link>
      </div>
    </motion.form>
  );
};

export default Form;
