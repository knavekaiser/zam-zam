import DataTable from "Components/DataTable";
import { Moment } from "Components/elements";
import { endpoints } from "config";
import { useContext } from "react";
import { SiteContext } from "@/SiteContext";
import { Trans, useTranslation } from "react-i18next";

export default function Withdrawals({ setSidebarOpen }) {
  const { i18n } = useTranslation();
  const { user } = useContext(SiteContext);
  const actionColumns = ["approve", "update", "delete"].some((item) =>
    user.role?.permissions?.includes(`withdrawal_${item}`)
  );
  const filterStatus = [
    ...(["withdrawal_create", "withdrawal_update", "withdrawal_approve"].some(
      (item) => user.role.permissions?.includes(item)
    )
      ? [{ label: <Trans>Pending Approval</Trans>, value: "pending-approval" }]
      : []),
    { label: <Trans>Approved</Trans>, value: "approved" },
    ...(user.role.permissions?.includes("withdrawal_delete")
      ? [{ label: <Trans>Pending Delete</Trans>, value: "pending-delete" }]
      : []),
    ...(user.role.name === "Manager"
      ? [{ label: <Trans>Deleted</Trans>, value: "deleted" }]
      : []),
  ];
  return (
    <DataTable
      key="Withdrawals"
      title="Withdrawals"
      name="withdrawal"
      setSidebarOpen={setSidebarOpen}
      endpoint={endpoints.withdrawals}
      trStyle={{
        gridTemplateColumns: `6rem 1fr 7rem ${
          user.userType === "staff" ? "8rem" : ""
        } ${actionColumns ? "3rem" : ""}`,
      }}
      deleteRequest
      viewDetail={user.userType === "staff"}
      filterStatus={filterStatus}
      columns={[
        { label: <Trans>Date</Trans> },
        { label: <Trans>Member</Trans> },
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
          <td className={s.user}>
            <img
              src={item.member?.photo || "/asst/avatar.webp"}
              alt={`Member Photo - ${item.member?.name}`}
            />
            <div className={s.detail}>
              <span className={s.name}>{item.member?.name}</span>
              <span className={s.phone}>
                <a href={`tel:${item.member?.phone}`}>{item.member.phone}</a>
              </span>
            </div>
          </td>
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
          fieldType: "select",
          label: "Member",
          url: endpoints.findMembers,
          name: "member",
          formOptions: { required: true },
          getQuery: (inputValue, selected) => ({
            ...(inputValue && { name: inputValue }),
            _id: selected,
          }),
          handleData: (item) => ({
            label: item.name,
            value: item._id,
          }),
          disabledOnEdit: true,
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
          name: "remark",
          label: "Remark",
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
