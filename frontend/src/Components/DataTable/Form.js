import { useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input, Textarea, moment, Select } from "Components/elements";
import { useYup, useFetch } from "hooks";
import { Prompt } from "Components/modal";
import * as yup from "yup";
import s from "./dataTable.module.scss";
import { endpoints } from "config";
import { SiteContext } from "SiteContext";
import { AnimatePresence, motion } from "framer-motion";

export const Form = ({ edit, onSuccess, endpoint, schema }) => {
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
            if (f.type === "number") {
              field = yup.number().typeError("Please enter a valid number");
            }
            if (f.fieldType === "phone") {
              field = yup.string().phn({ country: "bangladesh" });
            }
            if (f.dataType === "array") {
              field = yup.array();
              if (f.min) {
                field = field.min(f.min, `At least ${f.min} items required`);
              }
            }
            if (f.required) {
              field = field.required(
                field.errorMessage || `${f.label} is required`
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
    if (edit?._id) {
      const _edit = {};
      schema.forEach((field) => {
        if (["input", "textarea"].includes(field.fieldType)) {
          if (field.type === "date") {
            _edit[field.name] = edit[field.name]
              ? moment(edit[field.name], "yyyy-MM-dd")
              : "";
          } else {
            _edit[field.name] = edit[field.name] || "";
          }
        } else if (field.fieldType === "select") {
          if (typeof edit[field.name] === "object") {
            _edit[field.name] = edit[field.name]._id || "";
          } else {
            _edit[field.name] = edit[field.name] || "";
          }
        }
      });
      reset(_edit);
    }
  }, [edit]);

  const fields = schema.map((item) => {
    if (item.fieldType === "input") {
      return (
        <Input
          key={item.name}
          type={item.type}
          label={item.label}
          {...register(item.name)}
          required={item.required}
          error={errors[item.name]}
        />
      );
    } else if (item.fieldType === "select") {
      return (
        <Select
          key={item.name}
          control={control}
          disabled={item.disabledOnEdit ? edit?._id : false}
          {...item}
        />
      );
    } else if (item.fieldType === "textarea") {
      return (
        <Textarea
          key={item.name}
          {...item}
          control={control}
          formOptions={{ required: item.required }}
        />
      );
    } else if (item.fieldType === "phone") {
      return (
        <Input
          required
          label="Phone"
          {...register("phone")}
          error={errors.phone}
        />
      );
    }
    return null;
  });

  return (
    <div className={`grid gap-1 p-1 ${s.addDataForm}`}>
      <form
        onSubmit={handleSubmit((values) => {
          (edit ? updateInvoice : saveInvoice)({
            ...values,
            // status: values.status,
          }).then(({ data }) => {
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
          <button className="btn" disabled={loading} title="Submit">
            {edit ? "Update" : "Submit"}
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
      {schema.some((item) => item.name === "milestone") &&
        checkPermission("milestone_read") && (
          <Select
            placeholder="Milestone"
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
        <Input placeholder="Name" {...register("name")} />
      )}
      {schema.some((item) => item.name === "title") && (
        <Input placeholder="Title" {...register("title")} />
      )}

      {user.userType === "staff" && filterStatus?.length > 0 && (
        <Select
          placeholder="Status"
          control={control}
          name="status"
          multiple
          options={filterStatus}
        />
      )}

      {schema.some((item) => item.name === "date") && (
        <>
          <Input
            placeholder="Start Date"
            type="date"
            {...register("from_date")}
          />
          <Input placeholder="End Date" type="date" {...register("to_date")} />
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
          <button className="btn medium" title="Submit">
            Submit
          </button>
          <button
            className="btn clear medium"
            title="Clear"
            onClick={() => {
              reset({});
              setFilters({});
              if (window.innerWidth <= 480) {
                close();
              }
            }}
          >
            Clear
          </button>
        </div>
      </form>
    </motion.div>
  );

  // return (
  //   <AnimatePresence>
  //     {showFilter && (

  //     )}
  //   </AnimatePresence>
  // );
};
