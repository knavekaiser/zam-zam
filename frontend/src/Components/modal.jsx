import React, { forwardRef, useEffect, useRef, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { BsX } from "react-icons/bs";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as ReactDOMClient from "react-dom/client";
import { Trans } from "react-i18next";

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
              className={`modal glass ${className || ""} ${
                head ? "withHead" : ""
              }`}
              onSubmit={(e) => e.stopPropagation()}
            >
              {head && (
                <div className="head">
                  {label}{" "}
                  <button
                    className="btn clear"
                    type="button"
                    onClick={() => setOpen(false)}
                    title="Close"
                  >
                    <BsX />
                  </button>
                </div>
              )}
              {children}
            </motion.div>
            <EscapeHandler setOpen={setOpen} />
          </>
        )}
      </AnimatePresence>,
      document.querySelector("#portal") || document.body
    );
  }
);

const EscapeHandler = ({ setOpen }) => {
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => {
      if (e.keyCode === 27) {
        const list = document.querySelector("#portal");
        const index = Array.from(list.children).findIndex(
          (item) => item == ref.current
        );
        if (index === list.children.length - 1) {
          setOpen && setOpen(false);
        }
      }
    };
    document.addEventListener("keydown", handler);

    return () => document.removeEventListener("keydown", handler);
  }, []);
  return <div display="hidden" ref={ref} />;
};

export const Prompt = ({ className, type, message, btns, callback }) => {
  const container = document.querySelector("#prompt");
  const root = ReactDOMClient.createRoot(container);

  let showContent = true;
  const decline = () => {
    cleanup();
    ["information", "success", "error"].includes(type) &&
      callback &&
      callback();
  };

  const cleanup = () => {
    showContent = false;
    root.render(<AnimatePresence></AnimatePresence>);
  };
  const confirm = () => {
    cleanup();
    callback();
  };

  root.render(
    <AnimatePresence>
      {showContent && (
        <>
          <motion.div
            key="backdrop"
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
            className={`promptBackdrop`}
          />
          <motion.div
            key="prompt"
            initial={{
              opacity: 0,
              scale: 1.3,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: {
                type: "ease",
                mass: 0.5,
                damping: 10,
                stiffness: 80,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0.7,
              transition: {
                type: "ease",
                mass: 0.5,
                damping: 10,
                stiffness: 80,
              },
            }}
            className={`prompt glass ${className || ""}`}
          >
            <div className="content">
              <button className="clear close" onClick={decline} title="Close">
                <BsX />
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
                    <BsX />
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
                          className="no btn medium secondary"
                          onClick={decline}
                          title="No"
                        >
                          <Trans>No</Trans>
                        </button>
                        <button
                          className="yes btn secondary medium"
                          onClick={confirm}
                          title={<Trans>Yes</Trans>}
                        >
                          <Trans>Yes</Trans>
                        </button>
                      </>
                    ) : (
                      <button
                        className="yes btn secondary medium"
                        onClick={decline}
                        title={<Trans>Ok</Trans>}
                      >
                        <Trans>Ok</Trans>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
