import { useState, useEffect, useContext } from "react";
import { SiteContext } from "SiteContext";
import { Table, TableActions } from "Components/elements";
import { FaRegTrashAlt } from "react-icons/fa";
import { BiEditAlt, BiCheckDouble, BiFilter, BiDetail } from "react-icons/bi";
import { GoPlus } from "react-icons/go";
import { Prompt, Modal } from "Components/modal";
import s from "./dataTable.module.scss";
import { useFetch } from "hooks";
import { status } from "config";
import { cubicBezier, motion } from "framer-motion";
import { Form, Filter } from "./Form";
import Detail from "./Detail";
import { IoClose } from "react-icons/io5";
import { BsList } from "react-icons/bs";

const Data = ({
  setSidebarOpen,
  title,
  name,
  columns,
  renderRow,
  trStyle,
  viewDetail,
  deleteRequest,
  endpoint,
  schema,
  filterStatus,
}) => {
  const { user, checkPermission } = useContext(SiteContext);
  const [filters, setFilters] = useState({});
  const [data, setData] = useState([]);
  const [edit, setEdit] = useState(null);
  const [addData, setAddData] = useState(false);
  const [showAddBtn, setShowAddBtn] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [view, setView] = useState(null);

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
          <div
            className={`flex align-center pointer gap_5 ${
              window.innerWidth <= 480 ? "ml-1" : ""
            }`}
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <BsList style={{ fontSize: "1.75rem" }} />
            <h2>{title}</h2>
          </div>
          <>
            <button
              className={`btn clear ${s.filterBtn}`}
              onClick={() => setShowFilter(!showFilter)}
            >
              <span
                className={`${s.indicator} ${
                  Object.values(filters).length > 0 ? s.active : ""
                }`}
              />
              <BiFilter />
            </button>
            <Filter
              showFilter={showFilter}
              close={() => setShowFilter(false)}
              filters={filters}
              schema={schema}
              filterStatus={filterStatus}
              setFilters={setFilters}
            />
          </>
        </div>

        <Table
          loading={loading}
          className={s.data}
          trStyle={trStyle}
          columns={columns}
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
              {renderRow(item, s, status)}

              {columns.some((item) => item.label === "Action") && (
                <TableActions
                  className={s.actions}
                  actions={[
                    ...(viewDetail
                      ? [
                          {
                            icon: <BiDetail />,
                            label: "View Detail",
                            callBack: () => {
                              setView({ ...item, type: title.slice(0, -1) });
                            },
                          },
                        ]
                      : []),
                    ...([
                      "pending-approval",
                      "pending-update",
                      "pending-activation",
                    ].includes(item.status) &&
                    checkPermission(`${name}_approve`)
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
                                        checkPermission(`${name}_delete`)
                                          ? prev.map((i) =>
                                              i._id === item._id
                                                ? {
                                                    ...item,
                                                    status: "pending-delete",
                                                  }
                                                : i
                                            )
                                          : prev.filter(
                                              (i) => i._id !== item._id
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
                                        prev.filter(
                                          (dep) => dep._id !== item._id
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
                  ]}
                />
              )}
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

        <Modal
          open={view}
          className={s.addDetailModal}
          setOpen={() => {
            setView(null);
          }}
          entryAnimation={{
            initial: {
              opacity: 0,
              // scale: 1.3,
              translateY: "4rem",
            },
            animation: {
              opacity: 1,
              // scale: 1,
              translateY: "0",
              transition: {
                type: "ease",
                mass: 0.5,
                damping: 10,
                stiffness: 80,
              },
            },
          }}
          exitAnimation={{
            opacity: 0,
            translateY: "8rem",
            transition: {
              type: "tween",
              easing: cubicBezier([0, 0.46, 0.21, 0.98]),
            },
          }}
        >
          <button
            className="btn clear"
            type="button"
            onClick={() => setView(null)}
          >
            <IoClose />
          </button>
          <Detail data={view} />
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
