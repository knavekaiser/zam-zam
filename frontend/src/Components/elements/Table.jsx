import { useRef, useState, useLayoutEffect } from "react";
import s from "./elements.module.scss";
import { FaCircleNotch } from "react-icons/fa";
import { BiDotsVerticalRounded } from "react-icons/bi";
import { Modal } from "../modal";

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
                  <td>{placeholder || "Nothing yet..."}</td>
                </tr>
              )}
          </>
        ) : (
          <tr className={s.placeholder}>
            <td>{placeholder || "Nothing yet..."}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export const TableActions = ({ actions, className }) => {
  const btn = useRef();
  const popupContainerRef = useRef();
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});
  useLayoutEffect(() => {
    if (actions.length === 0) {
      return;
    }
    const { width, height, x, y } = btn.current.getBoundingClientRect();
    const top = window.innerHeight - y;
    setStyle({
      position: "absolute",
      right: window.innerWidth - (x + width),
      top: Math.max(
        Math.min(
          y + height,
          window.innerHeight -
            ((popupContainerRef.current?.querySelector("button")
              ?.clientHeight || 35) *
              actions.length +
              8)
        ),
        8
      ),
      // width: width,
      // height: 28 * actions.length,
      maxHeight: window.innerHeight - 16,
    });
  }, [open]);

  if (actions?.length === 0) {
    return <td className={`${s.tableActions} ${className || ""}`} />;
  }

  return (
    <td className={`${s.tableActions} ${className || ""}`}>
      <button
        title="Actions"
        className={s.btn}
        ref={btn}
        data-testid="gear-btn"
        onClick={() => setOpen(true)}
        type="button"
      >
        <BiDotsVerticalRounded className={s.gear} />
      </button>
      <Modal
        style={style}
        className={s.actionModal}
        open={open}
        setOpen={setOpen}
        onBackdropClick={() => setOpen(false)}
        backdropClass={s.actionBackdrop}
      >
        <div ref={popupContainerRef}>
          {actions.map((action, i) => (
            <button
              autoFocus={i === 0}
              key={i}
              tabIndex={i + 1}
              title={action.label}
              className="clear"
              onClick={() => {
                setOpen(false);
                action.callBack();
              }}
              disabled={action.disabled}
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      </Modal>
    </td>
  );
};
