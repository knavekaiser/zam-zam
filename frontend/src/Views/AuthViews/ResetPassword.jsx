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
import { motion } from "framer-motion";
import { Trans } from "react-i18next";

const otpSchema = yup.object({
  phone: yup
    .string()
    .phn(
      { country: "bangladesh" },
      <Trans>Please enter a valid phone number</Trans>
    )
    .required(<Trans>Field is required</Trans>),
});
const passwordResetSchema = yup.object({
  code: yup.string().required(<Trans>Field is required</Trans>),
  password: yup
    .string()
    .min(8, <Trans>Password must be 8 characters or longer</Trans>)
    .required(<Trans>Field is required</Trans>),
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
    <motion.form
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.5 }}
      className="grid gap-1 m-a"
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
        {/* <h3 className="">Reset Password</h3> */}
        <Input
          label={<Trans>Phone</Trans>}
          required
          {...register("phone")}
          error={errors.phone}
          placeholder=" "
        />
        <button className="btn" disabled={loading} title="Next">
          <Trans>Next</Trans>
        </button>
        <Link to={paths.signIn} className={s.signInLink}>
          <BsArrowLeft /> <Trans>Back to Login</Trans>
        </Link>
      </div>
    </motion.form>
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
        <p className={s.note}>
          <Trans
            defaults="Please enter the 6 digit code sent to {{ phone }}."
            values={{ phone }}
          />
        </p>

        <p className={s.resend}>
          <Trans>Didn't recieve the Code?</Trans>{" "}
          {timeout ? (
            <>
              <Trans
                defaults="Please wait {{time}}"
                values={{
                  time: "",
                }}
              />
              <Countdown
                time={new Date().setSeconds(new Date().getSeconds() + timeout)}
                format={"mm:ss"}
                onEnd={() => setTimeout(null)}
              />
            </>
          ) : (
            <button
              title={<Trans>Resend Code</Trans>}
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
              <Trans>Resend</Trans>
            </button>
          )}
        </p>

        <Input
          type="number"
          label={<Trans>Code</Trans>}
          required
          {...register("code")}
          error={errors.code}
          placeholder=" "
        />

        <PasswordInput
          formOptions={{ required: true }}
          label={<Trans>New Password</Trans>}
          control={control}
          name="password"
          autoComplete="new-password"
          placeholder=" "
        />

        <button
          title={<Trans>Submit</Trans>}
          className="btn"
          type="submit"
          disabled={resendingOtp || resettingPass}
        >
          <Trans>Submit</Trans>
        </button>
        <a onClick={() => setStep(1)} className={s.signInLink}>
          <BsArrowLeft /> <Trans>Back</Trans>
        </a>
      </div>
    </form>
  );
};

export default Form;
