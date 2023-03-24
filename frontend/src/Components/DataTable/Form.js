import { useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input, Textarea, moment, Select } from "Components/elements";
import { useYup, useFetch } from "hooks";
import { Prompt } from "Components/modal";
import * as yup from "yup";
import s from "./dataTable.module.scss";
import { endpoints } from "config";
import { SiteContext } from "SiteContext";

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
              ? moment(edit[field.name], "YYYY-MM-DD")
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
          <button className="btn" disabled={loading}>
            {edit ? "Update" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export const Filter = ({ filters = {}, schema, setFilters }) => {
  const { user } = useContext(SiteContext);
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
          label="Members"
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
      {schema.some((item) => item.name === "milestone") && (
        <Select
          label="Milestone"
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
        <Input label="Name" {...register("name")} />
      )}

      {user.userType === "staff" && (
        <Select
          label="Status"
          control={control}
          name="status"
          multiple
          options={[
            { label: "Pending Approval", value: "pending-approval" },
            { label: "Approved", value: "approved" },
          ]}
        />
      )}

      {schema.some((item) => item.name === "date") && (
        <>
          <Input label="Start Date" type="date" {...register("from_date")} />
          <Input label="End Date" type="date" {...register("to_date")} />
        </>
      )}
    </>
  );

  if (fields.props.children.length === 0) {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit((values) => {
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
        <button className="btn">Submit</button>
        <button
          className="btn clear"
          onClick={() => {
            reset({});
            setFilters({});
          }}
        >
          Clear
        </button>
      </div>
    </form>
  );
};
