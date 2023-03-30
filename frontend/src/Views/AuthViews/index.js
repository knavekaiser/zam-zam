import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Signup from "./Signup";
import SignIn from "./Signin";
import ResetPassword from "./ResetPassword";
import { paths } from "config";

import s from "./auth.module.scss";

const Auth = () => {
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
      <Routes>
        <Route
          path={paths.signUp}
          element={<Signup userType={userType} setUserType={setUserType} />}
        />
        <Route
          path={paths.signIn}
          element={<SignIn userType={userType} setUserType={setUserType} />}
        />
        <Route
          path={paths.resetPassword}
          element={
            <ResetPassword userType={userType} setUserType={setUserType} />
          }
        />
        {/* <Route path="*" element={<h1>404</h1>} /> */}
      </Routes>
      <img
        className={s.background}
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
