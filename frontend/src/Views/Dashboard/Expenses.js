import DataTable from "Components/DataTable";
import { Moment } from "Components/elements";
import { endpoints } from "config";
import { useContext } from "react";
import { SiteContext } from "SiteContext";

export default function Deposits({ setSidebarOpen }) {
  const { user } = useContext(SiteContext);
  const actionColumns = ["approve", "update", "delete"].some((item) =>
    user.role?.permissions?.includes(`expense_${item}`)
  );
  const filterStatus = [
    ...(["expense_create", "expense_update", "expense_approve"].some((item) =>
      user.role.permissions?.includes(item)
    )
      ? [{ label: "Pending Approval", value: "pending-approval" }]
      : []),
    { label: "Approved", value: "approved" },
    ...(user.role.permissions?.includes("expense_delete")
      ? [{ label: "Pending Delete", value: "pending-delete" }]
      : []),
    ...(user.role.name === "Manager"
      ? [{ label: "Deleted", value: "deleted" }]
      : []),
  ];
  return (
    <DataTable
      key="Expenses"
      title="Expenses"
      name="expense"
      setSidebarOpen={setSidebarOpen}
      endpoint={endpoints.expenses}
      trStyle={{
        gridTemplateColumns: `6rem 1fr 7rem ${
          user.userType === "staff" ? "8rem" : ""
        } ${actionColumns ? "3rem" : ""}`,
      }}
      deleteRequest
      filterStatus={filterStatus}
      columns={[
        { label: "Date" },
        { label: "Description" },
        { label: "Amount", className: "text-right" },
        ...(user.userType === "staff" ? [{ label: "Status" }] : []),
        ...(actionColumns
          ? [{ label: "Action", className: "text-right" }]
          : []),
      ]}
      renderRow={(item, s, status) => (
        <>
          <td className={s.date}>
            <Moment format="MMM DD, YYYY">{item.date}</Moment>
          </td>
          <td className={s.member}>{item.description}</td>
          <td className={`text-right`}>
            <span className={s.currencySymbol}>৳</span>
            {item.amount.toLocaleString("en-IN")}
          </td>
          {user.userType === "staff" && (
            <td className={s.status}>{status[item.status] || item.status}</td>
          )}
        </>
      )}
      schema={[
        {
          fieldType: "input",
          type: "date",
          name: "date",
          label: "Date",
          required: true,
        },
        {
          fieldType: "input",
          type: "number",
          name: "amount",
          label: "Amount",
          required: true,
        },
        {
          fieldType: "textarea",
          name: "description",
          label: "Description",
          required: true,
        },
      ]}
    />
  );
}
