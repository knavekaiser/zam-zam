import { useContext, useRef, useState } from "react";
import { SiteContext } from "SiteContext";
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { paths, endpoints } from "config";
import { useFetch } from "hooks";

import { FaPowerOff } from "react-icons/fa";
import {
  BsHouseDoor,
  BsHouseDoorFill,
  BsArrowDownSquareFill,
  BsArrowDownSquare,
  BsArrowUpSquareFill,
  BsArrowUpSquare,
  BsArrowUpLeftSquareFill,
  BsArrowUpLeftSquare,
  BsPeople,
  BsPeopleFill,
  BsPersonBadgeFill,
  BsPersonBadge,
  BsFileMedicalFill,
  BsFileMedical,
  BsCalendar3Range,
  BsCalendar3RangeFill,
} from "react-icons/bs";

import s from "./dashboard.module.scss";

import Home from "./Home";
import Deposits from "./Deposits";
import Expenses from "./Expenses";
import Withdrawals from "./Withdrawals";
import Members from "./Members";
import Staffs from "./Staffs";
import Profile from "./Profile";
import Roles from "./Roles";
import Milestones from "./Milestones";

const MainApp = () => {
  const { user, setUser, checkPermission } = useContext(SiteContext);
  const location = useLocation();
  const sidebarItems = useRef([
    {
      icon: <BsHouseDoor style={{ fontSize: "1.2em", marginTop: "-0.15em" }} />,
      activeIcon: (
        <BsHouseDoorFill
          className={s.filled}
          style={{ fontSize: "1.2em", marginTop: "-0.15em" }}
        />
      ),
      label: "Home",
      path: paths.home,
    },
    ...(checkPermission("deposit_read")
      ? [
          {
            icon: <BsArrowDownSquare style={{ fontSize: ".96em" }} />,
            activeIcon: (
              <BsArrowDownSquareFill
                className={s.filled}
                style={{ fontSize: ".96em" }}
              />
            ),
            label: "Deposits",
            path: paths.deposits,
          },
        ]
      : []),
    ...(checkPermission("expense_read")
      ? [
          {
            icon: <BsArrowUpSquare style={{ fontSize: ".96em" }} />,
            activeIcon: (
              <BsArrowUpSquareFill
                className={s.filled}
                style={{ fontSize: ".96em" }}
              />
            ),
            label: "Expenses",
            path: paths.expenses,
          },
        ]
      : []),
    ...(checkPermission("withdrawal_read")
      ? [
          {
            icon: <BsArrowUpLeftSquare style={{ fontSize: ".96em" }} />,
            activeIcon: (
              <BsArrowUpLeftSquareFill
                className={s.filled}
                style={{ fontSize: ".96em" }}
              />
            ),
            label: "Withdrawals",
            path: paths.withdrawals,
          },
        ]
      : []),
    ...(checkPermission("milestone_read")
      ? [
          {
            icon: <BsCalendar3Range style={{ fontSize: ".96em" }} />,
            activeIcon: (
              <BsCalendar3RangeFill
                className={s.filled}
                style={{ fontSize: ".96em" }}
              />
            ),
            label: "Milestones",
            path: paths.milestones,
          },
        ]
      : []),
    ...(checkPermission("member_read")
      ? [
          {
            icon: <BsPeople />,
            activeIcon: <BsPeopleFill className={s.filled} />,
            label: "Members",
            path: paths.members,
          },
        ]
      : []),
    ...(checkPermission("staff_read")
      ? [
          {
            icon: <BsPersonBadge />,
            activeIcon: <BsPersonBadgeFill className={s.filled} />,
            label: "Staffs",
            path: paths.staffs,
          },
        ]
      : []),
    ...(checkPermission("role_read")
      ? [
          {
            icon: <BsFileMedical />,
            activeIcon: <BsFileMedicalFill className={s.filled} />,
            label: "Roles",
            path: paths.roles,
          },
        ]
      : []),
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { post: logout } = useFetch(
    localStorage.getItem("userType") === "staff"
      ? endpoints.staffLogout
      : endpoints.logout
  );

  if (!user) {
    return <Navigate to={paths.signIn} />;
  }

  return (
    <div className={s.container}>
      <div className={`${s.header} ${sidebarOpen ? s.open : ""}`}>
        <Link to={paths.profile} onClick={() => setSidebarOpen(false)}>
          <div
            className={`${s.user} ${user.userType === "staff" ? s.staff : ""}`}
          >
            <div className={s.profile}>
              <img src={user.photo || "/assets/avatar.webp"} />
            </div>
            <h2 className={"ellipsis l-1"}>{user.name}</h2>
            <p className={s.role}>{user.role?.name}</p>
          </div>
        </Link>

        <ul className={s.links}>
          {sidebarItems.current.map((item, i, arr) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth <= 480) {
                  setSidebarOpen(false);
                }
              }}
              className={location.pathname === item.path ? s.active : ""}
            >
              <li>
                <span
                  className={s.icon}
                  style={{
                    transitionDelay: `${
                      (window.innerWidth <= 480 ? 500 : 0) +
                      50 * (sidebarOpen ? i : arr.length - i)
                    }ms`,
                  }}
                >
                  {item.icon}
                  {item.activeIcon}
                  {/* {location.pathname === item.path
                    ? item.activeIcon
                    : item.icon} */}
                </span>
                <span
                  className={s.label}
                  style={{
                    transitionDelay: `${
                      (window.innerWidth <= 480 ? 500 : 0) +
                      50 * (sidebarOpen ? i : arr.length - i)
                    }ms`,
                  }}
                >
                  {item.label}
                </span>
              </li>
            </Link>
          ))}
        </ul>

        <button
          className={`clear ${s.logoutBtn}`}
          title="Log out"
          onClick={() => {
            logout({
              deviceId: localStorage.getItem("deviceId"),
            }).then(({ data }) => {
              if (data.success) {
                setUser(null);
                localStorage.removeItem("access_token");
              }
            });
          }}
        >
          <FaPowerOff />
        </button>

        <footer>
          © {new Date().getFullYear()} Knave Kaiser Lab Works,
          <br /> All Rights Reserved.
        </footer>
      </div>

      <div
        className={s.sidebarBackdrop}
        onClick={() => setSidebarOpen(false)}
      />

      <Routes>
        <Route
          path={paths.home}
          element={<Home setSidebarOpen={setSidebarOpen} />}
        />
        <Route
          path={paths.deposits}
          element={<Deposits setSidebarOpen={setSidebarOpen} />}
        />
        <Route
          path={paths.expenses}
          element={<Expenses setSidebarOpen={setSidebarOpen} />}
        />
        <Route
          path={paths.withdrawals}
          element={<Withdrawals setSidebarOpen={setSidebarOpen} />}
        />
        <Route
          path={paths.milestones}
          element={<Milestones setSidebarOpen={setSidebarOpen} />}
        />
        <Route
          path={paths.members}
          element={<Members setSidebarOpen={setSidebarOpen} />}
        />
        <Route
          path={paths.staffs}
          element={<Staffs setSidebarOpen={setSidebarOpen} />}
        />
        <Route
          path={paths.roles}
          element={<Roles setSidebarOpen={setSidebarOpen} />}
        />
        <Route
          path={paths.profile}
          element={<Profile setSidebarOpen={setSidebarOpen} />}
        />
        <Route
          path="*"
          element={
            <h1
              style={{
                color: "white",
                margin: "auto",
              }}
            >
              /404
            </h1>
          }
        />
      </Routes>
    </div>
  );
};

export default MainApp;
