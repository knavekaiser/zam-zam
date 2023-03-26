import { useState, useEffect } from "react";
import { Prompt } from "Components/modal";
import s from "./home.module.scss";
import { useFetch } from "hooks";
import { endpoints } from "config";
import { Moment } from "Components/elements";
import { paths } from "config";
import { Link } from "react-router-dom";
import Chart from "chart.js/auto";

const Dashboard = ({ setSidebarOpen }) => {
  const [data, setData] = useState({});

  const { get: getDashboardData, loading } = useFetch(endpoints.dashboardData);

  useEffect(() => {
    getDashboardData()
      .then(({ data }) => {
        if (data.success) {
          return setData(data.data);
        }
      })
      .catch((err) => {
        console.log(err);
        Prompt({ type: "error", message: err.message });
      });
  }, []);
  return (
    <div className={`${s.contentWrapper} grid`}>
      <div className={`${s.head} flex all-columns`}>
        <h2 onClick={() => setSidebarOpen((prev) => !prev)}>Dashboard</h2>
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

        {data.milestones?.length && <Milestones milestones={data.milestones} />}

        {"currentBalance" in data && (
          <div className={s.card}>
            <label>Current Balance</label>
            <p>
              <span className={s.currencySymbol}>৳</span>
              <span className={s.amount}>
                {(data.currentBalance || 0).toLocaleString("en-IN")}
              </span>
            </p>
          </div>
        )}
        {"deposits" in data && (
          <Link to={paths.deposits}>
            <div className={s.card}>
              <label>Total Deposit</label>
              <p>
                <span className={s.currencySymbol}>৳</span>
                <span className={s.amount}>
                  {(data.deposits.total || 0).toLocaleString("en-IN")}
                </span>
              </p>
            </div>
          </Link>
        )}
        {"expenses" in data && (
          <Link to={paths.expenses}>
            <div className={s.card}>
              <label>Total Expense</label>
              <p>
                <span className={s.currencySymbol}>৳</span>
                <span className={s.amount}>
                  {(data.expenses.total || 0).toLocaleString("en-IN")}
                </span>
              </p>
            </div>
          </Link>
        )}
        {"withdrawals" in data && (
          <Link to={paths.withdrawals}>
            <div className={s.card}>
              <label>Total Withdrawal</label>
              <p>
                <span className={s.currencySymbol}>৳</span>
                <span className={s.amount}>
                  {(data.withdrawals.total || 0).toLocaleString("en-IN")}
                </span>
              </p>
            </div>
          </Link>
        )}

        <GraphComponent data={data} />
      </div>
    </div>
  );
};

function GraphComponent({ data }) {
  useEffect(() => {
    if (data) {
      // Create chart
      const chartData = {
        labels: data.monthLabels,
        datasets: [
          "deposits" in data
            ? {
                label: "Deposits",
                data: data.deposits.eachMonth,
                fill: false,
                borderColor: "#04eb77",
                tension: 0.5,
              }
            : null,
          "expenses" in data
            ? {
                label: "Expenses",
                data: data.expenses.eachMonth,
                fill: false,
                borderColor: "#f10372",
                tension: 0.5,
              }
            : null,
          "withdrawals" in data
            ? {
                label: "Withdrawals",
                data: data.withdrawals.eachMonth,
                fill: false,
                borderColor: "#fb8433",
                tension: 0.5,
              }
            : null,
        ].filter(Boolean),
      };
      const ctx = document.getElementById("myChart").getContext("2d");
      const chart = new Chart(ctx, {
        type: "line",
        data: chartData,
        options: {
          locale: "en-IN",
          responsive: true,
          scales: {
            // ticks: {
            //   display: false,
            // },
          },
          plugins: {
            legend: { display: false },
            // title: {
            //   display: false,
            // },
            ticks: {
              display: false,
            },
          },
        },
      });

      // Destroy chart when component unmounts
      return () => chart.destroy();
    }
  }, [data]);

  return <canvas id="myChart" />;
}

const Milestones = ({ milestones }) => {
  const [view, setView] = useState(milestones.length - 1);
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
                    {(item.myDeposit || 0).toLocaleString("en-IN")}
                  </span>

                  <span>
                    {" "}
                    / <span className={s.currencySymbol}>৳</span>
                    {(item.perMember || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className={s.dates}>
                  <Moment className={s.startDate} format="MMM DD 'YY">
                    {item.startDate}
                  </Moment>{" "}
                  -{" "}
                  <Moment format="MMM DD 'YY" className={s.endDate}>
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
                  width: `${(item.myDeposit / item.perMember) * 100}%`,
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
