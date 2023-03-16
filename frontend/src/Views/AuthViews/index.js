import { useContext, useEffect, useState } from "react";
import { SiteContext } from "SiteContext";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Signup from "./Signup";
import SignIn from "./Signin";
import ResetPassword from "./ResetPassword";
import { paths } from "config";

import s from "./auth.module.scss";

const Auth = () => {
  const { user } = useContext(SiteContext);
  const [userType, setUserType] = useState(
    localStorage.getItem("userType") || "member"
  );
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, location]);

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
