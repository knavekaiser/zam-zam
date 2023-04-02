import React, { createContext, useState, useCallback, useEffect } from "react";

import { requestPermission } from "helpers/firebase";
import { useFetch } from "hooks";
import { endpoints } from "config";

export const SiteContext = createContext();
export const Provider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [selfOnly, setSelfOnly] = useState(false);

  const { post: updateDevice, loading: updatingDevice } = useFetch(
    endpoints.devices
  );

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
  return (
    <SiteContext.Provider
      value={{
        user,
        setUser,
        checkPermission,
        selfOnly,
        setSelfOnly,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};
