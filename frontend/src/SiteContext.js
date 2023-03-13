import React, { createContext, useState, useCallback } from "react";

export const SiteContext = createContext();
export const Provider = ({ children }) => {
  const [user, setUser] = useState(null);

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

  return (
    <SiteContext.Provider
      value={{
        user,
        setUser,
        checkPermission,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};
