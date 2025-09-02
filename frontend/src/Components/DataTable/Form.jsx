import { useContext, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  Input,
  Textarea,
  moment,
  Select,
  FileInput,
} from "Components/elements";
import { useYup, useFetch } from "hooks";
import { Prompt } from "Components/modal";
import * as yup from "yup";
import s from "./dataTable.module.scss";
import { endpoints } from "config";
import { SiteContext } from "@/SiteContext";
import { AnimatePresence, motion } from "framer-motion";
import { Trans, useTranslation } from "react-i18next";
import { CgSpinner } from "react-icons/cg";

export const Form = ({
  edit,
  onSuccess,
  endpoint,
  schema,
  prefillValues,
  parseValues,
}) => {
  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: useYup(
      yup.object({
        ...schema
          .map((f) => {
            let field;
            if (["objectId", "string", "date"].includes(f.type)) {
              field = yup.string();
            } else if (
              ["textarea", "input", "combobox", "select"].includes(f.fieldType)
            ) {
              field = yup.string();
            }
            if (f.fieldType === "fileInput") {
              field = f.multiple ? yup.array().of(yup.mixed()) : yup.mixed();
            }
            if (f.type === "number") {
              field = yup
                .number()
                .typeError(<Trans>Please enter a valid number</Trans>);
            }
            if (f.fieldType === "phone") {
              field = yup
                .string()
                .phn(
                  { country: "bangladesh" },
                  <Trans>Please enter a valid number</Trans>
                );
            }
            if (f.dataType === "array") {
              field = yup.array();
              if (f.min) {
                field = field.min(f.min, `At least ${f.min} items required`);
              }
            }
            if (f.required) {
              field = field.required(
                field.errorMessage || <Trans>Field is required</Trans>
              );
            }
            return field;
          })
          .reduce((p, c, i) => {
            p[schema[i]?.name] = c;
            return p;
          }, {}),
      })
    ),
  });

  const {
    post: saveInvoice,
    put: updateInvoice,
    loading,
  } = useFetch(endpoint + `/${edit?._id || ""}`);

  useEffect(() => {
    let _edit = {};
    if (prefillValues) {
      _edit = prefillValues(edit);
    } else if (edit?._id) {
      schema.forEach((field) => {
        if (["input", "textarea"].includes(field.fieldType)) {
          if (field.type === "date") {
            _edit[field.name] = edit[field.name]
              ? moment(edit[field.name], "yyyy-MM-dd", "en")
              : "";
          } else {
            _edit[field.name] = edit[field.name] || "";
          }
        } else if (field.fieldType === "select") {
          if (Array.isArray(edit[field.name])) {
            _edit[field.name] = edit[field.name];
          } else if (typeof edit[field.name] === "object") {
            _edit[field.name] =
              edit[field.name]._id || (field.multiple ? [] : "");
          } else {
            _edit[field.name] = edit[field.name] || (field.multiple ? [] : "");
          }
        } else if (field.fieldType === "fileInput") {
          _edit[field.name] = edit[field.name] || (field.multiple ? [] : null);
        }
      });
    } else {
      schema.forEach((field) => {
        if (field.type === "date") {
          _edit[field.name] = moment(new Date(), "yyyy-MM-dd");
        }
      });
    }
    reset(_edit);
  }, [edit]);

  const fields = schema.map(({ fieldType, ...item }) => {
    if (fieldType === "input") {
      return (
        <Input
          key={item.name}
          type={item.type}
          label={<Trans>{item.label}</Trans>}
          {...register(item.name)}
          required={item.required}
          placeholder={item.placeholder || " "}
          error={errors[item.name]}
          hint={item.hint}
        />
      );
    } else if (fieldType === "select") {
      return (
        <Select
          key={item.name}
          control={control}
          disabled={item.disabledOnEdit ? edit?._id : false}
          {...item}
          placeholder={item.placeholder || " "}
          label={<Trans>{item.label}</Trans>}
        />
      );
    } else if (fieldType === "textarea") {
      return (
        <Textarea
          key={item.name}
          {...item}
          label={<Trans>{item.label}</Trans>}
          control={control}
          formOptions={{ required: item.required }}
        />
      );
    } else if (fieldType === "phone") {
      return (
        <Input
          required
          label={<Trans>{item.label}</Trans>}
          {...register("phone")}
          error={errors.phone}
        />
      );
    } else if (fieldType === "fileInput") {
      return <FileInput key={item.name} control={control} {...item} />;
    }
    return null;
  });

  return (
    <div className={`grid gap-1 p-1 ${s.addDataForm}`}>
      <form
        onSubmit={handleSubmit((values) => {
          let payload = {};
          if (parseValues) {
            payload = parseValues(values);
          } else if (schema.some((item) => item.fieldType === "fileInput")) {
            payload = new FormData();
            const json = {};
            schema.forEach((field) => {
              if (field.fieldType === "fileInput") {
                if (field.multiple) {
                  (values[field.name] || []).forEach((file) => {
                    payload.append(
                      field.name,
                      file?.url ? JSON.stringify(file) : file
                    );
                  });
                } else {
                  const file = values[field.name];
                  payload.append(
                    field.name,
                    file?.url ? JSON.stringify(file) : file
                  );
                }
              } else {
                json[field.name] = values[field.name];
              }
            });
            payload.append("json", JSON.stringify(json));
          } else {
            payload = values;
          }

          (edit ? updateInvoice : saveInvoice)(payload).then(({ data }) => {
            if (data.errors) {
              return Prompt({ type: "error", message: data.message });
            } else if (data.success) {
              onSuccess(data.data);
            }
          });
        })}
        className={`${s.mainForm} grid gap-1`}
      >
        {fields}

        <div className="btns">
          <button
            className="btn"
            disabled={loading}
            title={<Trans>Submit</Trans>}
          >
            {loading && <CgSpinner className="spin" />}{" "}
            <Trans>{edit ? "Update" : "Submit"}</Trans>
          </button>
        </div>
      </form>
    </div>
  );
};

export const Filter = ({
  showFilter,
  close,
  filters = {},
  filterStatus,
  schema,
  setFilters,
}) => {
  const { t } = useTranslation();
  const { selfOnly, user, checkPermission } = useContext(SiteContext);
  const { handleSubmit, control, register, reset } = useForm();
  useEffect(() => {
    const _filter = {};
    if (schema.some((item) => item.name === "member")) {
      _filter.members = filters.members || [];
    }
    if (schema.some((item) => item.name === "milestone")) {
      _filter.milestones = filters.milestones || [];
    }
    if (schema.some((item) => item.name === "tags")) {
      _filter.tags = filters.tags || [];
    }
    _filter.status = filters.status || [];
    _filter.from_date = filters.from_date || "";
    _filter.to_date = filters.to_date || "";
    reset(_filter);
  }, [filters]);

  const fields = (
    <>
      {schema.some((item) => item.name === "member") && (
        <Select
          placeholder="Members"
          url={endpoints.findMembers}
          control={control}
          name="members"
          multiple
          getQuery={(inputValue, selected) => ({
            ...(inputValue && { name: inputValue }),
            _id: selected,
          })}
          handleData={(item) => ({
            label: item.name,
            value: item._id,
          })}
        />
      )}
      {schema.some((item) => item.name === "tags") && (
        <Select
          placeholder="Tags"
          url={endpoints.expenseTags}
          control={control}
          name="tags"
          multiple
          getQuery={(inputValue, selected) => ({
            ...(inputValue && { name: inputValue }),
            name: selected,
          })}
          handleData={(item) => ({
            label: item.name,
            value: item.name,
          })}
        />
      )}
      {schema.some((item) => item.name === "milestone") &&
        checkPermission("milestone_read") && (
          <Select
            placeholder={t("Milestone")}
            url={endpoints.milestones}
            control={control}
            name="milestones"
            multiple
            getQuery={(inputValue, selected) => ({
              ...(inputValue && { title: inputValue }),
              _id: selected,
            })}
            handleData={(item) => ({
              label: item.title,
              value: item._id,
            })}
          />
        )}
      {schema.some((item) => item.name === "name") && (
        <Input placeholder={t("Name")} {...register("name")} />
      )}
      {schema.some((item) => item.name === "title") && (
        <Input placeholder={t("Title")} {...register("title")} />
      )}

      {user.userType === "staff" && filterStatus?.length > 0 && (
        <Select
          placeholder={<Trans>Status</Trans>}
          control={control}
          name="status"
          multiple
          options={filterStatus}
        />
      )}

      {schema.some((item) => item.name === "date") && (
        <>
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
        </>
      )}
    </>
  );

  useEffect(() => {
    if (
      user.userType === "member" &&
      selfOnly &&
      schema.some((item) => item.name === "member")
    ) {
      setFilters({ members: [user._id] });
      reset({ members: [user._id] });
    }
  }, []);

  if (fields.props.children.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: showFilter ? "auto" : 0 }}
      className={s.filterWrapper}
    >
      <form
        onSubmit={handleSubmit((values) => {
          if (window.innerWidth <= 480) {
            close();
          }
          setFilters(
            Object.entries(values).reduce((p, [key, value]) => {
              if (value?.length) {
                p[key] = value;
              }
              return p;
            }, {})
          );
        })}
        className={s.filters}
      >
        {fields}

        <div className="btns">
          <button className="btn medium" title={<Trans>Submit</Trans>}>
            <Trans>Submit</Trans>
          </button>
          <button
            className="btn clear medium"
            title={<Trans>Clear</Trans>}
            onClick={() => {
              reset({});
              setFilters({});
              if (window.innerWidth <= 480) {
                close();
              }
            }}
          >
            <Trans>Clear</Trans>
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export const PaymentForm = ({ supplier, onSuccess }) => {
  const { i18n } = useTranslation();
  const { total, paid } = useMemo(() => {
    return {
      total: supplier.payment?.totalPurchase || 0,
      paid: supplier.payment?.totalPaid || 0,
    };
  }, [supplier]);
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
          .required("Please provide an amount")
          .typeError("Plase enter a valid number"),
        // documents: yup.array().of(yup.mixed()),
      })
    ),
  });

  const { post: makePayment, loading } = useFetch(
    endpoints.suppliers + `/${supplier._id}/payments`
  );

  useEffect(() => {
    reset({
      date: moment(new Date(), "yyyy-MM-dd", "en"),
      paymentMethod: "Cash",
      amount: "",
      documents: [],
    });
  }, []);

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
          makePayment(formData).then(({ data }) => {
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
            <Trans>Submit</Trans>
          </button>
        </div>
      </form>
    </div>
  );
};
