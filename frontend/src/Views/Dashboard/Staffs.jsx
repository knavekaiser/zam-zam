import DataTable from "Components/DataTable";
import { endpoints } from "config";
import { useContext } from "react";
import { SiteContext } from "@/SiteContext";
import { Trans } from "react-i18next";

export default function Deposits({ setSidebarOpen }) {
  const { user } = useContext(SiteContext);
  const actionColumns = ["approve", "update", "delete"].some((item) =>
    user.role?.permissions?.includes(`staff_${item}`)
  );
  const filterStatus = [
    { label: <Trans>Pending Activation</Trans>, value: "pending-activation" },
    { label: <Trans>Active</Trans>, value: "active" },
    { label: <Trans>Inactive</Trans>, value: "inactive" },
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
        { label: <Trans>Name</Trans> },
        { label: <Trans>Role</Trans> },
        ...(user.userType === "staff"
          ? [{ label: <Trans>Status</Trans> }]
          : []),
        ...(actionColumns
          ? [{ label: <Trans>Action</Trans>, className: "text-right" }]
          : []),
      ]}
      renderRow={(item, s, status) => (
        <>
          <td className={`${s.user} ${s.staff}`}>
            <img
              src={item.photo || "/asst/avatar.webp"}
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
            <td className={s.status}>
              <Trans>{status[item.status] || item.status}</Trans>
            </td>
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
