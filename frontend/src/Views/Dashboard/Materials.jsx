import DataTable from "Components/DataTable";
import { endpoints } from "config";
import { Trans, useTranslation } from "react-i18next";
import phone from "phone";

export default function Suppliers({ setSidebarOpen }) {
  const { i18n } = useTranslation();
  return (
    <DataTable
      key="Materials"
      title="Materials"
      name="material"
      setSidebarOpen={setSidebarOpen}
      endpoint={endpoints.materials}
      trStyle={{
        gridTemplateColumns: `1fr 8rem 8rem`,
      }}
      columns={[
        { label: <Trans>Name</Trans> },
        { label: <Trans>Purchased</Trans>, className: "text-right" },
        { label: <Trans>Cost</Trans>, className: "text-right" },
      ]}
      pagination={false}
      renderRow={(item, s, status) => (
        <>
          <td>{item.name}</td>
          <td className={`text-right`}>
            {(item.qty || 0).fix(2, i18n.language)} {item.unit}
          </td>
          <td className={`text-right`}>
            ৳ {(item.cost || 0).fix(2, i18n.language)}
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
      ]}
    />
  );
}
