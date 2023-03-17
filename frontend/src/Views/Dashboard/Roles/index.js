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
import { endpoints } from "config";

const Data = ({ setSidebarOpen }) => {
  const { user, checkPermission } = useContext(SiteContext);
  const [allPermissions, setAllPermissions] = useState([]);
  const [filters, setFilters] = useState({});
  const [roles, setRoles] = useState([]);
  const [edit, setEdit] = useState(null);
  const [addRole, setAddRole] = useState(false);
  const [showAddBtn, setShowAddBtn] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const { get: getRoles, loading } = useFetch(endpoints.roles);
  const { get: getPermissions } = useFetch(endpoints.permissions);
  const { remove: deleteRole, loading: deletingRole } = useFetch(
    endpoints.role + "/{ID}"
  );

  useEffect(() => {
    getRoles({ query: filters })
      .then(({ data }) => {
        if (data.success) {
          return setRoles(data.data);
        }
      })
      .catch((err) => {
        console.log(err);
        Prompt({ type: "error", message: err.message });
      });
  }, [filters]);
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
        <div className={`${s.head} flex p-1`}>
          <h2 onClick={() => setSidebarOpen((prev) => !prev)}>Roles</h2>
          <>
            <button
              className={`btn clear ${s.filterBtn}`}
              onClick={() => setShowFilter(!showFilter)}
            >
              <BiFilter />
            </button>
            {showFilter && <Filter filters={filters} setFilters={setFilters} />}
          </>
        </div>
        <Table
          loading={loading}
          className={s.data}
          columns={[
            { label: "Name" },
            { label: "Action", className: "text-right" },
          ]}
          onScroll={(dir) => {
            if (dir === "down") {
              setShowAddBtn(false);
            } else {
              setShowAddBtn(true);
            }
          }}
        >
          {roles.map((item) => (
            <tr key={item._id}>
              <td className={s.name}>{item.name}</td>

              <TableActions
                className={s.actions}
                actions={[
                  ...(checkPermission(`role_update`)
                    ? [
                        {
                          icon: <BiEditAlt />,
                          label: "Edit",
                          callBack: () => {
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
                          label: "Delete",
                          disabled: deletingRole,
                          callBack: () =>
                            Prompt({
                              type: "confirmation",
                              message: `Are you sure you want to remove this role?`,
                              callback: () => {
                                deleteRole(
                                  {},
                                  { params: { "{ID}": item._id } }
                                ).then(({ data }) => {
                                  if (data.success) {
                                    setRoles((prev) =>
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
          open={addRole}
          head
          label={`${edit ? "View / Update" : "Add"} Role`}
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
                setRoles((prev) =>
                  prev.map((item) =>
                    item._id === newData._id ? newData : item
                  )
                );
                setEdit(null);
              } else {
                setRoles((prev) => [...prev, newData]);
              }
              setAddRole(false);
            }}
          />
        </Modal>

        {checkPermission(`role_create`) && (
          <button
            className={`btn m-a mr-0 ${s.addBtn} ${showAddBtn ? s.show : ""}`}
            onClick={() => setAddRole(true)}
          >
            <GoPlus />
          </button>
        )}
      </div>
    </div>
  );
};

export default Data;