import {
  forwardRef,
  Fragment,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import s from "./elements.module.scss";
import { FaCircleNotch } from "react-icons/fa";
import { Trans } from "react-i18next";
import Menu from "./menu";
import { useForm } from "react-hook-form";
import { GoChevronLeft, GoChevronRight } from "react-icons/go";
import { Select } from ".";
import { useFetch } from "hooks";
import { Prompt } from "Components/modal";

export const Table = forwardRef(
  (
    {
      columns,
      className,
      trStyle,
      theadTrStyle,
      children,
      actions,
      loading,
      placeholder,
      onScroll,
      url,
      filters,
      pagination,
      renderRow,
    },
    ref
  ) => {
    const { control, watch } = useForm({
      defaultValues: { pageSize: 20 },
    });
    const scrollPos = useRef(0);
    const [metadata, setMetadata] = useState({
      total: 0,
      page: 1,
      pageSize: 20,
    });
    const [dynamicData, setDynamicData] = useState([]);
    const tbody = useRef();
    const table = useRef();

    const { get: fetchData, loading: loadingData } = useFetch(url);

    const pageSize = watch("pageSize");

    const getData = useCallback(
      (newMetadata) => {
        fetchData({
          query: {
            ...(pagination &&
              metadata && {
                page: metadata.page,
                pageSize: metadata.pageSize,
                ...newMetadata,
              }),
            ...filters,
          },
        })
          .then(async ({ data }) => {
            if (data?.success) {
              setDynamicData(data.data);
              setMetadata(data.metadata);
            } else if (data?.message) {
              Prompt({ type: "error", message: data.message });
            }
          })
          .catch((err) => Prompt({ type: "error", message: err.message }));
      },
      [metadata, filters]
    );

    useImperativeHandle(
      ref,
      () => ({
        setData: setDynamicData,
        setMetadata,
      }),
      [setDynamicData]
    );

    useEffect(() => {
      if (url) {
        getData({ page: 1, pageSize });
      }
    }, [filters, pageSize]);
    return (
      <table
        ref={table}
        className={`${s.table} ${className || ""} ${actions ? s.actions : ""}`}
        cellPadding={0}
        cellSpacing={0}
        {...(onScroll && {
          onScroll: (e) => {
            if (scrollPos.current < e.target.scrollTop) {
              onScroll("down");
            } else {
              onScroll("up");
            }
            scrollPos.current = e.target.scrollTop;
          },
        })}
      >
        {columns && (
          <thead>
            <tr style={{ ...theadTrStyle, ...trStyle }}>
              {columns.map((column, i) => (
                <th
                  key={i}
                  className={`${column.action ? s.action : ""} ${
                    column.className || ""
                  }`}
                  style={{ ...column.style }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody ref={tbody}>
          {loading || loadingData ? (
            <tr className={s.loading}>
              <td>
                <span className={s.icon}>
                  <FaCircleNotch />
                </span>
              </td>
            </tr>
          ) : (children?.length || dynamicData.length) > 0 ? (
            <>
              {children}
              {children?.flat().filter((item) => item).length === 1 &&
                children[0]?.props?.className?.includes("inlineForm") && (
                  <tr className={s.placeholder}>
                    <td>{placeholder || <Trans>Nothing yet...</Trans>}</td>
                  </tr>
                )}
              {dynamicData.map((item, i, arr) => (
                <Fragment key={item._id}>
                  {renderRow(item, { index: i, data: arr })}
                </Fragment>
              ))}
            </>
          ) : (
            <tr className={s.placeholder}>
              <td>{placeholder || <Trans>Nothing yet...</Trans>}</td>
            </tr>
          )}
        </tbody>
        {pagination && metadata && (
          <tfoot className={s.paginationFooter}>
            <tr>
              <td>
                <div className={s.pageSize}>
                  <label>Per Page:</label>
                  <Select
                    clearable={false}
                    control={control}
                    name="pageSize"
                    options={[
                      { value: 20, label: "20" },
                      { value: 50, label: "50" },
                      { value: 100, label: "100" },
                    ]}
                  />
                </div>
                <div className={s.pageNum}>
                  <button
                    title="Previous Page"
                    className="btn icon"
                    disabled={metadata?.page <= 1}
                    onClick={() => {
                      getData({ page: metadata.page - 1 });
                    }}
                  >
                    <GoChevronLeft />
                  </button>
                  <span>
                    {metadata.total > 0 ? (
                      <span>
                        {metadata.pageSize * (metadata.page - 1) + 1}-
                        {metadata.pageSize * (metadata.page - 1) +
                          dynamicData.length}{" "}
                        of {metadata.total}
                      </span>
                    ) : (
                      metadata?.page
                    )}
                  </span>
                  <button
                    title="Next Page"
                    className="btn icon"
                    disabled={
                      !metadata.total ||
                      metadata.page * metadata.pageSize >= metadata.total
                    }
                    onClick={() => {
                      getData({ page: metadata.page + 1 });
                    }}
                  >
                    <GoChevronRight />
                  </button>
                </div>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    );
  }
);

export const TableActions = ({ actions, className }) => {
  if (actions?.length === 0) {
    return <td className={`${s.tableActions} ${className || ""}`} />;
  }

  return (
    <td className={`${s.tableActions} ${className || ""}`}>
      <Menu options={actions} />
    </td>
  );
};
