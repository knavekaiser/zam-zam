import { useState, useEffect, useContext, useRef } from "react";
import { SiteContext } from "@/SiteContext";
import { Table, TableActions } from "Components/elements";
import { FaRegTrashAlt } from "react-icons/fa";
import { BiEditAlt, BiCheckDouble, BiFilter, BiDetail } from "react-icons/bi";
import { GoPlus } from "react-icons/go";
import { Prompt, Modal } from "Components/modal";
import s from "./dataTable.module.scss";
import { useFetch } from "hooks";
import { status } from "config";
import { cubicBezier } from "framer-motion";
import { Form, PaymentForm, Filter } from "./Form";
import Detail from "./Detail";
import { BsList, BsX } from "react-icons/bs";
import { Trans, useTranslation } from "react-i18next";

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
  prefillValues,
  parseValues,
  filterStatus,
}) => {
  const tableRef = useRef();
  const { checkPermission } = useContext(SiteContext);
  const [filters, setFilters] = useState({});
  const [edit, setEdit] = useState(null);
  const [addData, setAddData] = useState(false);
  const [showAddBtn, setShowAddBtn] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [view, setView] = useState(null);
  const [paymentForm, setPaymentForm] = useState(null);
  const { t } = useTranslation();

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

  return (
    <div className={s.wrapper}>
      <div className={`${s.content} grid m-a`}>
        <div className={`${s.head} flex`}>
          <div
            className={`flex align-center pointer gap_5  ml-1`}
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <BsList style={{ fontSize: "1.75rem" }} />
            <h2>
              <Trans>{title}</Trans>
            </h2>
          </div>
          <>
            <button
              title="Toggle Filters"
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
          ref={tableRef}
          className={s.data}
          trStyle={trStyle}
          filters={filters}
          columns={columns}
          onScroll={(dir) => {
            if (dir === "down") {
              setShowAddBtn(false);
            } else {
              setShowAddBtn(true);
            }
          }}
          pagination
          url={endpoint}
          renderRow={(item) => (
            <tr key={item._id} style={trStyle}>
              {renderRow(item, s, status)}

              {columns.some(
                (item) =>
                  (item.label?.props?.children || item.label) === "Action"
              ) && (
                <TableActions
                  className={s.actions}
                  actions={[
                    ...(viewDetail
                      ? [
                          {
                            icon: <BiDetail />,
                            label: <Trans>View Detail</Trans>,
                            onClick: () => {
                              setView({ ...item, type: title.slice(0, -1) });
                            },
                          },
                        ]
                      : []),
                    ...(name === "supplier" &&
                    item.payment?.due > 0 &&
                    checkPermission("bill_create")
                      ? [
                          {
                            icon: <BiCheckDouble />,
                            label: <Trans>Make Payment</Trans>,
                            disabled: approvingItem,
                            onClick: () => {
                              setPaymentForm(item);
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
                            label: <Trans>Approve</Trans>,
                            disabled: approvingItem,
                            onClick: () =>
                              Prompt({
                                type: "confirmation",
                                message: `Are you sure you want to approve this ${name}?`,
                                callback: () => {
                                  approveItem(
                                    {},
                                    { params: { "{ID}": item._id } }
                                  ).then(({ data }) => {
                                    if (data.success) {
                                      tableRef.current.setData((prev) =>
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
                            label: <Trans>Edit</Trans>,
                            onClick: () => {
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
                            label: <Trans>Request Delete</Trans>,
                            disabled: requestingDelete,
                            onClick: () =>
                              Prompt({
                                type: "confirmation",
                                message: `Are you sure you want to request deletion of this ${title}?`,
                                callback: () => {
                                  requestDelete(
                                    {},
                                    { params: { "{ID}": item._id } }
                                  ).then(({ data }) => {
                                    if (data.success) {
                                      tableRef.current.setData((prev) =>
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
                            label: <Trans>Delete</Trans>,
                            disabled: deletingItem,
                            onClick: () =>
                              Prompt({
                                type: "confirmation",
                                message: `Are you sure you want to remove this ${title}?`,
                                callback: () => {
                                  deleteItem(
                                    {},
                                    { params: { "{ID}": item._id } }
                                  ).then(({ data }) => {
                                    if (data.success) {
                                      tableRef.current.setData((prev) =>
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
          )}
        />

        <Modal
          open={addData}
          head
          label={<Trans>{`${edit ? "View / Update" : "Add"} ${name}`}</Trans>}
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
                tableRef.current.setData((prev) =>
                  prev.map((item) =>
                    item._id === newData._id ? newData : item
                  )
                );
                setEdit(null);
              } else {
                tableRef.current.setData((prev) => [...prev, newData]);
              }
              setAddData(false);
            }}
            prefillValues={prefillValues}
            parseValues={parseValues}
          />
        </Modal>

        <Modal
          open={paymentForm}
          head
          label={<Trans>Make Payment</Trans>}
          className={s.paymentFormModal}
          setOpen={() => {
            setPaymentForm(false);
          }}
        >
          <PaymentForm
            supplier={paymentForm}
            onSuccess={(newData) => {
              tableRef.current.setData((prev) =>
                prev.map((item) => (item._id === newData._id ? newData : item))
              );
              setPaymentForm(false);
            }}
            prefillValues={prefillValues}
            parseValues={parseValues}
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
            title="Close Detail"
            className="btn clear"
            type="button"
            onClick={() => setView(null)}
          >
            <BsX />
          </button>
          <Detail data={view} />
        </Modal>

        {checkPermission(`${name}_create`) && (
          <button
            title={t(`Add New ${name}`)}
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
