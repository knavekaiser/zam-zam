import DataTable from "Components/DataTable";
import { endpoints } from "config";
import { useContext } from "react";
import { SiteContext } from "SiteContext";

export default function Deposits({ setSidebarOpen }) {
  const { user } = useContext(SiteContext);
  return (
    <DataTable
      key="Members"
      title="Members"
      name="member"
      setSidebarOpen={setSidebarOpen}
      endpoint={endpoints.members}
      trStyle={{
        gridTemplateColumns: `1fr 8rem 8rem ${
          user.userType === "staff" ? "8rem" : ""
        } ${
          ["approve", "update", "delete"].some((item) =>
            user.role?.permissions?.includes(`member_${item}`)
          )
            ? "3rem"
            : ""
        }`,
      }}
      schema={[
        {
          fieldType: "input",
          name: "name",
          label: "Name",
          required: true,
        },
        {
          fieldType: "input",
          name: "phone",
          label: "Phone",
          required: true,
        },
        {
          fieldType: "input",
          type: "email",
          name: "email",
          label: "Email",
        },
        {
          fieldType: "select",
          name: "status",
          label: "Status",
          options: [
            { label: "Active", value: "active" },
            { label: "Inctive", value: "inactive" },
          ],
          required: true,
          hideSearchIcon: true,
        },
        {
          fieldType: "textarea",
          name: "address",
          label: "Address",
        },
      ]}
    />
  );
}
