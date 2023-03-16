import { useState, useEffect, useContext } from "react";
import { SiteContext } from "SiteContext";
import { Table, TableActions, Moment } from "Components/elements";
import { FaRegTrashAlt } from "react-icons/fa";
import { BiEditAlt, BiCheckDouble, BiFilter } from "react-icons/bi";
import { GoPlus } from "react-icons/go";
import { Prompt, Modal } from "Components/modal";
import s from "./dataTable.module.scss";
import { useFetch } from "hooks";
import { status } from "config";

import { Form, Filter } from "./Form";

const Data = ({
  setSidebarOpen,
  title,
  name,
  trStyle,
  deleteRequest,
  endpoint,
  schema,
}) => {
  const { user, checkPermission } = useContext(SiteContext);
  const [filters, setFilters] = useState({});
  const [data, setData] = useState([]);
  const [edit, setEdit] = useState(null);
  const [addData, setAddData] = useState(false);
  const [showAddBtn, setShowAddBtn] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const { get: getData, loading } = useFetch(endpoint);
  const { remove: deleteItem, loading: deletingItem } = useFetch(
    endpoint + "/{ID}"
  );
  const { remove: requestDelete, loading: requestingDelete } = useFetch(
    endpoint + "/{ID}/request"
  );
  const { put: approveItem, loading: approvingItem } = useFetch(
    endpoint +
      `/{ID}/${["member", "staff"].includes(name) ? "activate" : "approve"}`
  );

  useEffect(() => {
    getData({ query: filters })
      .then(({ data }) => {
        if (data.success) {
          return setData(data.data);
        }
      })
      .catch((err) => {
        console.log(err);
        Prompt({ type: "error", message: err.message });
      });
  }, [filters]);
  return (
    <div className={s.wrapper}>
      <div className={`${s.content} grid m-a`}>
        <div className={`${s.head} flex p-1`}>
          <h2 onClick={() => setSidebarOpen((prev) => !prev)}>{title}</h2>
          <>
            <button
              className={`btn clear ${s.filterBtn}`}
              onClick={() => setShowFilter(!showFilter)}
            >
              <BiFilter />
            </button>
            {showFilter && (
              <Filter
                filters={filters}
                schema={schema}
                setFilters={setFilters}
              />
            )}
          </>
        </div>
        <Table
          loading={loading}
          className={s.data}
          trStyle={trStyle}
          columns={[
            ...(schema?.some((item) => item.name === "name")
              ? [{ label: "Name" }]
              : []),
            ...(schema?.some((item) => item.name === "name") &&
            !schema?.some((item) => item.name === "role")
              ? [
                  { label: "Deposit", className: "text-right" },
                  { label: "Withdrawal", className: "text-right" },
                ]
              : []),
            ...(schema?.some((item) => item.name === "role")
              ? [{ label: "Role" }]
              : []),
            ...(schema?.some((item) => item.name === "date")
              ? [{ label: "Date" }]
              : []),
            ...(schema?.some((item) => item.name === "description")
              ? [{ label: "Description" }]
              : []),
            ...(schema?.some((item) => item.name === "member")
              ? [{ label: "Member" }]
              : []),
            ...(schema?.some((item) => item.name === "amount")
              ? [{ label: "Amount", className: "text-right" }]
              : []),
            ...(user.userType === "staff" ? [{ label: "Status" }] : []),
            ...(["approve", "update", "delete"].some((item) =>
              user.role?.permissions?.includes(`${name}_${item}`)
            )
              ? [{ label: "Action", className: "text-right" }]
              : []),
          ]}
          onScroll={(dir) => {
            if (dir === "down") {
              setShowAddBtn(false);
            } else {
              setShowAddBtn(true);
            }
          }}
        >
          {data.map((item) => (
            <tr key={item._id} style={trStyle}>
              {schema?.some((item) => item.name === "date") && (
                <td className={s.date}>
                  <Moment format="MMM DD, YYYY">{item.date}</Moment>
                </td>
              )}
              {schema?.some((item) => item.name === "name") && (
                <>
                  {window.innerWidth <= 480 && (
                    <td className={s.profileImg}>
                      <img src={user.photo || "/assets/avatar.webp"} />
                    </td>
                  )}
                  <td className={s.name}>{item.name}</td>
                </>
              )}
              {schema?.some((item) => item.name === "name") &&
                !schema?.some((item) => item.name === "role") && (
                  <>
                    <td className={`text-right ${s.deposit}`}>
                      <span className={s.currencySymbol}>৳</span>
                      {(item.deposit || 0).toLocaleString("en-IN")}
                    </td>
                    <td className={`text-right ${s.withdrawal}`}>
                      <span className={s.currencySymbol}>৳</span>
                      {(item.withdrawal || 0).toLocaleString("en-IN")}
                    </td>
                  </>
                )}
              {schema?.some((item) => item.name === "role") && (
                <>
                  <td className={s.role}>{item.role?.name}</td>
                </>
              )}
              {schema?.some((item) => item.name === "member") && (
                <td className={s.member}>{item.member?.name}</td>
              )}
              {schema?.some((item) => item.name === "description") && (
                <td className={s.member}>{item.description}</td>
              )}
              {schema?.some((item) => item.name === "amount") && (
                <td className={`text-right`}>
                  <span className={s.currencySymbol}>৳</span>
                  {item.amount.toLocaleString("en-IN")}
                </td>
              )}
              {user.userType === "staff" && (
                <td className={s.status}>
                  {status[item.status] || item.status}
                </td>
              )}
              <TableActions
                className={s.actions}
                actions={[
                  ...([
                    "pending-approval",
                    "pending-update",
                    "pending-activation",
                  ].includes(item.status) && checkPermission(`${name}_approve`)
                    ? [
                        {
                          icon: <BiCheckDouble />,
                          label: "Approve",
                          disabled: approvingItem,
                          callBack: () =>
                            Prompt({
                              type: "confirmation",
                              message: `Are you sure you want to approve this ${name}?`,
                              callback: () => {
                                approveItem(
                                  {},
                                  { params: { "{ID}": item._id } }
                                ).then(({ data }) => {
                                  if (data.success) {
                                    setData((prev) =>
                                      prev.map((item) =>
                                        item._id === data.data._id
                                          ? data.data
                                          : item
                                      )
                                    );
                                  } else {
                                    Prompt({
                                      type: "error",
                                      message: data.message,
                                    });
                                  }
                                });
                              },
                            }),
                        },
                      ]
                    : []),
                  ...(checkPermission(`${name}_update`)
                    ? [
                        {
                          icon: <BiEditAlt />,
                          label: "Edit",
                          callBack: () => {
                            setEdit(item);
                            setAddData(true);
                          },
                        },
                      ]
                    : []),

                  ...(deleteRequest &&
                  checkPermission(`${name}_request_delete`) &&
                  !["deleted", "pending-delete"].includes(item.status)
                    ? [
                        {
                          icon: <FaRegTrashAlt />,
                          label: "Request Delete",
                          disabled: requestingDelete,
                          callBack: () =>
                            Prompt({
                              type: "confirmation",
                              message: `Are you sure you want to request deletion of this ${title}?`,
                              callback: () => {
                                requestDelete(
                                  {},
                                  { params: { "{ID}": item._id } }
                                ).then(({ data }) => {
                                  if (data.success) {
                                    setData((prev) =>
                                      prev.filter((dep) => dep._id !== item._id)
                                    );
                                  } else {
                                    Prompt({
                                      type: "error",
                                      message: data.message,
                                    });
                                  }
                                });
                              },
                            }),
                        },
                      ]
                    : []),
                  ...((deleteRequest
                    ? item.status === "pending-delete"
                    : true) &&
                  !["deleted"].includes(item.status) &&
                  checkPermission(`${name}_delete`)
                    ? [
                        {
                          icon: <FaRegTrashAlt />,
                          label: "Delete",
                          disabled: deletingItem,
                          callBack: () =>
                            Prompt({
                              type: "confirmation",
                              message: `Are you sure you want to remove this ${title}?`,
                              callback: () => {
                                deleteItem(
                                  {},
                                  { params: { "{ID}": item._id } }
                                ).then(({ data }) => {
                                  if (data.success) {
                                    setData((prev) =>
                                      prev.filter((dep) => dep._id !== item._id)
                                    );
                                  } else {
                                    Prompt({
                                      type: "error",
                                      message: data.message,
                                    });
                                  }
                                });
                              },
                            }),
                        },
                      ]
                    : []),
                ]}
              />
            </tr>
          ))}
        </Table>
        <Modal
          open={addData}
          head
          label={`${edit ? "View / Update" : "Add"} ${title}`}
          className={s.addDataFormModal}
          setOpen={() => {
            setEdit(null);
            setAddData(false);
          }}
        >
          <Form
            edit={edit}
            endpoint={endpoint}
            schema={schema}
            onSuccess={(newData) => {
              if (edit) {
                setData((prev) =>
                  prev.map((item) =>
                    item._id === newData._id ? newData : item
                  )
                );
                setEdit(null);
              } else {
                setData((prev) => [...prev, newData]);
              }
              setAddData(false);
            }}
          />
        </Modal>

        {checkPermission(`${name}_create`) && (
          <button
            className={`btn m-a mr-0 ${s.addBtn} ${showAddBtn ? s.show : ""}`}
            onClick={() => setAddData(true)}
          >
            <GoPlus />
          </button>
        )}
      </div>
    </div>
  );
};

export default Data;
