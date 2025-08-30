import DataTable from "Components/DataTable";
import { endpoints } from "config";
import { useContext } from "react";
import { SiteContext } from "@/SiteContext";
import { Trans } from "react-i18next";
import phone from "phone";

export default function Suppliers({ setSidebarOpen }) {
  const { user } = useContext(SiteContext);
  const actionColumns = ["approve", "update", "delete"].some((item) =>
    user.role?.permissions?.includes(`deposit_${item}`)
  );
  return (
    <DataTable
      key="Suppliers"
      title="Suppliers"
      name="supplier"
      setSidebarOpen={setSidebarOpen}
      endpoint={endpoints.suppliers}
      trStyle={{
        gridTemplateColumns: `1fr 1fr 1fr ${actionColumns ? "3rem" : ""}`,
      }}
      deleteRequest
      columns={[
        { label: <Trans>Name</Trans> },
        { label: <Trans>Phone</Trans> },
        { label: <Trans>Address</Trans> },
        ...(actionColumns
          ? [{ label: <Trans>Action</Trans>, className: "text-right" }]
          : []),
      ]}
      renderRow={(item, s, status) => (
        <>
          <td className={s.date}>{item.name}</td>
          <td className={s.user}>
            {(item.phones || []).map((phone) => (
              <span key={phone} className={s.phone}>
                <a href={`tel:${phone}`}>{phone}</a>
              </span>
            ))}
          </td>
          <td>{item.address}</td>
        </>
      )}
      schema={[
        {
          fieldType: "input",
          type: "text",
          name: "name",
          label: "Name",
        },
        {
          fieldType: "input",
          type: "text",
          name: "phones",
          label: "Phone Numbers",
          hint: "Separate multiple phone numbers with ;",
        },
        {
          fieldType: "textarea",
          name: "address",
          label: "Address",
        },
      ]}
      prefillValues={(edit) => ({
        name: edit?.name || "",
        phones: (edit?.phones || []).join("; "),
        address: edit?.address || "",
      })}
      parseValues={(values) => {
        const phones = values.phones
          ? values.phones
              .split(";")
              .map((number) => {
                const parsed = phone(number, { country: "bangladesh" });
                return parsed.phoneNumber || null;
              })
              .filter(Boolean)
          : [];
        return {
          name: values.name,
          phones,
          address: values.address,
        };
      }}
    />
  );
}
