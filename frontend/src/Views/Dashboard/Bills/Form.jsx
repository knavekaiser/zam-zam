import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { FileInput, Input, moment, Select } from "Components/elements";
import { useYup, useFetch } from "hooks";
import { Prompt } from "Components/modal";
import * as yup from "yup";
import s from "./dataTable.module.scss";
import { endpoints } from "config";
import { motion } from "framer-motion";
import { Trans, useTranslation } from "react-i18next";
import { GoX } from "react-icons/go";

export const Form = ({ edit, onSuccess }) => {
  const {
    handleSubmit,
    register,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: useYup(
      yup.object({
        date: yup.string().required(),
        supplier: yup.string().required(),
        items: yup
          .array()
          .of(yup.object())
          .min(1, "Please enter at least one item")
          .required(),
      })
    ),
  });

  const {
    post: saveBill,
    put: updateBill,
    loading,
  } = useFetch(endpoints.bills + `/${edit?._id || ""}`);

  const items = watch("items");
  const charges = watch("charges");

  useEffect(() => {
    reset({
      ref: edit?.ref || "",
      date: moment(edit?.date || new Date(), "yyyy-MM-dd", "en"),
      supplier: edit?.supplier?._id || "",
      adjustment: edit?.adjustment || "",
      documents: edit?.documents || [],
      items: [
        ...(edit?.items || []),
        {
          _id: Math.random().toString(36).slice(-8),
          name: "",
          qty: "",
          rate: "",
        },
      ],
      charges: [
        ...(edit?.charges || []),
        {
          _id: Math.random().toString(36).slice(-8),
          name: "",
          amount: "",
        },
      ],
    });
  }, [edit]);

  return (
    <div className={`grid gap-1 p-1 ${s.addForm}`}>
      <form
        onSubmit={handleSubmit((values) => {
          const payload = {
            ref: values.ref,
            date: new Date(values.date),
            supplier: values.supplier,
            adjustment: values.adjustment ?? 0,
            items: JSON.stringify(
              values.items
                .filter(
                  (item) => item.name && item.unit && item.qty && item.rate
                )
                .map((item) => {
                  if (item._id.length === 8) {
                    delete item._id;
                  }
                  return item;
                })
            ),
            charges: JSON.stringify(
              values.charges
                .filter((i) => i.name && i.amount)
                .map((item) => {
                  if (item._id.length === 8) {
                    delete item._id;
                  }
                  return item;
                })
            ),
          };
          const formData = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            formData.append(key, value);
          });
          if (values.documents?.length) {
            values.documents?.forEach((file) => {
              formData.append(
                "documents",
                file.url ? JSON.stringify(file) : file
              );
            });
          } else {
            formData.append("documents", null);
          }
          (edit ? updateBill : saveBill)(formData).then(({ data }) => {
            if (data.errors) {
              return Prompt({ type: "error", message: data.message });
            } else if (data.success) {
              onSuccess(data.data);
            }
          });
        })}
        className={`grid gap-1`}
      >
        <div className="flex wrap gap_5">
          <Input
            label={<Trans>Ref</Trans>}
            placeholder=" "
            className="flex-1"
            {...register("ref")}
            type="number"
            error={errors.ref}
          />
          <Input
            label={<Trans>Date</Trans>}
            className="flex-1"
            placeholder=" "
            {...register("date")}
            type="date"
            required
            error={errors.date}
          />
        </div>
        <Select
          label={<Trans>Supplier</Trans>}
          control={control}
          name="supplier"
          url={endpoints.suppliers}
          getQuery={(inputValue, selected) => ({
            ...(inputValue && { name: inputValue }),
            _id: selected,
          })}
          clearable={false}
          handleData={(item) => ({
            label: item.name,
            value: item._id,
          })}
        />

        <div className={s.itemWrapper}>
          <h3>
            <Trans>Items</Trans>
          </h3>
          {errors.items?.message && (
            <p className={s.itemErr}>{errors.items?.message}</p>
          )}
          <Items
            items={items || []}
            setItems={(newItems) => setValue("items", newItems)}
          />
        </div>

        <div className={s.itemWrapper}>
          <h3>
            <Trans>Charges</Trans>
          </h3>
          {errors.items?.message && (
            <p className={s.itemErr}>{errors.items?.message}</p>
          )}
          <Charges
            items={charges || []}
            setItems={(newItems) => setValue("charges", newItems)}
          />
        </div>

        <Input
          label={<Trans>Adjustment</Trans>}
          placeholder=" "
          {...register("adjustment")}
          type="number"
          required
          error={errors.adjustment}
        />

        <FileInput
          control={control}
          name="documents"
          multiple={5}
          label="Documents"
          accept="image/*,application/pdf"
        />

        <div className="btns">
          <button className="btn" disabled={loading} title="Submit">
            <Trans>{edit ? "Update" : "Submit"}</Trans>
          </button>
        </div>
      </form>
    </div>
  );
};

const Items = ({ items, setItems }) => {
  const valuesFilled = useRef(false);
  const { control, register, reset } = useForm({
    resolver: useYup(
      yup.object({
        name: yup.string().required(),
        qty: yup.number().required(),
        rate: yup.number().required(),
        unit: yup.string().required(),
      })
    ),
  });
  useEffect(() => {
    if (items.length < 2 || valuesFilled.current) return;
    const values = {};
    items.forEach((item) => {
      values[`${item._id}_name`] = item.name;
      values[`${item._id}_qty`] = item.qty;
      values[`${item._id}_unit`] = item.unit;
      values[`${item._id}_rate`] = item.rate;
    });
    reset(values);
    valuesFilled.current = true;
  }, [items]);
  return (
    <ul className={s.items}>
      {items.map((item, i, arr) => (
        <li key={item._id} className={s.item}>
          <Select
            control={control}
            name={`${item._id}_name`}
            url={endpoints.billItems}
            getQuery={(inputValue, selected) => ({
              ...(inputValue && { name: inputValue }),
              name: selected,
            })}
            creatable
            placeholder="Item"
            clearable={false}
            handleData={(item) => ({
              label: item.name,
              value: item.name,
            })}
            onChange={(opt) => {
              let newItems = items.map((it) =>
                it._id === item._id ? { ...it, name: opt.value } : it
              );
              if (!arr[i + 1]) {
                newItems.push({
                  _id: Math.random().toString(36).slice(-8),
                  name: "",
                  qty: "",
                  unit: "",
                  rate: "",
                });
              }
              setItems(newItems);
            }}
          />
          <Input
            placeholder="Qty"
            {...register(`${item._id}_qty`)}
            type="number"
            min={0.1}
            step="0.1"
            onChange={(e) => {
              setItems(
                items.map((it) =>
                  it._id === item._id
                    ? { ...it, qty: +e.target.value || e.target.value }
                    : it
                )
              );
            }}
          />
          <Select
            control={control}
            name={`${item._id}_unit`}
            creatable
            placeholder="Unit"
            clearable={false}
            options={[
              { label: "kg", value: "kg" },
              { label: "litre", value: "litre" },
              { label: "pcs", value: "pcs" },
              { label: "packet", value: "packet" },
              { label: "box", value: "box" },
              { label: "bag", value: "bag" },
              { label: "thela", value: "thela" },
            ]}
            onChange={(opt) => {
              setItems(
                items.map((it) =>
                  it._id === item._id ? { ...it, unit: opt?.value || "" } : it
                )
              );
            }}
          />
          <Input
            placeholder="Rate"
            {...register(`${item._id}_rate`)}
            type="number"
            min={0.1}
            step="0.1"
            onChange={(e) => {
              setItems(
                items.map((it) =>
                  it._id === item._id
                    ? { ...it, rate: +e.target.value || e.target.value }
                    : it
                )
              );
            }}
          />
          {item.name ? (
            <button
              className="btn icon"
              onClick={() => {
                setItems(items.filter((it) => it._id !== item._id));
              }}
            >
              <GoX />
            </button>
          ) : (
            <span style={{ display: "block", width: "33px" }} />
          )}
        </li>
      ))}
    </ul>
  );
};

const Charges = ({ items, setItems }) => {
  const valuesFilled = useRef(false);
  const { control, register, reset } = useForm({
    resolver: useYup(
      yup.object({
        name: yup.string().required(),
        amount: yup.number().min(0).required(),
      })
    ),
  });
  useEffect(() => {
    if (items.length < 2 || valuesFilled.current) return;
    const values = {};
    items.forEach((item) => {
      values[`${item._id}_name`] = item.name;
      values[`${item._id}_amount`] = item.amount;
    });
    reset(values);
    valuesFilled.current = true;
  }, [items]);
  return (
    <ul className={s.charges}>
      {items.map((item, i, arr) => (
        <li key={item._id} className={s.item}>
          <Select
            control={control}
            name={`${item._id}_name`}
            url={endpoints.billCharges}
            getQuery={(inputValue, selected) => ({
              ...(inputValue && { name: inputValue }),
              name: selected,
            })}
            creatable
            placeholder="Item"
            clearable={false}
            handleData={(item) => ({
              label: item.name,
              value: item.name,
            })}
            onChange={(opt) => {
              let newItems = items.map((it) =>
                it._id === item._id ? { ...it, name: opt.value } : it
              );
              if (!arr[i + 1]) {
                newItems.push({
                  _id: Math.random().toString(36).slice(-8),
                  name: "",
                  amount: "",
                });
              }
              setItems(newItems);
            }}
          />
          <Input
            placeholder="Amount"
            {...register(`${item._id}_amount`)}
            type="number"
            min={0.1}
            step="0.1"
            onChange={(e) => {
              setItems(
                items.map((it) =>
                  it._id === item._id
                    ? { ...it, amount: +e.target.value || e.target.value }
                    : it
                )
              );
            }}
          />
          {item.name ? (
            <button
              className="btn icon"
              onClick={() => {
                setItems(items.filter((it) => it._id !== item._id));
              }}
            >
              <GoX />
            </button>
          ) : (
            <span style={{ display: "block", width: "33px" }} />
          )}
        </li>
      ))}
    </ul>
  );
};

export const Filter = ({ showFilter, filters = {}, setFilters }) => {
  const { t } = useTranslation();
  const { handleSubmit, register, reset } = useForm();
  useEffect(() => {
    reset({
      from_date: filters.from_date || "",
      to_date: filters.to_date || "",
    });
  }, [filters]);
  return (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: showFilter ? "auto" : 0 }}
      className={s.filterWrapper}
    >
      <form
        tabIndex="-1"
        onSubmit={handleSubmit((values) => {
          setFilters(
            Object.entries(values).reduce((p, [key, value]) => {
              if (value) {
                p[key] = value;
              }
              return p;
            }, {})
          );
        })}
        className={s.filters}
      >
        <Input
          placeholder={<Trans>Start Date</Trans>}
          type="date"
          {...register("from_date")}
        />
        <Input
          placeholder={<Trans>End Date</Trans>}
          type="date"
          {...register("to_date")}
        />

        <div className="btns">
          <button className="btn medium" title={<Trans>Submit</Trans>}>
            <Trans>Submit</Trans>
          </button>
          <button
            title={<Trans>Clear</Trans>}
            className="btn clear medium"
            onClick={() => {
              reset({});
              setFilters({});
            }}
          >
            <Trans>Clear</Trans>
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export const PaymentForm = ({ bill, edit, onSuccess }) => {
  const { i18n } = useTranslation();
  const { total, paid } = useMemo(() => {
    return {
      total:
        bill.items.reduce((p, c) => p + c.rate * c.qty, 0) +
        bill.charges.reduce((p, c) => p + c.amount, 0) +
        (bill.adjustment || 0),
      paid:
        bill.payments.reduce((p, c) => p + c.amount, 0) - (edit?.amount || 0),
    };
  }, [bill, edit]);
  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: useYup(
      yup.object({
        date: yup.string().required(),
        paymentMethod: yup.string().required(),
        amount: yup
          .number()
          .min(1, `Can't be less than 1`)
          .max(
            total - paid,
            `Can't be more than ${(total - paid).fix(2, i18n.language)}`
          )
          .required("Please provide an amount")
          .typeError("Plase enter a valid number"),
        documents: yup.array().of(yup.mixed()),
      })
    ),
  });

  const {
    post: saveBill,
    put: updateBill,
    loading,
  } = useFetch(endpoints.bills + `/${bill._id}/payments/${edit?._id || ""}`);

  useEffect(() => {
    reset({
      date: moment(edit?.date || new Date(), "yyyy-MM-dd", "en"),
      paymentMethod: edit?.paymentMethod || "Cash",
      amount: edit?.amount || "",
      documents: edit?.documents || [],
    });
  }, [edit]);

  return (
    <div className={`grid gap-1 p-1 ${s.paymentForm}`}>
      <form
        onSubmit={handleSubmit((values) => {
          const payload = {
            date: new Date(values.date),
            paymentMethod: values.paymentMethod,
            amount: values.amount,
          };
          const formData = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            formData.append(key, value);
          });
          if (values.documents?.length) {
            values.documents?.forEach((file) => {
              formData.append(
                "documents",
                file.url ? JSON.stringify(file) : file
              );
            });
          } else {
            formData.append("documents", null);
          }
          (edit ? updateBill : saveBill)(formData).then(({ data }) => {
            if (data.errors) {
              return Prompt({ type: "error", message: data.message });
            } else if (data.success) {
              onSuccess(data.data);
            }
          });
        })}
        className={`grid gap-1`}
      >
        <div className={s.summary}>
          <span>
            <Trans>Total</Trans>
          </span>
          <span className="text-right">{total.fix(2, i18n.language)}</span>
          <span>
            <Trans>Paid</Trans>
          </span>
          <span className="text-right">{paid.fix(2, i18n.language)}</span>
          <hr />
          <span>
            <Trans>Due</Trans>
          </span>
          <span className="text-right">
            ৳ {(total - paid).fix(2, i18n.language)}
          </span>
        </div>
        <Input
          label={<Trans>Date</Trans>}
          min={moment(bill.date, "yyyy-MM-dd", "en")}
          placeholder=" "
          {...register("date")}
          type="date"
          required
          error={errors.date}
        />
        <Select
          label={<Trans>Payment Method</Trans>}
          control={control}
          name="paymentMethod"
          clearable={false}
          options={[
            { label: "Cash", value: "Cash" },
            { label: "Cheque", value: "Cheque" },
            { label: "Bank Transfer", value: "Bank Transfer" },
          ]}
        />

        <Input
          label={<Trans>Amount</Trans>}
          placeholder=" "
          {...register("amount")}
          step={0.1}
          type="number"
          required
          error={errors.amount}
        />

        <FileInput
          control={control}
          name="documents"
          multiple={5}
          label="Documents"
          accept="image/*,application/pdf"
        />

        <div className="btns">
          <button className="btn" disabled={loading} title="Submit">
            <Trans>{edit ? "Update" : "Submit"}</Trans>
          </button>
        </div>
      </form>
    </div>
  );
};
