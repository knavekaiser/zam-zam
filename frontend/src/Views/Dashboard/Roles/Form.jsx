import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Checkbox, Input } from "Components/elements";
import { useYup, useFetch } from "hooks";
import { Prompt } from "Components/modal";
import * as yup from "yup";
import s from "./dataTable.module.scss";
import { endpoints } from "config";
import { motion } from "framer-motion";
import { Trans, useTranslation } from "react-i18next";

export const Form = ({ edit, allPermissions, onSuccess }) => {
  const {
    handleSubmit,
    register,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: useYup(
      yup.object({
        name: yup.string().required(),
        permissions: yup
          .array()
          .of(yup.string())
          .min(1, "Please select at least one permission")
          .required(),
      })
    ),
  });

  const {
    post: saveRole,
    put: updateRole,
    loading,
  } = useFetch(endpoints.roles + `/${edit?._id || ""}`);

  const permissions = watch("permissions");

  useEffect(() => {
    if (edit?._id) {
      reset(edit);
    }
  }, [edit]);

  return (
    <div className={`grid gap-1 p-1 ${s.addForm}`}>
      <form
        onSubmit={handleSubmit((values) => {
          (edit ? updateRole : saveRole)({ ...values }).then(({ data }) => {
            if (data.errors) {
              return Prompt({ type: "error", message: data.message });
            } else if (data.success) {
              onSuccess(data.data);
            }
          });
        })}
        className={`grid gap-1`}
      >
        <Input
          label={<Trans>Name</Trans>}
          placeholder=" "
          {...register("name")}
          required
          error={errors.name}
        />

        <div className={s.groups}>
          <h3>
            <Trans>Permissions</Trans>
          </h3>
          {errors.permissions?.message && (
            <p className={s.permissionErr}>{errors.permissions?.message}</p>
          )}
          {allPermissions.map((group) => (
            <div key={group.label} className={s.group}>
              <label className={s.groupLabel}>
                <Trans>{group.label}</Trans>
              </label>
              <div className={s.permissions}>
                {group.permissions.map((pr) => (
                  <Checkbox
                    className={s.checkbox}
                    key={pr.value}
                    checked={(permissions || []).includes(pr.value)}
                    disabled={
                      pr.value.endsWith("_read") &&
                      (permissions || []).some(
                        (item) =>
                          item !== pr.value &&
                          item.startsWith(pr.value.replace("_read", ""))
                      )
                    }
                    onChange={(e) => {
                      if ((permissions || []).includes(pr.value)) {
                        setValue(
                          "permissions",
                          permissions.filter((item) => item !== pr.value)
                        );
                      } else {
                        setValue("permissions", [
                          ...new Set([
                            ...(permissions || []),
                            ...(/^(.*)(create|update|delete|approve|requset_delete)$/.test(
                              pr.value
                            )
                              ? [
                                  pr.value.replace(
                                    /(create|update|delete|approve|request_delete)$/,
                                    "read"
                                  ),
                                ]
                              : []),
                            pr.value,
                          ]),
                        ]);
                      }
                    }}
                    label={<Trans>{pr.label}</Trans>}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="btns">
          <button className="btn" disabled={loading} title="Submit">
            <Trans>{edit ? "Update" : "Submit"}</Trans>
          </button>
        </div>
      </form>
    </div>
  );
};

export const Filter = ({ showFilter, filters = {}, setFilters }) => {
  const { t } = useTranslation();
  const { handleSubmit, register, reset } = useForm();
  useEffect(() => {
    reset(filters);
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
              if (value?.length) {
                p[key] = value;
              }
              return p;
            }, {})
          );
        })}
        className={s.filters}
      >
        <Input
          // label={<Trans>Name</Trans>}
          placeholder={t("Name")}
          {...register("name")}
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
