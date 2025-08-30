import { useState, useEffect, useContext, useRef } from "react";
import { SiteContext } from "@/SiteContext";
import { Table, TableActions } from "Components/elements";
import { FaRegTrashAlt } from "react-icons/fa";
import { BiEditAlt, BiFilter } from "react-icons/bi";
import { GoPlus } from "react-icons/go";
import { Prompt, Modal } from "Components/modal";
import s from "./dataTable.module.scss";
import { useFetch } from "hooks";

import { Form, Filter } from "./Form";
import { endpoints } from "config";
import { BsList } from "react-icons/bs";
import { Trans, useTranslation } from "react-i18next";

const Data = ({ setSidebarOpen }) => {
  const { t } = useTranslation();
  const tableRef = useRef();
  const { checkPermission } = useContext(SiteContext);
  const [allPermissions, setAllPermissions] = useState([]);
  const [filters, setFilters] = useState({});
  const [edit, setEdit] = useState(null);
  const [addRole, setAddRole] = useState(false);
  const [showAddBtn, setShowAddBtn] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const { get: getPermissions } = useFetch(endpoints.permissions);
  const { remove: deleteRole, loading: deletingRole } = useFetch(
    endpoints.roles + "/{ID}"
  );

  useEffect(() => {
    getPermissions()
      .then(({ data }) => {
        setAllPermissions(data.data);
      })
      .catch((err) => Prompt({ type: "error", message: err.message }));
  }, []);
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
              <Trans>Roles</Trans>
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
          url={endpoints.roles}
          pagination
          className={s.data}
          filters={filters}
          columns={[
            { label: <Trans>Name</Trans> },
            { label: <Trans>Action</Trans>, className: "text-right" },
          ]}
          onScroll={(dir) => {
            if (dir === "down") {
              setShowAddBtn(false);
            } else {
              setShowAddBtn(true);
            }
          }}
          renderRow={(item) => (
            <tr key={item._id}>
              <td className={s.name}>{item.name}</td>

              <TableActions
                className={s.actions}
                actions={[
                  ...(checkPermission(`role_update`)
                    ? [
                        {
                          icon: <BiEditAlt />,
                          label: <Trans>Edit</Trans>,
                          onClick: () => {
                            setEdit(item);
                            setAddRole(true);
                          },
                        },
                      ]
                    : []),
                  ...(checkPermission(`role_delete`)
                    ? [
                        {
                          icon: <FaRegTrashAlt />,
                          label: <Trans>Delete</Trans>,
                          disabled: deletingRole,
                          onClick: () =>
                            Prompt({
                              type: "confirmation",
                              message: (
                                <Trans>
                                  Are you sure you want to remove this role?
                                </Trans>
                              ),
                              callback: () => {
                                deleteRole(
                                  {},
                                  { params: { "{ID}": item._id } }
                                ).then(({ data }) => {
                                  if (data.success) {
                                    tableRef.current.setData((prev) =>
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
          )}
        />
        <Modal
          open={addRole}
          head
          label={<Trans>{`${edit ? "View / Update" : "Add"} Role`}</Trans>}
          className={s.addFormModal}
          setOpen={() => {
            setEdit(null);
            setAddRole(false);
          }}
        >
          <Form
            edit={edit}
            allPermissions={allPermissions}
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
              setAddRole(false);
            }}
          />
        </Modal>

        {/* {checkPermission(`role_create`) && ( */}
        <button
          title={t("Add Role")}
          className={`btn m-a mr-0 ${s.addBtn} ${showAddBtn ? s.show : ""}`}
          onClick={() => setAddRole(true)}
        >
          <GoPlus />
        </button>
        {/* )} */}
      </div>
    </div>
  );
};

export default Data;
