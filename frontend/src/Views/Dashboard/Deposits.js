import DataTable from "Components/DataTable";
import { Moment } from "Components/elements";
import { endpoints } from "config";
import { useContext } from "react";
import { SiteContext } from "SiteContext";

export default function Deposits({ setSidebarOpen }) {
  const { user } = useContext(SiteContext);
  const actionColumns = ["approve", "update", "delete"].some((item) =>
    user.role?.permissions?.includes(`deposit_${item}`)
  );
  const filterStatus = [
    ...(["deposit_create", "deposit_update", "deposit_approve"].some((item) =>
      user.role.permissions?.includes(item)
    )
      ? [{ label: "Pending Approval", value: "pending-approval" }]
      : []),
    { label: "Approved", value: "approved" },
    ...(user.role.permissions?.includes("deposit_delete")
      ? [{ label: "Pending Delete", value: "pending-delete" }]
      : []),
    ...(user.role.name === "Manager"
      ? [{ label: "Deleted", value: "deleted" }]
      : []),
  ];
  return (
    <DataTable
      key="Deposits"
      title="Deposits"
      name="deposit"
      setSidebarOpen={setSidebarOpen}
      endpoint={endpoints.deposits}
      trStyle={{
        gridTemplateColumns: `6rem 1fr 7rem ${
          user.userType === "staff" ? "8rem" : ""
        } ${actionColumns ? "3rem" : ""}`,
        // gridTemplateRows: "1fr 1fr 1.5rem",
      }}
      deleteRequest
      columns={[
        { label: "Date" },
        { label: "Member" },
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
          <td className={s.user}>
            <img src={item.member.photo || "/assets/avatar.webp"} />
            <div className={s.detail}>
              <span className={s.name}>{item.member?.name}</span>
              <span className={s.phone}>
                <a href={`tel:${item.member?.phone}`}>{item.member.phone}</a>
              </span>
            </div>
          </td>
          <td className={`text-right`}>
            <span className={s.currencySymbol}>৳</span>
            {item.amount.toLocaleString("en-IN")}
          </td>
          {user.userType === "staff" && (
            <td className={s.status}>{status[item.status] || item.status}</td>
          )}
        </>
      )}
      filterStatus={filterStatus.length > 0 ? filterStatus : []}
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
          fieldType: "select",
          label: "Milestone",
          url: endpoints.milestones,
          name: "milestone",
          formOptions: { required: true },
          getQuery: (inputValue, selected) => ({
            ...(inputValue && { title: inputValue }),
            status: ["past-due", "ongoing"],
            ...(selected && { _id: selected }),
          }),
          handleData: (item) => ({
            label: item.title,
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
      ]}
    />
  );
}
