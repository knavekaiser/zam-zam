import { useRef, useState, useEffect } from "react";
import { format } from "date-fns";

export const moment = (time, _format) => {
  if (isNaN(new Date(time).getTime())) {
    return time;
  }
  return format(new Date(time), _format);
};

export const Moment = ({ format, children, ...rest }) => {
  return (
    <time {...rest} data-testid="moment">
      {moment(children, format)}
    </time>
  );
};

export const Countdown = ({ time, onEnd, format }) => {
  const time_ref = useRef(new Date(time).getTime() - new Date().getTime());
  const [t, setT] = useState({ day: 0, hour: 0, minute: 0, second: 0 });
  useEffect(() => {
    const interval = setInterval(() => {
      const s = 1000,
        m = s * 60,
        h = m * 60,
        d = h * 24;
      const day = Math.floor(time_ref.current / d),
        hour = Math.floor((time_ref.current - day * d) / h),
        minute = Math.floor((time_ref.current - (hour * h + day * d)) / m),
        second = Math.floor(
          (time_ref.current - (minute * m + day * d + hour * h)) / s
        );
      setT({ day, hour, minute, second });
      if (day === 0 && hour === 0 && minute === 0 && second === 0) {
        onEnd();
      }
      time_ref.current -= 1000;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (format) {
    return (
      <time>{format.replace(/m+/g, t.minute).replace(/s+/g, t.second)}</time>
    );
  }

  return (
    <time className="countdown">
      <span>{t.day.pad(2)}</span>
      <span>{t.hour.pad(2)}</span>
      <span>{t.minute.pad(2)}</span>
      <span>{t.second.pad(2)}</span>
    </time>
  );
};

export const getAllDates = ({ startDate, endDate, format }) => {
  const dates = [];
  let currDate = startDate;
  while (currDate <= endDate) {
    dates.push(moment(currDate, format || "YYYY-MM-DD"));
    currDate = currDate.add("0 0 0 1");
  }
  return dates;
};
