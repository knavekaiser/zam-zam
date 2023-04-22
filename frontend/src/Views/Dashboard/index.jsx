import { Suspense, lazy, useContext, useRef, useState } from "react";
import { SiteContext } from "@/SiteContext";
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { paths, endpoints } from "config";
import { useFetch } from "hooks";

import { FaPowerOff } from "react-icons/fa";
import { Table } from "Components/elements";
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
import Profile from "./Profile";

const Deposits = lazy(() => import("./Deposits"));
const Expenses = lazy(() => import("./Expenses"));
const Withdrawals = lazy(() => import("./Withdrawals"));
const Members = lazy(() => import("./Members"));
const Staffs = lazy(() => import("./Staffs"));
const Roles = lazy(() => import("./Roles"));
const Milestones = lazy(() => import("./Milestones"));

const Loading = ({ columns, trStyle, setSidebarOpen }) => {
  return (
    <div className={s.wrapper}>
      <div className={`${s.contentLoading} grid m-a`}>
        <div className={`${s.head} flex p-1`}>
          <div
            className={`flex align-center pointer gap_5`}
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <h2 className="skl-loading" />
          </div>
          <>
            <button
              title="Toggle Filters"
              className={`btn clear ${s.filterBtn} skl-loading`}
            />
          </>
        </div>

        <Table
          className={s.data}
          trStyle={trStyle}
          columns={Array(columns)
            .fill(null)
            .map((item, i) => ({
              label: (
                <p
                  key={i}
                  className="skl-loading"
                  style={{ width: `${Math.floor(Math.random() * 41) + 30}%` }}
                />
              ),
            }))}
        >
          {Array(3)
            .fill(null)
            .map((item, i) => (
              <tr key={i} style={trStyle}>
                {Array(columns)
                  .fill(null)
                  .map((item, j) => (
                    <td
                      key={j}
                      className="skl-loading"
                      style={{
                        width: `${Math.floor(Math.random() * 41) + 30}%`,
                      }}
                    />
                  ))}
              </tr>
            ))}
        </Table>
      </div>
    </div>
  );
};

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
              <img
                src={user.photo || "/assets/avatar.webp"}
                alt={`Profile Photo - ${user?.name}`}
              />
            </div>
            <h2 className={"ellipsis l-1"}>{user.name}</h2>
            <p className={s.role}>{user.role?.name}</p>
          </div>
        </Link>

        <ul className={s.links}>
          {sidebarItems.current.map((item, i, arr) => (
            <li
              key={item.path}
              className={location.pathname === item.path ? s.active : ""}
            >
              <Link
                to={item.path}
                onClick={() => {
                  if (window.innerWidth <= 480) {
                    setSidebarOpen(false);
                  }
                }}
              >
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
              </Link>
            </li>
          ))}
        </ul>

        <button
          title="Log out"
          className={`clear ${s.logoutBtn}`}
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
          element={
            <Suspense
              fallback={
                <Loading
                  columns={user.userType === "staff" ? 5 : 3}
                  trStyle={{
                    gridTemplateColumns: `6rem 1fr 7rem ${
                      user.userType === "staff" ? "8rem" : ""
                    } 3rem`,
                  }}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            >
              <Deposits setSidebarOpen={setSidebarOpen} />
            </Suspense>
          }
        />
        <Route
          path={paths.expenses}
          element={
            <Suspense
              fallback={
                <Loading
                  columns={user.userType === "staff" ? 5 : 3}
                  trStyle={{
                    gridTemplateColumns: `6rem 1fr 7rem ${
                      user.userType === "staff" ? "8rem" : ""
                    } 3rem`,
                  }}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            >
              <Expenses setSidebarOpen={setSidebarOpen} />
            </Suspense>
          }
        />
        <Route
          path={paths.withdrawals}
          element={
            <Suspense
              fallback={
                <Loading
                  columns={user.userType === "staff" ? 5 : 3}
                  trStyle={{
                    gridTemplateColumns: `6rem 1fr 7rem ${
                      user.userType === "staff" ? "8rem" : ""
                    } 3rem`,
                  }}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            >
              <Withdrawals setSidebarOpen={setSidebarOpen} />
            </Suspense>
          }
        />
        <Route
          path={paths.milestones}
          element={
            <Suspense
              fallback={
                <Loading
                  columns={user.userType === "staff" ? 5 : 3}
                  trStyle={{
                    gridTemplateColumns: `6rem 1fr 7rem ${
                      user.userType === "staff" ? "8rem" : ""
                    } 3rem`,
                  }}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            >
              <Milestones setSidebarOpen={setSidebarOpen} />
            </Suspense>
          }
        />
        <Route
          path={paths.members}
          element={
            <Suspense
              fallback={
                <Loading
                  columns={user.userType === "staff" ? 5 : 3}
                  trStyle={{
                    gridTemplateColumns: `6rem 1fr 7rem ${
                      user.userType === "staff" ? "8rem" : ""
                    } 3rem`,
                  }}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            >
              <Members setSidebarOpen={setSidebarOpen} />
            </Suspense>
          }
        />
        <Route
          path={paths.staffs}
          element={
            <Suspense
              fallback={
                <Loading
                  columns={4}
                  trStyle={{ gridTemplateColumns: `1fr 9rem 8rem 3rem` }}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            >
              <Staffs setSidebarOpen={setSidebarOpen} />
            </Suspense>
          }
        />
        <Route
          path={paths.roles}
          element={
            <Suspense
              fallback={
                <Loading
                  columns={2}
                  trStyle={{ gridTemplateColumns: `1fr 5rem` }}
                  setSidebarOpen={setSidebarOpen}
                />
              }
            >
              <Roles setSidebarOpen={setSidebarOpen} />
            </Suspense>
          }
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
