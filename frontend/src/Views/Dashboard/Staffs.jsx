import DataTable from "Components/DataTable";
import { endpoints } from "config";
import { useContext } from "react";
import { SiteContext } from "@/SiteContext";

export default function Deposits({ setSidebarOpen }) {
  const { user } = useContext(SiteContext);
  const actionColumns = ["approve", "update", "delete"].some((item) =>
    user.role?.permissions?.includes(`staff_${item}`)
  );
  const filterStatus = [
    { label: "Pending Activation", value: "pending-activation" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];
  return (
    <DataTable
      key="Staffs"
      title="Staffs"
      name="staff"
      setSidebarOpen={setSidebarOpen}
      endpoint={endpoints.staffs}
      trStyle={{
        gridTemplateColumns: `1fr 9rem ${
          user.userType === "staff" ? "8rem" : ""
        } ${actionColumns ? "3rem" : ""}`,
      }}
      filterStatus={filterStatus}
      columns={[
        { label: "Name" },
        { label: "Role" },
        ...(user.userType === "staff" ? [{ label: "Status" }] : []),
        ...(actionColumns
          ? [{ label: "Action", className: "text-right" }]
          : []),
      ]}
      renderRow={(item, s, status) => (
        <>
          <td className={`${s.user} ${s.staff}`}>
            <img
              src={item.photo || "/assets/avatar.webp"}
              alt={`Staff Photo - ${item?.name}`}
            />
            <div className={s.detail}>
              <span className={s.name}>{item.name}</span>
              <span className={s.phone}>
                <a href={`tel:${item.phone}`}>{item.phone}</a>
              </span>
            </div>
          </td>
          <td className={s.role}>{item.role?.name}</td>
          {user.userType === "staff" && (
            <td className={s.status}>{status[item.status] || item.status}</td>
          )}
        </>
      )}
      schema={[
        {
          fieldType: "input",
          name: "name",
          label: "Name",
          required: true,
        },
        {
          fieldType: "select",
          label: "Role",
          url: endpoints.roles,
          name: "role",
          formOptions: { required: true },
          getQuery: (inputValue, selected) => ({
            ...(inputValue && { name: inputValue }),
            _id: selected,
          }),
          handleData: (item) => ({
            label: item.name,
            value: item._id,
          }),
        },
        // {
        //   fieldType: "textarea",
        //   name: "description",
        //   label: "Description",
        //   required: true,
        // },
      ]}
    />
  );
}
