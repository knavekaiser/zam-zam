import DataTable from "Components/DataTable";
import { endpoints } from "config";
import { useContext } from "react";
import { SiteContext } from "SiteContext";

export default function Deposits({ setSidebarOpen }) {
  const { user } = useContext(SiteContext);
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
        } ${
          ["approve", "update", "delete"].some((item) =>
            user.role?.permissions?.includes(`staff_${item}`)
          )
            ? "3rem"
            : ""
        }`,
      }}
      deleteRequest
      columns={[
        { label: "Name" },
        { label: "Role" },
        ...(user.userType === "staff" ? [{ label: "Status" }] : []),
        ...(["approve", "update", "delete"].some((item) =>
          user.role?.permissions?.includes(`staff_${item}`)
        )
          ? [{ label: "Action", className: "text-right" }]
          : []),
      ]}
      renderRow={(item, s, status) => (
        <>
          {window.innerWidth <= 480 && (
            <td className={s.profileImg}>
              <img src={item.photo || "/assets/avatar.webp"} />
            </td>
          )}
          <td className={s.name}>{item.name}</td>
          <td className={s.role}>{item.role.name}</td>
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
