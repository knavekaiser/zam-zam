import { useState, useContext } from "react";
import { SiteContext } from "@/SiteContext";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { Input, PasswordInput } from "Components/elements";
import { useYup, useFetch } from "hooks";
import { paths, endpoints } from "config";
import { Prompt } from "Components/modal";
import { phone } from "phone";
import * as yup from "yup";
import s from "./auth.module.scss";
import { BsArrowRight } from "react-icons/bs";
import { motion } from "framer-motion";
import { fingerprint } from "helpers";

const validationSchema = yup.object({
  phone: yup.string().phn({ country: "bangladesh" }).required("Required"),
  password: yup.string().required("Required"),
});

const Form = ({ userType, setUserType }) => {
  const { setUser } = useContext(SiteContext);
  const {
    handleSubmit,
    control,
    register,
    formState: { errors },
  } = useForm({ resolver: useYup(validationSchema) });
  const navigate = useNavigate();
  const [invalidCred, setInvalidCred] = useState(false);
  const { post: login, loading } = useFetch(
    userType === "member" ? endpoints.signIn : endpoints.staffSignIn
  );
  return (
    <motion.form
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
      className="grid m-a"
      onSubmit={handleSubmit(async (values) => {
        setInvalidCred(false);
        const number = phone(values.phone, { country: "bangladesh" });
        let deviceId = localStorage.getItem("deviceId");
        if (!deviceId) {
          deviceId = await fingerprint();
          localStorage.setItem("deviceId", deviceId);
        }
        login({
          phone: number.phoneNumber,
          password: values.password,
          deviceId,
        })
          .then(({ data }) => {
            if (data.success) {
              setUser(data.data);
              localStorage.setItem("access_token", data.token);
              navigate("/", { replace: true });
            } else {
              setInvalidCred(data.message);
              setTimeout(() => setInvalidCred(false), 3000);
            }
          })
          .catch((err) => Prompt({ type: "error", message: err.message }));
      })}
    >
      <div className={`grid gap-2`}>
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
        </div>

        {invalidCred && (
          <p className="error">{invalidCred || "Invalid credentials"}</p>
        )}
        <Input
          label="Phone"
          required
          {...register("phone")}
          error={errors.phone}
        />

        <section className={s.passField}>
          <Link className={s.resetPasswordLink} to={paths.resetPassword}>
            Forgot Password?
          </Link>
          <PasswordInput
            formOptions={{ required: true }}
            label="Password"
            control={control}
            name="password"
          />
        </section>

        <button className="btn" disabled={loading} title="Sign In">
          Sign In
        </button>
        <Link className={s.signUpLink} to={paths.signUp}>
          Create New Account <BsArrowRight />
        </Link>
      </div>
    </motion.form>
  );
};

export default Form;
