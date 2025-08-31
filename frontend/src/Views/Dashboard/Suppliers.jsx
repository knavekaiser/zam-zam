import DataTable from "Components/DataTable";
import { endpoints } from "config";
import { useContext } from "react";
import { SiteContext } from "@/SiteContext";
import { Trans, useTranslation } from "react-i18next";
import phone from "phone";
import { Link } from "react-router-dom";
import { paths } from "config";

export default function Suppliers({ setSidebarOpen }) {
  const { i18n } = useTranslation();
  const { user } = useContext(SiteContext);
  const actionColumns = ["approve", "update", "delete"].some((item) =>
    user.role?.permissions?.includes(`supplier_${item}`)
  );
  return (
    <DataTable
      key="Suppliers"
      title="Suppliers"
      name="supplier"
      setSidebarOpen={setSidebarOpen}
      endpoint={endpoints.suppliers}
      trStyle={{
        gridTemplateColumns: `1fr 8rem 8rem 8rem ${
          actionColumns ? "3rem" : ""
        }`,
      }}
      deleteRequest
      columns={[
        { label: <Trans>Name</Trans> },
        { label: <Trans>Purchase</Trans>, className: "text-right" },
        { label: <Trans>Paid</Trans>, className: "text-right" },
        { label: <Trans>Due</Trans>, className: "text-right" },
        ...(actionColumns
          ? [{ label: <Trans>Action</Trans>, className: "text-right" }]
          : []),
      ]}
      pagination={false}
      renderRow={(item, s, status) => (
        <>
          <td className={s.supplier}>
            <Link
              className={`mb_5`}
              to={`${paths.bills.replace(":supplier_id", item._id)}`}
            >
              {item.name}
            </Link>
            <div className="flex wrap gap_5">
              {(item.phones || []).map((phone) => (
                <span key={phone} className={s.phone}>
                  <a href={`tel:${phone}`}>{phone}</a>
                </span>
              ))}
            </div>
          </td>
          <td className={`${s.supplierLabel} text-right`}>
            <Trans>Purchase</Trans>
          </td>
          <td className={`${s.supplierPurchase} text-right`}>
            {(item.payment?.totalPurchase || 0).fix(2, i18n.language)}
          </td>
          <td className={`${s.supplierLabel} text-right`}>
            <Trans>Paid</Trans>
          </td>
          <td className={`${s.supplierPaid} text-right`}>
            {(item.payment?.totalPaid || 0).fix(2, i18n.language)}
          </td>
          <td className={s.supplierLine} />
          <td className={`${s.supplierLabel} text-right`}>
            <Trans>Due</Trans>
          </td>
          <td className={`${s.supplierDue} text-right`}>
            {(item.payment?.due || 0).fix(2, i18n.language)}
          </td>
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
