import DataTable from "Components/DataTable";
import { Moment } from "Components/elements";
import { endpoints } from "config";
import { useContext } from "react";
import { SiteContext } from "@/SiteContext";
import { Trans, useTranslation } from "react-i18next";

export default function Deposits({ setSidebarOpen }) {
  const { i18n } = useTranslation();
  const { user } = useContext(SiteContext);
  const actionColumns = ["update", "delete"].some((item) =>
    user.role?.permissions?.includes(`milestone_${item}`)
  );
  const filterStatus = [
    { label: <Trans>Ongoing</Trans>, value: "ongoing" },
    { label: <Trans>Upcoming</Trans>, value: "upcoming" },
    { label: <Trans>Complete</Trans>, value: "complete" },
    { label: <Trans>Past Due</Trans>, value: "past-due" },
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
        { label: <Trans>Title</Trans> },
        { label: <Trans>Start Date</Trans> },
        { label: <Trans>End Date</Trans> },
        { label: <Trans>Amount</Trans>, className: "text-right" },
        { label: <Trans>Deposited</Trans>, className: "text-right" },
        ...(user.userType === "staff"
          ? [{ label: <Trans>Status</Trans> }]
          : []),
        ...(actionColumns
          ? [{ label: <Trans>Action</Trans>, className: "text-right" }]
          : []),
      ]}
      filterStatus={filterStatus}
      renderRow={(item, s, status) => (
        <>
          <td className={s.name}>{item.title}</td>
          <td className={s.startDate}>
            <span className={s.cardLabel}>
              <Trans>Start</Trans>:
            </span>{" "}
            <Moment format="MMM dd, yy">{item.startDate}</Moment>
          </td>
          <td className={s.endDate}>
            <span className={s.cardLabel}>
              <Trans>End</Trans>:
            </span>{" "}
            <Moment format="MMM dd, yy">{item.endDate}</Moment>
          </td>

          <td className={`text-right ${s.milestoneAmount}`}>
            <span className={s.currencySymbol}>৳</span>
            {(item.amount || 0).toLocaleString(i18n.language)}
          </td>
          <td className={`text-right ${s.milestoneDeposited}`}>
            <span className={s.currencySymbol}>৳</span>
            {(item.totalDeposited || 0).toLocaleString(i18n.language)}
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
