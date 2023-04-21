import React, { createContext, useState, useCallback, useEffect } from "react";

import { requestPermission } from "helpers/firebase";
import { useFetch } from "hooks";
import { endpoints } from "config";

export const SiteContext = createContext();
export const Provider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [selfOnly, setSelfOnly] = useState(false);
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") ||
      (window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light")
  );

  const { post: updateDevice } = useFetch(endpoints.devices);

  const checkPermission = useCallback(
    (permission) => {
      if (!user) return false;
      if (user.role?.permissions?.includes(permission)) {
        return true;
      }
      return false;
    },
    [user]
  );

  useEffect(() => {
    requestPermission(updateDevice, user);
    if (user) {
      if (user.userType === "member") {
        setSelfOnly(true);
      }
    }
  }, [user]);

  const updateTheme = useCallback(() => {
    const _theme =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    const light = {
      "--bg-1": "255, 255, 255",
      "--bg-2": "218, 216, 216",
      "--bg-3": "194, 194, 194",
      "--bg-4": "167, 167, 167",
      "--font-color": "0, 0, 0",

      "--primary-clr": "183, 124, 255",
      "--primary-clr-dark1": "135, 67, 255",
      "--primary-clr-dark2": "88, 24, 69",
      "--primary-clr-dark3": "45, 19, 44",
    };
    const dark = {
      "--bg-1": "25, 22, 31",
      "--bg-2": "34, 29, 41",
      "--bg-3": "50, 26, 51",
      "--bg-4": "56, 34, 58",
      "--font-color": "255, 255, 255",

      "--primary-clr": "183, 124, 255",
      "--primary-clr-dark1": "135, 67, 255",
      "--primary-clr-dark2": "88, 24, 69",
      "--primary-clr-dark3": "45, 19, 44",
    };
    Object.entries(_theme === "light" ? light : dark).forEach(
      ([key, value]) => {
        document.body.style.setProperty(key, value);
      }
    );
    if (theme === "light") {
      document.querySelector("body").classList.remove("dark");
    } else {
      document.querySelector("body").classList.remove("light");
    }
    document.querySelector("body").classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    function handleDarkModeChange(e) {
      if (theme === "system") {
        updateTheme();
      }
    }
    darkModeQuery.addEventListener("change", handleDarkModeChange);
    return () =>
      darkModeQuery.removeEventListener("change", handleDarkModeChange);
  }, [theme]);

  useEffect(() => {
    updateTheme();
    localStorage.setItem("theme", theme);
  }, [theme]);
  return (
    <SiteContext.Provider
      value={{
        user,
        setUser,
        checkPermission,
        selfOnly,
        setSelfOnly,
        theme,
        setTheme,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};
