import { useState, useContext, useRef, useMemo } from "react";
import { SiteContext } from "@/SiteContext";
import { Moment, Table, TableActions } from "Components/elements";
import { FaRegTrashAlt } from "react-icons/fa";
import { BiDetail, BiEditAlt, BiFilter } from "react-icons/bi";
import { GoPlus } from "react-icons/go";
import { Prompt, Modal } from "Components/modal";
import s from "./dataTable.module.scss";
import { useFetch } from "hooks";

import { Form, Filter, PaymentForm } from "./Form";
import { endpoints } from "config";
import { BsArrowLeft, BsList, BsX } from "react-icons/bs";
import { Trans, useTranslation } from "react-i18next";
import { CgSpinner } from "react-icons/cg";
import { Link, useParams } from "react-router-dom";
import { paths } from "config";

const Data = ({ setSidebarOpen }) => {
  const { t, i18n } = useTranslation();
  const tableRef = useRef();
  const { checkPermission } = useContext(SiteContext);
  const [filters, setFilters] = useState({});
  const [edit, setEdit] = useState(null);
  const [addBill, setAddBill] = useState(false);
  const [view, setView] = useState(null);
  const [showAddBtn, setShowAddBtn] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const { supplier_id } = useParams();

  const { remove: deleteBill, loading: deletingBill } = useFetch(
    endpoints.bills + "/{ID}"
  );

  return (
    <div className={s.wrapper}>
      <div className={`${s.content} grid m-a`}>
        <div className={`${s.head} flex`}>
          <div className={`flex align-center pointer gap_5  ml-1`}>
            <button
              className="clear"
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              <BsList style={{ fontSize: "1.75rem" }} />
            </button>
            <Link to={paths.suppliers} className="grid">
              <BsArrowLeft style={{ fontSize: "1.75rem" }} />
            </Link>
            <h2>
              <Trans>Bills</Trans>
            </h2>
          </div>
          <>
            <button
              title="Toggle Filters"
              className={`btn clear ${s.filterBtn}`}
              onClick={() => setShowFilter(!showFilter)}
            >
              <BiFilter />
            </button>
            <Filter
              showFilter={showFilter}
              filters={filters}
              setFilters={setFilters}
            />
          </>
        </div>
        <Table
          ref={tableRef}
          className={s.data}
          columns={[
            { label: <Trans>Date</Trans> },
            { label: <Trans>Ref</Trans> },
            { label: <Trans>Supplier</Trans> },
            { label: <Trans>Total</Trans>, className: "text-right" },
            { label: <Trans>Paid</Trans>, className: "text-right" },
            { label: <Trans>Due</Trans>, className: "text-right" },
            { label: <Trans>Action</Trans>, className: "text-right" },
          ]}
          onScroll={(dir) => {
            if (dir === "down") {
              setShowAddBtn(false);
            } else {
              setShowAddBtn(true);
            }
          }}
          url={endpoints.bills}
          filters={{ ...filters, supplier: supplier_id }}
          pagination
          trStyle={{
            gridTemplateColumns: `6rem 6rem 1fr 7rem 7rem 7rem 3rem`,
          }}
          renderRow={(item) => {
            const total =
              item.items.reduce((p, c) => p + c.rate * c.qty, 0) +
              item.charges.reduce((p, c) => p + c.amount, 0) +
              (item.adjustment || 0);
            const paid = item.payments.reduce((p, c) => p + c.amount, 0);
            return (
              <tr
                key={item._id}
                style={{
                  gridTemplateColumns: `6rem 6rem 1fr 7rem 7rem 7rem 3rem`,
                }}
              >
                <td>
                  <Moment format="MMM dd, yy">{item.date}</Moment>
                </td>
                <td>{item.ref || "--"}</td>
                <td>{item.supplier?.name || "--"}</td>
                <td className="text-right">{total.fix(2, i18n.language)}</td>
                <td className="text-right">{paid.fix(2, i18n.language)}</td>
                <td className="text-right">
                  {(total - paid).fix(2, i18n.language)}
                </td>

                <TableActions
                  className={s.actions}
                  actions={[
                    {
                      icon: <BiDetail />,
                      label: <Trans>View Detail</Trans>,
                      onClick: () => {
                        setView(item);
                      },
                    },
                    ...(checkPermission(`bill_update`)
                      ? [
                          {
                            icon: <BiEditAlt />,
                            label: <Trans>Edit</Trans>,
                            onClick: () => {
                              setEdit(item);
                              setAddBill(true);
                            },
                          },
                        ]
                      : []),
                    ...(checkPermission(`bill_delete`)
                      ? [
                          {
                            icon: <FaRegTrashAlt />,
                            label: <Trans>Delete</Trans>,
                            disabled: deletingBill,
                            onClick: () =>
                              Prompt({
                                type: "confirmation",
                                message: (
                                  <Trans>
                                    Are you sure you want to remove this bill?
                                  </Trans>
                                ),
                                callback: () => {
                                  deleteBill(
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
              </tr>
            );
          }}
        />
        <Modal
          open={addBill}
          head
          label={<Trans>{`${edit ? "View / Update" : "Add"} Bill`}</Trans>}
          className={s.addFormModal}
          setOpen={() => {
            setEdit(null);
            setAddBill(false);
          }}
        >
          <Form
            edit={edit?._id ? edit : null}
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
              setAddBill(false);
            }}
          />
        </Modal>

        <Modal
          open={view}
          className={s.addDetailModal}
          head
          label={<Trans>Bill</Trans>}
          setOpen={() => {
            setView(null);
          }}
        >
          <Detail
            bill={view}
            setBill={(newBill) => {
              setView(newBill);
              tableRef.current.setData((prev) =>
                prev.map((item) => (item._id === newBill._id ? newBill : item))
              );
            }}
            i18n={i18n}
          />
        </Modal>

        {checkPermission(`bill_create`) && (
          <button
            title={t("Add Bill")}
            className={`btn m-a mr-0 ${s.addBtn} ${showAddBtn ? s.show : ""}`}
            onClick={() => setAddBill(true)}
          >
            <GoPlus />
          </button>
        )}
      </div>
    </div>
  );
};

const Detail = ({ bill, setBill, i18n }) => {
  const { checkPermission } = useContext(SiteContext);
  const [edit, setEdit] = useState(false);
  const [addPayment, setAddPayment] = useState(false);
  const { remove: deletePayment, loading: deletingItem } = useFetch(
    endpoints.bills + `/${bill._id}/payments/{ID}`
  );
  const { total, paid } = useMemo(() => {
    return {
      total:
        bill.items.reduce((p, c) => p + c.qty * c.rate, 0) +
        bill.charges.reduce((p, c) => p + c.amount, 0),
      paid: bill.payments.reduce((p, c) => p + c.amount, 0),
    };
  }, [bill]);
  return (
    <>
      <div className={s.detailWrapper}>
        <div className={s.supplier}>
          {bill.supplier?.name ? (
            <>
              <p className={s.name}>{bill.supplier.name}</p>
              <p className={s.address}>{bill.supplier.address}</p>
              {bill.supplier.phones?.length > 0 && (
                <div className={s.phones}>
                  {bill.supplier.phones.map((phone) => (
                    <a key={phone} href={`tel:${phone}`}>
                      {phone}
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p>--</p>
          )}
        </div>
        <div className={s.date}>
          {bill.ref && (
            <>
              <p>{bill.ref}</p> ●
            </>
          )}
          <Moment format="MMM dd, yy">{bill.date}</Moment>
        </div>
        <ul className={s.items}>
          <li className={`${s.item} ${s.head}`}>
            <p>
              <Trans>Item</Trans>
            </p>
            <p className="text-right">
              <Trans>Qty</Trans>
            </p>
            <p className="text-right">
              <Trans>Rate</Trans>
            </p>
            <p className="text-right">
              <Trans>Line Total</Trans>
            </p>
          </li>
          {bill.items.map((item) => (
            <li className={s.item} key={item._id}>
              <p>{item.name}</p>
              <p className="text-right">
                {item.qty.fix(2, i18n.language)} {item.unit}
              </p>
              <p className="text-right">{item.rate.fix(2, i18n.language)}</p>
              <p className="text-right">
                {(item.rate * item.qty).fix(2, i18n.language)}
              </p>
            </li>
          ))}
        </ul>
        {bill.charges.length > 0 && (
          <ul className={s.charges}>
            {bill.charges.map((charge) => (
              <li key={charge._id} className={s.charge}>
                <p className={s.name}>{charge.name}</p>
                <p className="text-right">
                  {charge.amount.fix(2, i18n.language)}
                </p>
              </li>
            ))}
          </ul>
        )}
        {bill.adjustment && (
          <>
            <div className={s.subtotal}>
              <p className="ml-a">
                <Trans>Sub Total</Trans>
              </p>
              <p className="text-right">৳ {total.fix(2, i18n.language)}</p>
            </div>
            <div className={s.adj}>
              <p className="ml-a">
                <Trans>Adjustment</Trans>
              </p>
              <p className="text-right">
                {bill.adjustment.fix(2, i18n.language)}
              </p>
            </div>
          </>
        )}
        <div className={s.subtotal}>
          <p className="ml-a">
            <Trans>Grand Total</Trans>
          </p>
          <p className="text-right">
            ৳ {(total + bill.adjustment).fix(2, i18n.language)}
          </p>
        </div>
        {bill.payments.length > 0 ? (
          <ul className={s.payments}>
            <li className={s.devider}>
              <hr />
              <Trans>Payments</Trans>
              <hr />
            </li>
            <li className={`${s.payment} ${s.head}`}>
              <p>
                <Trans>Date</Trans>
              </p>
              <p>
                <Trans>Payment Method</Trans>
              </p>
              <p className="text-right">
                <Trans>Amount</Trans>
              </p>
            </li>
            {bill.payments.map((item) => (
              <li key={item._id} className={s.payment}>
                <div className="flex gap-1 align-center">
                  <Moment format="MMM dd, yy">{item.date}</Moment>
                  {checkPermission(`bill_update`) && (
                    <>
                      <button
                        title="Edit Payment"
                        className="btn icon clear"
                        onClick={() => {
                          setEdit(item);
                          setAddPayment(true);
                        }}
                      >
                        <BiEditAlt />
                      </button>
                      <button
                        className="btn icon clear"
                        title="Delete Payment"
                        disabled={deletingItem}
                        onClick={() => {
                          Prompt({
                            type: "confirmation",
                            message: `Are you sure you want to request deletion of this payment?`,
                            callback: () => {
                              deletePayment(
                                {},
                                { params: { "{ID}": item._id } }
                              ).then(({ data }) => {
                                if (data.success) {
                                  setBill({
                                    ...bill,
                                    payments: bill.payments.filter(
                                      (payment) => payment._id !== item._id
                                    ),
                                  });
                                } else {
                                  Prompt({
                                    type: "error",
                                    message: data.message,
                                  });
                                }
                              });
                            },
                          });
                        }}
                      >
                        {deletingItem ? (
                          <CgSpinner className="spin" />
                        ) : (
                          <FaRegTrashAlt />
                        )}
                      </button>
                    </>
                  )}
                </div>
                <p>{item.paymentMethod}</p>
                <p className="text-right">
                  {item.amount.fix(2, i18n.language)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className={s.adj}>
            <p className="ml-a">Payment</p>
            <p className="text-right">0</p>
          </div>
        )}
        <div className={s.subtotal}>
          <p className="ml-a flex align-center gap-1">
            {total + bill.adjustment - paid > 0 &&
              checkPermission(`bill_update`) && (
                <button className={s.btn} onClick={() => setAddPayment(true)}>
                  Make Payment
                </button>
              )}
            Due
          </p>
          <p className="text-right">
            ৳ {(total + bill.adjustment - paid).fix(2, i18n.language)}
          </p>
        </div>
      </div>

      <Modal
        open={addPayment}
        head
        label={<Trans>{`${edit ? "View / Update" : "Add"} Payment`}</Trans>}
        className={s.paymentFormModal}
        setOpen={() => {
          setEdit(null);
          setAddPayment(false);
        }}
      >
        <PaymentForm
          bill={bill}
          edit={edit?._id ? edit : null}
          onSuccess={(newData) => {
            if (edit) {
              setBill({
                ...bill,
                payments: bill.payments.map((item) =>
                  item._id === newData._id ? newData : item
                ),
              });
              setEdit(null);
            } else {
              setBill({
                ...bill,
                payments: [...bill.payments, newData],
              });
            }
            setAddPayment(false);
          }}
        />
      </Modal>
    </>
  );
};

export default Data;
