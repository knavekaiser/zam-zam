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

const Message = ({ s, id }) => {
  const [formOpen, setFormOpen] = useState(false);
  const { post: sendMessages, loading } = useFetch(
    endpoints.sendMessageToMembers
  );
  const { handleSubmit, control } = useForm({
    resolver: useYup(
      yup.object({
        message: yup
          .string()
          .required("Field is required")
          .max(250, "Enter less than 250 characters."),
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
        label="Send Message"
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
              Send Message
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default function Deposits({ setSidebarOpen }) {
  const { user } = useContext(SiteContext);
  const actionColumns = ["approve", "update", "delete"].some((item) =>
    user.role?.permissions?.includes(`member_${item}`)
  );
  const filterStatus = [
    { label: "Pending Activation", value: "pending-activation" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];
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
        } ${actionColumns ? "3rem" : ""}`,
      }}
      columns={[
        { label: "Name" },
        { label: "Deposit", className: "text-right" },
        { label: "Withdrawal", className: "text-right" },
        ...(user.userType === "staff" ? [{ label: "Status" }] : []),
        ...(actionColumns
          ? [{ label: "Action", className: "text-right" }]
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
            {(item.deposit || 0).toLocaleString("en-IN")}
          </td>
          <td className={`text-right ${s.withdrawal}`}>
            <span className={s.currencySymbol}>৳</span>
            {(item.withdrawal || 0).toLocaleString("en-IN")}
          </td>
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
