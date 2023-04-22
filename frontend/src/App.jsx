import { useEffect, useContext, Suspense, lazy } from "react";
import { SiteContext } from "@/SiteContext";
import { useNavigate, useLocation, Route, Routes } from "react-router-dom";
import { paths, endpoints } from "config";
import { Prompt } from "Components/modal";
import { useFetch } from "hooks";
import { Spinner } from "Components/elements";
import "./App.scss";

const MainApp = lazy(() => import("Views/Dashboard"));
const AuthView = lazy(() => import("Views/AuthViews"));

function resizeWindow() {
  let vh = window.innerHeight * 0.01;
  document.body.style.setProperty("--vh", `${vh}px`);
}

function App() {
  const { user, setUser } = useContext(SiteContext);
  const navigate = useNavigate();
  const location = useLocation();

  const { get: getProfile } = useFetch(
    localStorage.getItem("userType") === "staff"
      ? endpoints.staffProfile
      : endpoints.profile
  );

  useEffect(() => {
    if (!user) {
      navigate(paths.signIn, { replace: true });
    } else if (
      [paths.signIn, paths.signUp, paths.resetPassword].includes(
        location.pathname
      )
    ) {
      navigate("/", { replace: true });
    }
  }, [user]);

  useEffect(() => {
    window.addEventListener("resize", () => resizeWindow());
    resizeWindow();

    if (!localStorage.getItem("access_token")) {
      return;
    }

    getProfile()
      .then(({ data }) => {
        if (data.success) {
          localStorage.setItem("userType", data.data.userType);
          setUser(data.data);
          navigate(location.pathname || "/", { replace: true });
        }
      })
      .catch((err) => Prompt({ type: "error", message: err.message }));
  }, []);

  if (!user) {
    return (
      <div className="App">
        <Suspense fallback={<Spinner size="2rem" />}>
          <AuthView />
        </Suspense>
      </div>
    );
  }
  return (
    <div className="App">
      <Routes>
        <Route
          path="*"
          element={
            <Suspense fallback={<Spinner size="2rem" />}>
              <MainApp />
            </Suspense>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
