import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input, Countdown, PasswordInput } from "Components/elements";
import { Link, useNavigate } from "react-router-dom";
import { useYup, useFetch } from "hooks";
import { paths, endpoints } from "config";
import { Prompt } from "Components/modal";
import { phone } from "phone";
import * as yup from "yup";
import s from "./auth.module.scss";
import { BsArrowLeft } from "react-icons/bs";

const otpSchema = yup.object({
  phone: yup.string().phn({ country: "bangladesh" }).required("Required"),
});
const passwordResetSchema = yup.object({
  code: yup.string().required("Required"),
  password: yup
    .string()
    .min(8, "Password must be 8 characters or longer")
    .required("Required"),
});

const Form = ({ userType, setUserType }) => {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState(null);
  const [timeout, setTimeout] = useState(null);
  const navigate = useNavigate();

  return (
    <>
      {step === 1 && (
        <SendOtpForm
          userType={userType}
          onSuccess={(otpDetail) => {
            setPhone(otpDetail.phone);
            setTimeout(otpDetail.timeout);
            setStep(2);
          }}
        />
      )}
      {step === 2 && (
        <PasswordResetForm
          userType={userType}
          setPhone={setPhone}
          phone={phone}
          setStep={setStep}
          timeout={timeout}
          setTimeout={setTimeout}
          onSuccess={(resp) => {
            Prompt({
              type: "information",
              message: resp.message,
              callback: () => navigate(paths.signIn),
            });
          }}
        />
      )}
    </>
  );
};

const SendOtpForm = ({ userType, onSuccess }) => {
  const { post: sendOtp, loading } = useFetch(
    userType === "member"
      ? endpoints.forgotPassword
      : endpoints.staffForgotPassword
  );
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({
    resolver: useYup(otpSchema),
  });
  return (
    <form
      className="grid gap-1 p-2 m-a"
      onSubmit={handleSubmit((values) => {
        const number = phone(values.phone, { country: "bangladesh" });
        sendOtp({ phone: number.phoneNumber }).then(({ data }) => {
          if (data.success) {
            onSuccess(data.data);
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
        <div
          className={`flex justify-space-between align-center ${s.logoContainer}`}
        >
          <div className={s.logo}>
            {/* <img src="/assets/Zam-Zam-1.png" /> */}
            <h1 className="text-center">ZAM-ZAM</h1>
            <span>TOWER</span>
          </div>
        </div>

        {/* <h3 className="">Reset Password</h3> */}
        <Input
          label="Phone"
          required
          {...register("phone")}
          error={errors.phone}
        />
        <button className="btn" disabled={loading}>
          Next
        </button>
        <Link to={paths.signIn} className={s.signInLink}>
          <BsArrowLeft /> Back to Login
        </Link>
      </div>
    </form>
  );
};

const PasswordResetForm = ({
  userType,
  setPhone,
  phone,
  setStep,
  timeout,
  setTimeout,
  onSuccess,
}) => {
  const { post: resendOtp, loading: resendingOtp } = useFetch(
    userType === "member"
      ? endpoints.forgotPassword
      : endpoints.staffForgotPassword
  );
  const { post: resetPassword, loading: resettingPass } = useFetch(
    userType === "member"
      ? endpoints.resetPassword
      : endpoints.staffResetPassword
  );
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({ resolver: useYup(passwordResetSchema) });
  useEffect(() => {
    if (!phone) {
      setStep(1);
    }
  }, [phone]);
  return (
    <form
      className="grid gap-2 p-2 m-a"
      onSubmit={handleSubmit((values) => {
        resetPassword({
          phone,
          password: values.password,
          code: values.code,
        }).then(({ data }) => {
          if (data.success) {
            onSuccess(data);
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
        <div
          className={`flex justify-space-between align-center ${s.logoContainer}`}
        >
          <div className={s.logo}>
            {/* <img src="/assets/Zam-Zam-1.png" /> */}
            <h1 className="text-center">ZAM-ZAM</h1>
            <span>TOWER</span>
          </div>
        </div>

        <p className={s.note}>
          Please enter the 6 digit code sent to {phone}. <br />
        </p>

        <p className={s.resend}>
          Didn't recieve the Code?{" "}
          {timeout ? (
            <>
              Please wait{" "}
              <Countdown
                time={new Date().setSeconds(new Date().getSeconds() + timeout)}
                format={"mm:ss"}
                onEnd={() => setTimeout(null)}
              />
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                resendOtp({ phone }).then(({ data }) => {
                  if (data.success) {
                    setPhone(data.data.phone);
                    setTimeout(data.data.timeout);
                  } else {
                    Prompt({
                      type: "error",
                      message: data.message,
                    });
                  }
                });
              }}
              disabled={resendingOtp}
            >
              Resend
            </button>
          )}
        </p>

        <Input
          type="number"
          label="Code"
          required
          {...register("code")}
          error={errors.code}
        />

        <PasswordInput
          formOptions={{ required: true }}
          label="New Password"
          control={control}
          name="password"
          autoComplete="new-password"
        />

        <button
          className="btn"
          type="submit"
          disabled={resendingOtp || resettingPass}
        >
          Submit
        </button>
        <a onClick={() => setStep(1)} className={s.signInLink}>
          <BsArrowLeft /> Back
        </a>
      </div>
    </form>
  );
};

export default Form;
