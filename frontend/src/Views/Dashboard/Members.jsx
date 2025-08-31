import DataTable from "Components/DataTable";
import { endpoints } from "config";
import { useContext, useState } from "react";
import { SiteContext } from "@/SiteContext";
import { BiMessageSquareDots } from "react-icons/bi";
import { useForm } from "react-hook-form";
import { useFetch, useYup } from "hooks";
import { Textarea } from "Components/elements";
import { Modal, Prompt } from "Components/modal";
import * as yup from "yup";
import style from "./dashboard.module.scss";
import { Trans, useTranslation } from "react-i18next";

const Message = ({ s, id }) => {
  const { i18n } = useTranslation();
  const [formOpen, setFormOpen] = useState(false);
  const { post: sendMessages, loading } = useFetch(
    endpoints.sendMessageToMembers
  );
  const { handleSubmit, control } = useForm({
    resolver: useYup(
      yup.object({
        message: yup
          .string()
          .required(<Trans>Field is required</Trans>)
          .max(
            250,
            <Trans
              defaults="Enter less than {{num}} characters."
              values={{ num: (250).fix(0, i18n.language) }}
            />
          ),
      })
    ),
  });
  return (
    <>
      <button
        className={`btn clear ${s.msgBtn}`}
        onClick={() => setFormOpen(true)}
      >
        <BiMessageSquareDots />
      </button>
      <Modal
        head
        label={<Trans>Send SMS</Trans>}
        open={formOpen}
        setOpen={setFormOpen}
        className={style.messageFormModal}
      >
        <form
          onSubmit={handleSubmit((values) => {
            sendMessages({
              members: [id],
              message: values.message,
            })
              .then(({ data }) => {
                if (data.success) {
                  setFormOpen(false);
                  return Prompt({
                    type: "success",
                    message: "SMS sent successfully.",
                  });
                }
                return Prompt({
                  type: "error",
                  message: data.message,
                });
              })
              .catch((err) =>
                Prompt({
                  type: "error",
                  message: err.message,
                })
              );
          })}
        >
          <Textarea control={control} name="message" />

          <div className="btns">
            <button className="btn" disabled={loading} title="Submit">
              <Trans>Send SMS</Trans>
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default function Members({ setSidebarOpen }) {
  const { i18n } = useTranslation();
  const { user } = useContext(SiteContext);
  const actionColumns = ["approve", "update", "delete"].some((item) =>
    user.role?.permissions?.includes(`member_${item}`)
  );
  const filterStatus = [
    { label: <Trans>Pending Activation</Trans>, value: "pending-activation" },
    { label: <Trans>Active</Trans>, value: "active" },
    { label: <Trans>Inactive</Trans>, value: "inactive" },
  ];
  return (
    <DataTable
      key="Members"
      title="Members"
      name="member"
      setSidebarOpen={setSidebarOpen}
      endpoint={endpoints.members}
      pagination={false}
      trStyle={{
        gridTemplateColumns: `1fr 8rem 8rem ${
          user.userType === "staff" ? "8rem" : ""
        } ${actionColumns ? "3rem" : ""}`,
      }}
      columns={[
        { label: <Trans>Name</Trans> },
        { label: <Trans>Deposit</Trans>, className: "text-right" },
        { label: <Trans>Withdrawal</Trans>, className: "text-right" },
        ...(user.userType === "staff"
          ? [{ label: <Trans>Status</Trans> }]
          : []),
        ...(actionColumns
          ? [{ label: <Trans>Action</Trans>, className: "text-right" }]
          : []),
      ]}
      filterStatus={filterStatus}
      renderRow={(item, s, status) => (
        <>
          <td className={s.user}>
            <img
              src={item.photo || "/asst/avatar.webp"}
              alt={`Member Photo - ${item.name}`}
            />
            <div className={s.detail}>
              <span className={s.name}>{item.name}</span>
              <span className={s.phone}>
                <a href={`tel:${item.phone}`}>{item.phone}</a>
                <Message s={s} id={item._id} />
              </span>
            </div>
          </td>
          <td className={`text-right ${s.deposit}`}>
            <span className={s.currencySymbol}>৳</span>
            {(item.deposit || 0).fix(0, i18n.language)}
          </td>
          <td className={`text-right ${s.withdrawal}`}>
            <span className={s.currencySymbol}>৳</span>
            {(item.withdrawal || 0).fix(0, i18n.language)}
          </td>
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
