import DataTable from "Components/DataTable";
import { Moment } from "Components/elements";
import { endpoints } from "config";
import { useContext } from "react";
import { SiteContext } from "SiteContext";

export default function Deposits({ setSidebarOpen }) {
  const { user } = useContext(SiteContext);
  const actionColumns = ["update", "delete"].some((item) =>
    user.role?.permissions?.includes(`milestone_${item}`)
  );
  const filterStatus = [
    { label: "Ongoing", value: "ongoing" },
    { label: "Upcoming", value: "upcoming" },
    { label: "Complete", value: "complete" },
    { label: "Past Due", value: "past-due" },
  ];
  return (
    <DataTable
      key="Milestones"
      title="Milestones"
      name="milestone"
      setSidebarOpen={setSidebarOpen}
      endpoint={endpoints.milestones}
      trStyle={{
        gridTemplateColumns: `1fr 7rem 7rem 7rem 7rem ${
          user.userType === "staff" ? "4rem" : ""
        } ${actionColumns ? "3rem" : ""}`,
      }}
      columns={[
        { label: "Title" },
        { label: "Start Date" },
        { label: "End Date" },
        { label: "Amount", className: "text-right" },
        { label: "Deposited", className: "text-right" },
        ...(user.userType === "staff" ? [{ label: "Status" }] : []),
        ...(actionColumns
          ? [{ label: "Action", className: "text-right" }]
          : []),
      ]}
      filterStatus={filterStatus}
      renderRow={(item, s, status) => (
        <>
          <td className={s.name}>{item.title}</td>
          <td className={s.startDate}>
            <Moment format="MMM dd, yyyy">{item.startDate}</Moment>
          </td>
          <td className={s.endDate}>
            <Moment format="MMM dd, yyyy">{item.endDate}</Moment>
          </td>

          <td className={`text-right ${s.milestoneAmount}`}>
            <span className={s.currencySymbol}>৳</span>
            {(item.amount || 0).toLocaleString("en-IN")}
          </td>
          <td className={`text-right ${s.milestoneDeposited}`}>
            <span className={s.currencySymbol}>৳</span>
            {(item.totalDeposited || 0).toLocaleString("en-IN")}
          </td>

          {user.userType === "staff" && (
            <td className={s.status}>{status[item.status] || item.status}</td>
          )}
        </>
      )}
      schema={[
        {
          fieldType: "input",
          name: "title",
          label: "Title",
          required: true,
        },
        {
          fieldType: "textarea",
          name: "description",
          label: "Description",
        },
        {
          fieldType: "input",
          type: "date",
          name: "startDate",
          label: "Start Date",
          required: true,
        },
        {
          fieldType: "input",
          type: "date",
          name: "endDate",
          label: "End Date",
          required: true,
        },
        {
          fieldType: "input",
          type: "number",
          name: "amount",
          label: "Amount",
          required: true,
        },
        // put status here - maybe
      ]}
    />
  );
}
