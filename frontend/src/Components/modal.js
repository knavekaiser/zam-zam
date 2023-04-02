import React, { forwardRef, useRef } from "react";
import { FaCheck } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as ReactDOMClient from "react-dom/client";

export const Modal = forwardRef(
  (
    {
      open,
      setOpen,
      children,
      className,
      onBackdropClick,
      clickThroughBackdrop,
      backdropClass,
      style,
      head,
      label,
      entryAnimation,
      exitAnimation,
    },
    ref
  ) => {
    const backdropRef = useRef();
    return createPortal(
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: {
                  type: "spring",
                  mass: 0.5,
                  damping: 10,
                  stiffness: 80,
                },
              }}
              exit={{
                opacity: 0,
                transition: {
                  type: "spring",
                  mass: 0.5,
                  damping: 10,
                  stiffness: 80,
                },
              }}
              className={`modalBackdrop ${backdropClass || ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onBackdropClick?.();
              }}
              key="backdrop"
              style={clickThroughBackdrop ? { pointerEvents: "none" } : {}}
              ref={backdropRef}
            />
            <motion.div
              initial={
                entryAnimation?.initial || {
                  opacity: 0,
                  scale: 1.3,
                }
              }
              animate={
                entryAnimation?.animation || {
                  opacity: 1,
                  scale: 1,
                  transition: {
                    type: "ease",
                    mass: 0.5,
                    damping: 10,
                    stiffness: 80,
                  },
                }
              }
              exit={
                exitAnimation || {
                  opacity: 0,
                  scale: 0.7,
                  transition: {
                    type: "ease",
                    mass: 0.5,
                    damping: 10,
                    stiffness: 80,
                  },
                }
              }
              key="modal"
              style={{ ...style }}
              ref={ref}
              className={`modal ${className || ""} ${head ? "withHead" : ""}`}
              onSubmit={(e) => e.stopPropagation()}
            >
              {head && (
                <div className="head">
                  {label}{" "}
                  <button
                    className="btn clear"
                    type="button"
                    onClick={() => setOpen(false)}
                  >
                    <IoClose />
                  </button>
                </div>
              )}
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.querySelector("#portal") || document.body
    );
    return null;
  }
);

export const Prompt = ({ className, type, message, btns, callback }) => {
  if (type === "error") {
    // console.trace(message);
  }
  const container = document.querySelector("#prompt");
  const root = ReactDOMClient.createRoot(container);
  const cleanup = () => root.render(<></>);
  const confirm = () => {
    callback();
    cleanup();
  };
  const decline = () => {
    cleanup();
    ["information", "success", "error"].includes(type) &&
      callback &&
      callback();
  };
  if (type === "error") {
    // console.trace(message);
  }
  root.render(
    <>
      <div className={`promptBackdrop`} />
      <div data-testid="prompt" className={`prompt ${className || ""}`}>
        <div className="content">
          <button className="clear close" onClick={decline}>
            <IoClose />
          </button>
          {type === "confirmation" && (
            <div className="label confirmation">
              <span className="svg">?</span>
              {
                // <span className="promptLabel">CONFIRMATION</span>
              }
            </div>
          )}
          {type === "information" && (
            <div className="label information">
              <span className="svg">i</span>
              {
                // <span className="promptLabel">INFORMATION</span>
              }
            </div>
          )}
          {type === "success" && (
            <div className="label success">
              <span className="svg">
                <FaCheck />
              </span>
              {
                // <span className="promptLabel">SUCCESS</span>
              }
            </div>
          )}
          {type === "error" && (
            <div className="label _error">
              <span className="svg">
                <IoClose />
              </span>
              {
                // <span className="promptLabel">ERROR</span>
              }
            </div>
          )}
          <p className="question">{message}</p>
          <div className="actions">
            {btns || (
              <>
                {type === "confirmation" ? (
                  <>
                    <button
                      className="no btn secondary wd-100"
                      onClick={decline}
                    >
                      No
                    </button>
                    <button
                      className="yes btn secondary wd-100"
                      onClick={confirm}
                    >
                      Yes
                    </button>
                  </>
                ) : (
                  <button
                    className="yes btn secondary wd-100"
                    onClick={decline}
                  >
                    Ok
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
