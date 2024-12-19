import DataTable from "Components/DataTable";
import { Moment } from "Components/elements";
import { endpoints } from "config";
import { useContext } from "react";
import { SiteContext } from "@/SiteContext";
import { Trans, useTranslation } from "react-i18next";

export default function Deposits({ setSidebarOpen }) {
  const { i18n } = useTranslation();
  const { user } = useContext(SiteContext);
  const actionColumns = ["approve", "update", "delete"].some((item) =>
    user.role?.permissions?.includes(`expense_${item}`)
  );
  const filterStatus = [
    ...(["expense_create", "expense_update", "expense_approve"].some((item) =>
      user.role.permissions?.includes(item)
    )
      ? [{ label: <Trans>Pending Approval</Trans>, value: "pending-approval" }]
      : []),
    { label: <Trans>Approved</Trans>, value: "approved" },
    ...(user.role.permissions?.includes("expense_delete")
      ? [{ label: <Trans>Pending Delete</Trans>, value: "pending-delete" }]
      : []),
    ...(user.role.name === "Manager"
      ? [{ label: <Trans>Deleted</Trans>, value: "deleted" }]
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
      viewDetail={user.userType === "staff"}
      columns={[
        { label: <Trans>Date</Trans> },
        { label: <Trans>Description</Trans> },
        { label: <Trans>Amount</Trans>, className: "text-right" },
        ...(user.userType === "staff"
          ? [{ label: <Trans>Status</Trans> }]
          : []),
        ...(actionColumns
          ? [{ label: <Trans>Action</Trans>, className: "text-right" }]
          : []),
      ]}
      renderRow={(item, s, status) => (
        <>
          <td className={s.date}>
            <Moment format="MMM dd, yy">{item.date}</Moment>
          </td>
          <td className={s.description}>{item.description}</td>
          <td className={`text-right`}>
            <span className={s.currencySymbol}>৳</span>
            {item.amount.toLocaleString(i18n.language)}
          </td>
          {user.userType === "staff" && (
            <td className={s.status}>
              <Trans>{status[item.status] || item.status}</Trans>
            </td>
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
        {
          fieldType: "fileInput",
          name: "documents",
          multiple: 5,
          dataType: "array",
          label: "Documents",
          accept: "image/*,application/pdf",
        },
      ]}
    />
  );
}
