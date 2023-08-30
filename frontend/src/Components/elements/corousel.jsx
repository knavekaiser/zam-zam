import { useCallback, useEffect, useRef, useState } from "react";
import s from "./carousel.module.scss";

export default function Carousel({ children }) {
  const [index, setIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [click, setClick] = useState(null);
  const [lastMouseMove, setLastMouseMove] = useState([]);
  const [x, setX] = useState();
  const [move, setMove] = useState(0);
  const outerRef = useRef();
  const innerRef = useRef();

  const next = useCallback(() => {
    setIndex((prev) => prev + 1);
  }, []);
  const prev = useCallback(() => {
    setIndex((prev) => prev - 1);
  }, []);
  const mouseDownHandler = useCallback((e) => {
    if (e._reactName === "onTouchStart") {
      setClick({ x: e.touches["0"].clientX, y: e.touches["0"].clientY });
    } else {
      setClick({ x: e.clientX, y: e.clientY });
    }
  }, []);
  const mouseUpHandler = useCallback(() => {
    setClick(null);
    if (Math.abs(move) > containerWidth / 2) {
      if (move < 0) {
        next();
      } else {
        prev();
      }
    } else {
      const [current, last] = lastMouseMove;
      if (current && last) {
        const distance = Math.abs(current.x - last.x);
        const time = current.timeStamp - last.timeStamp;
        const velocity = distance / time;

        const scalingFactor = 1.25;
        const inertiaFactor = velocity * scalingFactor;

        if (Math.abs(move * inertiaFactor) > containerWidth / 2) {
          if (move < 0) {
            next();
          } else {
            prev();
          }
        } else {
          setX(-containerWidth * index);
        }
      } else {
        setX(-containerWidth * index);
      }
    }
    setMove(0);
    setLastMouseMove([]);
  }, [lastMouseMove, move]);
  const mouseMoveHandler = useCallback(
    (e) => {
      if (e._reactName === "onMouseMove") {
        e.preventDefault();
      }
      if (e._reactName === "onTouchMove") {
        e.clientX = e.touches["0"].clientX;
        e.clientY = e.touches["0"].clientY;
      }
      if (click) {
        const move = e.clientX - click.x; // -100 - next || 100 - prev
        if (
          (index === children.length - 1 && move < 0) ||
          (index === 0 && move > 0)
        ) {
          return;
        }
        setMove(move);
        setX(-containerWidth * index + move);
        setLastMouseMove((prev) => [
          {
            timeStamp: e.timeStamp,
            x: e.clientX,
            y: e.clientY,
          },
          prev[0] || null,
        ]);
      }
    },
    [click, move]
  );
  //   console.log(click);

  useEffect(() => {
    setX(-containerWidth * index);
  }, [index]);

  useEffect(() => {
    setContainerWidth(outerRef.current?.clientWidth);
  }, []);

  return (
    <>
      {/* <div className="flex">
        <button className="btn clear" onClick={prev} disabled={index === 0}>
          {"<"}
        </button>
        <button
          className="btn clear"
          onClick={next}
          disabled={index === children.length - 1}
        >
          {">"}
        </button>
      </div> */}
      <div ref={outerRef} className={s.outerWrapper}>
        <div
          ref={innerRef}
          style={{
            minWidth: containerWidth * children.length,
            transform: `translate(${x}px)`,
            height: innerRef.current?.children[index]?.clientHeight + "px",
            maxHeight: containerWidth * 2 + "px",
          }}
          className={`${s.innerWrapper} ${click ? s.active : ""}`}
          onMouseDown={mouseDownHandler}
          onTouchStart={mouseDownHandler}
          onMouseUp={mouseUpHandler}
          onTouchEnd={mouseUpHandler}
          onMouseLeave={mouseUpHandler}
          onMouseMove={mouseMoveHandler}
          onTouchMove={mouseMoveHandler}
        >
          {children.map((item) => {
            return (
              <div
                key={item.key}
                style={{ minWidth: containerWidth }}
                className={s.item}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
