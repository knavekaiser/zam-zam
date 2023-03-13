import DataTable from "Components/DataTable";
import { endpoints } from "config";
import { useContext } from "react";
import { SiteContext } from "SiteContext";

export default function Deposits({ setSidebarOpen }) {
  const { user } = useContext(SiteContext);
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
        } ${
          ["approve", "update", "delete"].some((item) =>
            user.role?.permissions?.includes(`deposit_${item}`)
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
          fieldType: "select",
          label: "Member",
          url: endpoints.members,
          name: "member",
          formOptions: { required: true },
          getQuery: (inputValue, selected) => ({
            name: inputValue,
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
      ]}
    />
  );
}
