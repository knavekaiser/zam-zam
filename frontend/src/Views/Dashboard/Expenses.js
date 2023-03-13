import DataTable from "Components/DataTable";
import { endpoints } from "config";
import { useContext } from "react";
import { SiteContext } from "SiteContext";

export default function Deposits({ setSidebarOpen }) {
  const { user } = useContext(SiteContext);
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
        } ${
          ["approve", "update", "delete"].some((item) =>
            user.role?.permissions?.includes(`expense_${item}`)
          )
            ? "3rem"
            : ""
        }`,
      }}
      deleteRequest
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
