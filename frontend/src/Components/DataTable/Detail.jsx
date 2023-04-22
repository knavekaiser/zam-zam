import { useEffect, useRef } from "react";
import { CountUp, Moment } from "Components/elements";
import { FaPlus, FaCheck, FaTimes } from "react-icons/fa";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { motion } from "framer-motion";
import s from "./dataTable.module.scss";
import { status } from "config";

export default function Detail({ data }) {
  return (
    <div className={`grid gap-1 p-1 ${s.detailWrapper}`}>
      {"member" in data && (
        <div className={s.user}>
          <motion.img
            initial={{
              rotate: 30,
              y: 20,
              opacity: 0,
              originX: "center",
              originY: "center",
            }}
            animate={{
              rotate: 0,
              y: 0,
              opacity: 1,
              originX: "center",
              originY: "center",
            }}
            transition={{ type: "easeOut", delay: 0.15, duration: 0.5 }}
            src={data.member?.photo || "/assets/avatar.webp"}
          />
          <div className={s.userDetail}>
            <span className={s.name}>{data.member?.name}</span>
            <span className={s.phone}>
              <a href={`tel:${data.member?.phone}`}>{data.member.phone}</a>
            </span>
          </div>
        </div>
      )}

      <p className={s.amount}>
        <span className={s.currencySymbol}>৳</span>
        <span className={s.number}>
          <CountUp
            number={data.amount}
            offset={10000}
            duration={1000}
            locale="en-IN"
          />
        </span>
      </p>

      <div className={s.trDetail}>
        <p className={s.summary}>
          <Moment format="MMM dd, yyyy" className={s.date}>
            {data.date}
          </Moment>
          • <span>{data.type}</span> •{" "}
          <span>{status[data.status] || data.status}</span>
        </p>
        <p className={s.remark}>{data.remark || data.description}</p>
      </div>

      {data.timeline?.length > 0 && <Timeline timeline={data.timeline} />}
    </div>
  );
}

const Timeline = ({ timeline, reversed }) => {
  return (
    <>
      <div className={s.timeline}>
        <div className={s.zigzag} />
        <h4>Timeline</h4>
        <div className={s.zigzag} />
      </div>
      <ul
        style={
          timeline.length === 1
            ? {
                borderRadius: 0,
                overflow: "hidden",
              }
            : {}
        }
      >
        {timeline
          .sort((a, b) =>
            reversed
              ? new Date(a.dateTime) < new Date(b.dateTime)
                ? 1
                : -1
              : new Date(a.dateTime) > new Date(b.dateTime)
              ? 1
              : -1
          )
          .map((item, i, arr) => (
            <TimelineItem
              key={item._id}
              item={item}
              reversed={reversed}
              lineStyle={
                arr.length > 1
                  ? arr[reversed ? i - 1 : i + 1]
                    ? {
                        background: `linear-gradient(${
                          reversed ? 0 : 180
                        }deg, ${
                          item.action === "Created" ? "rgb(var(--blue))" : ""
                        }${
                          item.action === "Approved" ? "rgb(var(--green))" : ""
                        }${
                          item.action === "Delete Requested"
                            ? "rgb(var(--orange))"
                            : ""
                        }, ${
                          arr[reversed ? i - 1 : i + 1].action === "Approved"
                            ? "rgb(var(--green))"
                            : ""
                        }${
                          arr[reversed ? i - 1 : i + 1].action ===
                          "Delete Requested"
                            ? "rgb(var(--orange))"
                            : ""
                        }${
                          arr[reversed ? i - 1 : i + 1].action === "Deleted"
                            ? "rgb(var(--red))"
                            : ""
                        })`,
                      }
                    : null
                  : {
                      background: `${
                        item.action === "Created" ? "rgb(var(--blue))" : ""
                      }${
                        item.action === "Approved" ? "rgb(var(--green))" : ""
                      }${
                        item.action === "Delete Requested"
                          ? "rgb(var(--orange))"
                          : ""
                      }${item.action === "Deleted" ? "rgb(var(--red))" : ""}`,

                      background: `linear-gradient(${reversed ? 0 : 180}deg, ${
                        item.action === "Created" ? "rgb(var(--blue))" : ""
                      }${
                        item.action === "Approved" ? "rgb(var(--green))" : ""
                      }${
                        item.action === "Delete Requested"
                          ? "rgb(var(--orange))"
                          : ""
                      } 10%, transparent ${reversed ? 85 : 75}%)`,
                    }
              }
              single={arr.length === 1}
              secondToLast={reversed ? i === 1 : i === arr.length - 2}
            />
          ))}
      </ul>
    </>
  );
};

const TimelineItem = ({ item, single, lineStyle, secondToLast, reversed }) => {
  const liRef = useRef();
  const lineRef = useRef();
  useEffect(() => {
    const liHeight = liRef.current.clientHeight;
    const line = lineRef.current;
    if (!line) return;

    if (single) {
      if (reversed) {
        line.style.top = "unset";
        line.style.bottom = "-4px";
        line.style.height = `${liHeight - 55}px`;
      } else {
        line.style.top = "-1.5rem";
        line.style.bottom = "unset";
        line.style.height = `${liHeight - 40}px`;
      }
      return;
    }

    const nextLiHeight = liRef.current.nextElementSibling?.clientHeight || null;
    const prevLiHeight =
      liRef.current.previousElementSibling?.clientHeight || null;
    if (reversed) {
      line.style.top = "unset";
      line.style.bottom = "-4px";
      line.style.height = `${
        liHeight / 2 + prevLiHeight / 2 + (secondToLast ? 68 : 34)
      }px`;
    } else {
      if (!nextLiHeight) return;
      line.style.top = "-1.4rem";
      line.style.bottom = "unset";
      line.style.height = `${
        liHeight / 2 + nextLiHeight / 2 + (secondToLast ? 68 : 34)
      }px`;
    }
  }, []);
  return (
    <li
      ref={liRef}
      style={
        single
          ? {
              padding: "1.5rem 0",
            }
          : {}
      }
    >
      <div className={s.legend}>
        <span className={s.dot}>
          {item.action === "Created" && <FaPlus />}
          {item.action === "Approved" && (
            <FaCheck style={{ fontSize: ".9em" }} />
          )}
          {item.action === "Delete Requested" && (
            <FaTimes style={{ fontSize: "1.2em" }} />
          )}
          {item.action === "Deleted" && (
            <RiDeleteBin6Fill style={{ fontSize: "1.1em" }} />
          )}
        </span>
        {lineStyle && (
          <span
            ref={lineRef}
            className={`${s.line} ${
              item.action === "Created" ? s.created : ""
            } ${item.action === "Approved" ? s.approved : ""} ${
              item.action === "Delete Requested" ? s.deleteRequested : ""
            } ${item.action === "Deleted" ? s.deleted : ""}`}
            style={lineStyle}
          />
        )}
      </div>
      <div className={s.detail}>
        <img
          src={item.staff?.photo || "/assets/avatar.webp"}
          alt="Staff Profile Photo"
        />
        <div className={s.staffDetail}>
          <p>
            <span className={s.action}>{item.action}</span>{" "}
            <span className={s.by}>by</span>
            <br />
            <span className={s.staff}>{item.staff?.name} </span>
          </p>
          <span className={s.dateTime}>
            <Moment format="MMM dd, yyyy hh:mmaaa">{item.dateTime}</Moment>
          </span>
        </div>
      </div>
    </li>
  );
};
