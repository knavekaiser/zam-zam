import DataTable from "Components/DataTable";
import { Moment } from "Components/elements";
import { endpoints } from "config";
import { useContext } from "react";
import { SiteContext } from "@/SiteContext";
import { Trans, useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

export default function Deposits({ setSidebarOpen }) {
  const { i18n } = useTranslation();
  const { user } = useContext(SiteContext);
  const actionColumns = ["update", "delete"].some((item) =>
    user.role?.permissions?.includes(`milestone_${item}`)
  );
  const { supplier_id } = useParams();
  const filterStatus = [
    { label: <Trans>Ongoing</Trans>, value: "ongoing" },
    { label: <Trans>Upcoming</Trans>, value: "upcoming" },
    { label: <Trans>Complete</Trans>, value: "complete" },
    { label: <Trans>Past Due</Trans>, value: "past-due" },
    { label: <Trans>Deleted</Trans>, value: "deleted" },
  ];
  return (
    <DataTable
      key="Payments"
      title="Payments"
      name="bill"
      setSidebarOpen={setSidebarOpen}
      endpoint={endpoints.supplierPayments.replace(":supplier_id", supplier_id)}
      trStyle={{
        gridTemplateColumns: `1fr 10rem 7rem ${actionColumns ? "3rem" : ""}`,
      }}
      columns={[
        { label: <Trans>Date</Trans> },
        { label: <Trans>Payment Method</Trans> },
        { label: <Trans>Amount</Trans>, className: "text-right" },
        ...(actionColumns
          ? [{ label: <Trans>Action</Trans>, className: "text-right" }]
          : []),
      ]}
      filterStatus={filterStatus}
      renderRow={(item, s, status) => (
        <>
          <td className={s.date}>
            <Moment format="MMM dd, yy">{item.date}</Moment>
          </td>
          <td>{item.paymentMethod}</td>

          <td className={`text-right`}>
            <span className={s.currencySymbol}>৳</span>
            {(item.amount || 0).fix(0, i18n.language)}
          </td>
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
          label: "Payment Method",
          name: "paymentMethod",
          clearable: false,
          formOptions: { required: true },
          options: [
            { label: "Cash", value: "Cash" },
            { label: "Cheque", value: "Cheque" },
            { label: "Bank Transfer", value: "Bank Transfer" },
          ],
        },
        {
          fieldType: "input",
          type: "number",
          name: "amount",
          label: "Amount",
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
