import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { paths } from "config";

import s from "./auth.module.scss";
import { AnimatePresence, motion } from "framer-motion";
import { Spinner } from "Components/elements";

// const Signup = lazy(() => import("./Signup"));
const SignIn = lazy(() => import("./Signin"));
const ResetPassword = lazy(() => import("./ResetPassword"));

const Auth = () => {
  const location = useLocation();
  const [userType, setUserType] = useState(
    localStorage.getItem("userType") || "member"
  );

  useEffect(() => {
    if (!["staff", "member"].includes(localStorage.getItem("userType"))) {
      localStorage.setItem("userType", "member");
      setUserType("member");
    }
  }, []);

  return (
    <div className={s.container}>
      <motion.div className={s.content} layout>
        <div
          className={`flex justify-space-between align-center ${s.logoContainer}`}
        >
          <div className={s.logo}>
            {/* <img src="/asst/Zam-Zam-1.png" alt="logo" /> */}
            <h1 className="text-center">ZAM-ZAM</h1>
            <span>TOWER</span>
          </div>
        </div>

        <AnimatePresence>
          <Routes location={location} key={location.path}>
            {/* <Route
              path={paths.signUp}
              element={
                <Suspense fallback={<Spinner />}>
                  <Signup userType={userType} setUserType={setUserType} />
                </Suspense>
              }
            /> */}
            <Route
              path={paths.signIn}
              element={
                <Suspense fallback={<Spinner />}>
                  <SignIn userType={userType} setUserType={setUserType} />
                </Suspense>
              }
            />
            <Route
              path={paths.resetPassword}
              element={
                <Suspense fallback={<Spinner />}>
                  <ResetPassword
                    userType={userType}
                    setUserType={setUserType}
                  />
                </Suspense>
              }
            />
          </Routes>
        </AnimatePresence>
      </motion.div>
      <img
        className={s.background}
        alt="Background"
        src={`https://images.unsplash.com/photo-1518839283416-0cc546d12a97?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=${window.innerWidth}&h=${window.innerHeight}&q=80`}
      />
      <footer>
        © {new Date().getFullYear()} Knave Kaiser Lab Works, All Rights
        Reserved.
      </footer>
    </div>
  );
};

export default Auth;
