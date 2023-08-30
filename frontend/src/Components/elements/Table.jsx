import { useRef } from "react";
import s from "./elements.module.scss";
import { FaCircleNotch } from "react-icons/fa";
import { Trans } from "react-i18next";
import Menu from "./menu";

export const Table = ({
  columns,
  className,
  trStyle,
  theadTrStyle,
  children,
  actions,
  loading,
  placeholder,
  onScroll,
}) => {
  const scrollPos = useRef(0);
  const tbody = useRef();
  const table = useRef();
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
        {loading ? (
          <tr className={s.loading}>
            <td>
              <span className={s.icon}>
                <FaCircleNotch />
              </span>
            </td>
          </tr>
        ) : children?.length > 0 ? (
          <>
            {children}
            {children.flat().filter((item) => item).length === 1 &&
              children[0]?.props?.className?.includes("inlineForm") && (
                <tr className={s.placeholder}>
                  <td>{placeholder || <Trans>Nothing yet...</Trans>}</td>
                </tr>
              )}
          </>
        ) : (
          <tr className={s.placeholder}>
            <td>{placeholder || <Trans>Nothing yet...</Trans>}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

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
