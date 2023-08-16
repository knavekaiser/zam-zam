import { useState, useEffect, useContext } from "react";
import { Prompt } from "Components/modal";
import s from "./home.module.scss";
import { useFetch } from "hooks";
import { endpoints } from "config";
import { CountUp, Moment } from "Components/elements";
import { paths } from "config";
import { useNavigate } from "react-router-dom";
// import Chart from "chart.js/auto";
import { SiteContext } from "@/SiteContext";
import {
  BsList,
  BsPeople,
  BsPeopleFill,
  BsPerson,
  BsPersonFill,
} from "react-icons/bs";
import { Trans, useTranslation } from "react-i18next";

const Toggle = ({}) => {
  const { user, selfOnly, setSelfOnly } = useContext(SiteContext);

  if (user?.userType !== "member") {
    return null;
  }

  return (
    <button
      title="Toggle Personal or Group Data"
      className={`${s.selfOnlyToggle} ${selfOnly ? s.selfOnly : ""}`}
      onClick={() => setSelfOnly((prev) => !prev)}
    >
      <div className={s.left}>
        {selfOnly ? <BsPersonFill className={s.fill} /> : <BsPerson />}
      </div>
      <div className={s.right}>
        {!selfOnly ? <BsPeopleFill className={s.fill} /> : <BsPeople />}
      </div>
    </button>
  );
};

const Dashboard = ({ setSidebarOpen }) => {
  const { user, selfOnly } = useContext(SiteContext);
  const [data, setData] = useState({});

  const { get: getDashboardData, loading } = useFetch(endpoints.dashboardData);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboardData({ query: { selfOnly } })
      .then(({ data }) => {
        if (data.success) {
          return setData(data.data);
        }
      })
      .catch((err) => {
        console.log(err);
        Prompt({ type: "error", message: err.message });
      });
  }, [selfOnly]);
  return (
    <div className={`${s.contentWrapper} grid`}>
      <div
        className={`${s.head} flex all-columns justify-space-between align-center`}
      >
        <div
          className="flex align-center ml-1 pointer"
          onClick={() => setSidebarOpen((prev) => !prev)}
        >
          <BsList style={{ fontSize: "1.75rem" }} />
          <h2>
            <Trans>Dashboard</Trans>
          </h2>
        </div>

        <Toggle />
      </div>
      <div className={s.content}>
        {Object.values(data).length === 0 && (
          <>
            <div className={`${s.milestones} ${s.loading}`}>
              <div className={s.milestoneInfoWrapper}>
                <div className={s.milestoneInfo}>
                  <div className={s.left}>
                    <h4 className="skl-loading" />
                    <p className={`skl-loading`} />
                    <p className={`skl-loading`} />
                  </div>
                  <div className={s.right}>
                    <div className={`${s.money} skl-loading`} />
                    <p className={`skl-loading`} />
                  </div>
                </div>
              </div>

              <p className={`${s.progress} skl-loading`} />
            </div>
            <div className={`${s.card} ${s.loading}`}>
              <label className="skl-loading" />
              <p className={`${s.amount} skl-loading`} />
            </div>
            <div className={`${s.card} ${s.loading}`}>
              <label className="skl-loading" />
              <p className={`${s.amount} skl-loading`} />
            </div>
            <div className={`${s.card} ${s.loading}`}>
              <label className="skl-loading" />
              <p className={`${s.amount} skl-loading`} />
            </div>
            <div className={`${s.card} ${s.loading}`}>
              <label className="skl-loading" />
              <p className={`${s.amount} skl-loading`} />
            </div>
          </>
        )}

        {data.milestones?.length > 0 && (
          <Milestones milestones={data.milestones} />
        )}

        {"currentBalance" in data && (
          <Card
            label={<Trans>Current Balance</Trans>}
            amount={data.currentBalance}
          />
        )}
        {"incomes" in data && (
          <Card
            label={<Trans>Total Income</Trans>}
            amount={data.incomes.total}
            onClick={() => navigate(paths.incomes)}
          />
        )}
        {"deposits" in data && (
          <Card
            label={
              <Trans>
                {user.userType === "member" && selfOnly
                  ? "My Deposit"
                  : "Total Deposit"}
              </Trans>
            }
            amount={data.deposits.total}
            onClick={() => navigate(paths.deposits)}
          />
        )}
        {"expenses" in data && (
          <Card
            label={<Trans>Total Expense</Trans>}
            amount={data.expenses.total}
            onClick={() => navigate(paths.expenses)}
          />
        )}
        {"withdrawals" in data && (
          <Card
            label={
              <Trans>
                {user.userType === "member" && selfOnly
                  ? "My Withdrawal"
                  : "Total Withdrawal"}
              </Trans>
            }
            amount={data.withdrawals.total}
            onClick={() => navigate(paths.withdrawals)}
          />
        )}

        {/* <GraphComponent data={data} /> */}
      </div>
    </div>
  );
};

const Card = ({ label, amount, onClick = () => {} }) => {
  return (
    <div className={s.card} onClick={onClick}>
      <label>{label}</label>
      <p>
        <span className={s.currencySymbol}>৳</span>
        <span className={s.amount}>
          <CountUp
            number={amount}
            duration={Math.floor(Math.random() * 1000) + 2000}
          />
        </span>
      </p>
    </div>
  );
};

// function GraphComponent({ data }) {
//   useEffect(() => {
//     if (data) {
//       // Create chart
//       const chartData = {
//         labels: data.monthLabels,
//         datasets: [
//           "deposits" in data
//             ? {
//                 label: "Deposits",
//                 data: data.deposits.eachMonth,
//                 fill: false,
//                 borderColor: "#04eb77",
//                 tension: 0.5,
//               }
//             : null,
//           "expenses" in data
//             ? {
//                 label: "Expenses",
//                 data: data.expenses.eachMonth,
//                 fill: false,
//                 borderColor: "#f10372",
//                 tension: 0.5,
//               }
//             : null,
//           "withdrawals" in data
//             ? {
//                 label: "Withdrawals",
//                 data: data.withdrawals.eachMonth,
//                 fill: false,
//                 borderColor: "#fb8433",
//                 tension: 0.5,
//               }
//             : null,
//         ].filter(Boolean),
//       };
//       const ctx = document.getElementById("myChart").getContext("2d");
//       const chart = new Chart(ctx, {
//         type: "line",
//         data: chartData,
//         options: {
//           locale: "en-IN",
//           responsive: true,
//           scales: {
//             // ticks: {
//             //   display: false,
//             // },
//           },
//           plugins: {
//             legend: { display: false },
//             // title: {
//             //   display: false,
//             // },
//             ticks: {
//               display: false,
//             },
//           },
//         },
//       });

//       // Destroy chart when component unmounts
//       return () => chart.destroy();
//     }
//   }, [data]);

//   return <canvas id="myChart" />;
// }

const Milestones = ({ milestones }) => {
  const { user } = useContext(SiteContext);
  const [view, setView] = useState(milestones.length - 1);
  const { i18n } = useTranslation();
  return (
    <div className={s.milestones}>
      <div className={s.milestoneInfoWrapper}>
        <div
          className={s.milestoneInfo}
          style={{
            gridTemplateColumns: milestones.reduce((p, c) => p + "102% ", ""),
            transform: `translateX(-${102 * view}%)`,
          }}
        >
          {milestones.map((item, i) => (
            <div
              key={item._id}
              className={`${s.info} ${view === i ? s.view : ""}`}
            >
              <div className={s.left}>
                <h4>{item.title}</h4>
                <p className={s.dscr}>{item.description}</p>
              </div>
              <div className={s.right}>
                <div className={s.money}>
                  <span className={s.paid}>
                    <span className={s.currencySymbol}>৳</span>
                    <CountUp
                      number={
                        user.userType === "member"
                          ? item.myDeposit
                          : item.totalDeposited
                      }
                      offset={50}
                    />
                  </span>

                  <span>
                    / <span className={s.currencySymbol}>৳</span>
                    {(
                      (user.userType === "member"
                        ? item.perMember
                        : item.amount) || 0
                    ).toLocaleString(i18n.language)}
                  </span>
                </div>
                <div className={s.dates}>
                  <Moment className={s.startDate} format="MMM dd, yy">
                    {item.startDate}
                  </Moment>{" "}
                  -{" "}
                  <Moment format="MMM dd, yy" className={s.endDate}>
                    {item.endDate}
                  </Moment>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className={s.progressBars}
        style={{
          gridTemplateColumns: milestones.reduce(
            (p, c, j) =>
              p +
              (j === view
                ? "1fr "
                : j === view - 1 || j === view + 1
                ? `${window.innerWidth <= 480 ? 0.075 : 0.03}fr `
                : "0fr "),
            ""
          ),
        }}
      >
        {milestones.map((item, i, arr) => (
          <div
            key={item._id}
            className={`${s.singleBar} ${view === i ? s.view : ""} ${
              item.status === "ongoing" ? s.ongoing : ""
            }`}
            style={{
              marginRight:
                (view === i && arr[i + 1]) || view === i + 1 ? "3px" : "0",
              marginLeft:
                (view === i && arr[i - 1]) || view === i - 1 ? "3px" : "0",

              background: `linear-gradient(90deg, #0374361c ${
                (item.totalDeposited / item.amount) * 100 - 5
              }%, #ffffff05 ${(item.totalDeposited / item.amount) * 100 + 5}%)`,
            }}
            onClick={() => setView(i)}
          >
            <span
              className={s.progressWrapper}
              // style={{
              //   display: "inline-block",
              //   background: `linear-gradient(90deg, #0374361c ${95}%, #ffffff05 ${105}%)`,
              // }}
            >
              <span
                className={s.progress}
                style={{
                  width: `${Math.min(
                    (user.userType === "member"
                      ? item.myDeposit / item.perMember
                      : item.totalDeposited / item.amount) * 100,
                    100
                  )}%`,
                }}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
