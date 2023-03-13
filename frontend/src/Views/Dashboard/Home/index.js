import { useState, useEffect } from "react";
import { Prompt } from "Components/modal";
import s from "./sales.module.scss";
import { useFetch } from "hooks";
import { endpoints } from "config";

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
    <div className={`${s.content} grid gap-1 m-a p-1`}>
      <div className="flex all-columns">
        <h2 onClick={() => setSidebarOpen(true)}>Dashboard</h2>
      </div>
      <div className={s.card}>
        <label>Current Balance</label>
        <p>
          <span className={s.currencySymbol}>৳</span>
          <span className={s.amount}>
            {(data.currentBalance || 0).toLocaleString("en-IN")}
          </span>
        </p>
      </div>
      <div className={s.card}>
        <label>Total Deposit</label>
        <p>
          <span className={s.currencySymbol}>৳</span>
          <span className={s.amount}>
            {(data.totalDeposit || 0).toLocaleString("en-IN")}
          </span>
        </p>
      </div>
      <div className={s.card}>
        <label>Total Expense</label>
        <p>
          <span className={s.currencySymbol}>৳</span>
          <span className={s.amount}>
            {(data.totalExpense || 0).toLocaleString("en-IN")}
          </span>
        </p>
      </div>
      <div className={s.card}>
        <label>Total Withdrawal</label>
        <p>
          <span className={s.currencySymbol}>৳</span>
          <span className={s.amount}>
            {(data.totalWithdrawal || 0).toLocaleString("en-IN")}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
