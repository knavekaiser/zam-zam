import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  forwardRef,
} from "react";
import { FaSearch, FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { BsFillExclamationTriangleFill } from "react-icons/bs";
import { AiTwotoneCalendar } from "react-icons/ai";
import { useForm, Controller } from "react-hook-form";
import { Modal } from "../modal";
import TextareaAutosize from "react-textarea-autosize";
import AvatarEditor from "react-avatar-editor";
import { BsFilePerson } from "react-icons/bs";

import s from "./elements.module.scss";
import countries from "./countries";
import { useFetch } from "hooks";
import { phone } from "phone";
import { animate } from "framer-motion";

// import { useTransitionValue } from "react-transition-value";

import { Combobox } from "./combobox";
import { motion } from "framer-motion";

export const Input = forwardRef(
  ({ className, label, icon, error, type, required, ...rest }, ref) => {
    const _id = useRef(Math.random().toString(32).substr(-8));
    return (
      <section
        className={`${s.input} ${className || ""} ${error ? s.err : ""}`}
      >
        {label && (
          <label>
            {label} {required && "*"}
          </label>
        )}
        <div className={s.wrapper}>
          <div className={s.field}>
            <input
              ref={ref}
              type={type || "text"}
              id={rest.id || _id.current}
              {...rest}
              placeholder={rest.placeholder || "Enter"}
            />
            {["date", "datetime-local"].includes(type) && (
              <label
                htmlFor={rest.id || _id.current}
                className={s.calenderIcon}
              >
                <AiTwotoneCalendar />
              </label>
            )}
            {icon && icon}
          </div>
          {error && <span className={s.errMsg}>{error.message}</span>}
        </div>
      </section>
    );
  }
);
export const SearchField = ({
  url,
  data: defaultData,
  getQuery,
  type,
  custom,
  processData,
  renderListItem,
  label,
  onChange,
  watch,
  name,
  setValue,
  register,
  formOptions,
  error,
  renderField,
  clearErrors,
  className,
  ...rest
}) => {
  const [data, setData] = useState([]);
  const value = watch(name);
  const [showResult, setShowResult] = useState(false);
  const [style, setStyle] = useState({});
  const clickHandlerAdded = useState(false);
  const container = useRef();

  const { get: getData } = useFetch(url);

  useLayoutEffect(() => {
    const { width, height, x, y } = container.current.getBoundingClientRect();
    setStyle({
      position: "absolute",
      left: x,
      top: Math.max(
        Math.min(
          y + height,
          window.innerHeight - Math.min(35 * (data.length || 0) + 8, 320)
          // window.innerHeight - (35 * (options?.length || 0) + 8)
        ),
        8
      ),
      width: width,
      maxHeight: Math.min(window.innerHeight - 16, 300),
    });
  }, [showResult, data]);
  useEffect(() => {
    const clickHandler = (e) => {
      if (e.path && !e.path.includes(container.current)) {
        setShowResult(false);
      }
    };
    if (!clickHandlerAdded.current) {
      document.addEventListener("click", clickHandler);
      return () => {
        document.removeEventListener("click", clickHandler);
      };
    }
  }, [showResult]);
  useEffect(() => {
    if (value) {
      if (url) {
        getData({ query: getQuery(value) || {} }).then(({ data }) => {
          const _data = processData(data, value);
          setData(_data);
        });
      } else if (defaultData) {
        setData(
          defaultData.filter((item) =>
            new RegExp(value.replace(/[#-.]|[[-^]|[?|{}]/g, "\\$&"), "ig").test(
              item.label
            )
          )
        );
      }
    }
  }, [value]);
  return (
    <section ref={container} className={className || ""}>
      {renderField ? (
        renderField({
          register,
          watch,
          setValue,
          name,
          formOptions,
          error,
          clearErrors,
          setShowResult,
        })
      ) : (
        <Input
          label={label}
          onFocus={(e) => setShowResult(true)}
          {...register(name, formOptions)}
          autoComplete="off"
          onBlur={(e) => {
            if (!value) {
              setData([]);
            }
          }}
          error={error}
          type={type || "text"}
          icon={<FaSearch />}
        />
      )}
      <Modal
        open={showResult && data.length > 0}
        className={s.searchFieldModal}
        backdropClass={s.searchFieldModalBackdrop}
        style={style}
        onBackdropClick={() => setShowResult(false)}
        clickThroughBackdrop={true}
      >
        <ul className={s.options}>
          {data.map((item, i) => (
            <li
              key={i}
              onClick={() => {
                setValue(name, item.label);
                onChange(item.data || item);
              }}
            >
              {renderListItem(item)}
            </li>
          ))}
        </ul>
      </Modal>
    </section>
  );
};

export const PasswordInput = ({
  className,
  label,
  name,
  control,
  formOptions,
  placeholder,
  ...rest
}) => {
  const [type, setType] = useState("password");
  return (
    <Controller
      control={control}
      name={name}
      rules={formOptions}
      render={({
        field: { onChange, onBlur, value, name, ref },
        fieldState: { isTouched, isDirty, error },
      }) => (
        <section
          className={`${s.input} ${className || ""} ${error ? s.err : ""} ${
            s.passwordInput
          }`}
        >
          {label && (
            <label>
              {label} {formOptions.required && "*"}
            </label>
          )}
          <div className={s.wrapper}>
            <span className={s.field}>
              <input
                ref={ref}
                type={type}
                onChange={onChange}
                placeholder={placeholder || "Enter"}
                {...rest}
              />
              {value && (
                <button
                  title="Toggle Visibility"
                  className={s.eye}
                  type="button"
                  onClick={() =>
                    setType(type === "password" ? "text" : "password")
                  }
                >
                  {type === "password" ? <FaRegEye /> : <FaRegEyeSlash />}
                </button>
              )}
            </span>
            {error && <span className={s.errMsg}>{error.message}</span>}
          </div>
        </section>
      )}
    />
  );
};

export const AvatarInput = ({ control, name, formOptions = {}, className }) => {
  const canvas = useRef();
  const [file, setFile] = useState(null);
  const [blob, setBlob] = useState(null);
  const [scale, setScale] = useState(1);
  return (
    <Controller
      control={control}
      name={name}
      rules={formOptions}
      render={({
        field: { onChange, onBlur, value, name, ref },
        fieldState: { invalid, isTouched, isDirty, error },
      }) => {
        return (
          <>
            <section className={`${s.imgInput} ${className || ""}`}>
              <label htmlFor={name}>
                {value?.[0] && typeof value[0] === "string" ? (
                  <img src={value[0]} alt="Profile Photo" />
                ) : blob ? (
                  <img src={URL.createObjectURL(blob)} alt="Profile Photo" />
                ) : (
                  <BsFilePerson />
                )}
              </label>
              <input
                style={{ display: "none" }}
                id={name}
                type="file"
                required={formOptions.required}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </section>

            <Modal open={file} className={s.avatarModal}>
              <div className={s.canvasWrapper}>
                <AvatarEditor
                  ref={canvas}
                  image={file}
                  scale={scale}
                  rotate={0}
                  height={250}
                  width={250}
                  border={3}
                  color={[255, 255, 255, 0.25]}
                  borderRadius={350}
                />
              </div>
              <div className={s.range}>
                <input
                  type="range"
                  value={scale}
                  min={1}
                  max={4}
                  step="0.1"
                  onChange={(e) => setScale(+e.target.value)}
                />
              </div>
              <div className={`${s.actions} p-1 flex justify-center`}>
                <button
                  title="Cancel"
                  className={`btn clear ${s.cancel}`}
                  type="button"
                  onClick={() => setFile(null)}
                >
                  Cancel
                </button>
                <button
                  title="Submit"
                  className={`btn ${s.submit}`}
                  type="button"
                  onClick={() => {
                    canvas.current.getImageScaledToCanvas().toBlob((blob) => {
                      onChange(
                        new File([blob], "newAvatar", {
                          lastModified: new Date().getTime(),
                          type: blob.type,
                        })
                      );
                      setBlob(blob);
                    }, "image/webp");
                    setFile(null);
                  }}
                >
                  Submit
                </button>
              </div>
            </Modal>
          </>
        );
      }}
    />
  );
};

export const Textarea = ({
  control,
  name,
  label,
  formOptions,
  showLimit,
  min,
  max,
  className,
  ...rest
}) => {
  return (
    <Controller
      control={control}
      name={name}
      rules={formOptions}
      render={({
        field: { onChange, onBlur, value = "", name, ref },
        fieldState: { invalid, isTouched, isDirty, error },
      }) => {
        return (
          <section
            className={`${s.input} ${s.textarea} ${className || ""} ${
              error ? s.err : ""
            }`}
            data-testid="customRadioInput"
          >
            {label && (
              <label>
                {label} {formOptions?.required && "*"}
              </label>
            )}
            <div className={s.field}>
              <TextareaAutosize
                ref={ref}
                onChange={onChange}
                value={value}
                required={formOptions?.required}
                minLength={min}
                maxLength={max}
                {...rest}
              />
              {max && showLimit && (
                <p className={s.charLimit}>
                  {`${max - value.length} characters left!`}
                </p>
              )}
            </div>
            {error && <span className={s.errMsg}>{error.message}</span>}
          </section>
        );
      }}
    />
  );
};

export const Radio = ({
  register = () => {},
  formOptions,
  name,
  options,
  onChange,
  error,
}) => {
  return (
    <section
      className={`${s.radio} ${error ? s.err : ""}`}
      data-testid="radioInput"
    >
      {options.map(({ label, value: v, hint, disabled }, i) => (
        <label
          key={i}
          htmlFor={name + v}
          className={disabled ? s.disabled : ""}
        >
          <input
            {...register(name, { ...formOptions })}
            type="radio"
            name={name}
            id={name + v}
            className="label"
            value={v}
          />
          {label}
          {hint && <span className={s.hint}>{hint}</span>}
        </label>
      ))}
      {error && <span className={s.errMsg}>{error.message}</span>}
    </section>
  );
};

export const Toggle = ({ name, control, formOptions, disabled }) => {
  const id = useRef(Math.random().toString(36).substr(-8));

  return (
    <Controller
      control={control}
      name={name}
      rules={formOptions}
      render={({
        field: { onChange, onBlur, value, name, ref },
        fieldState: { invalid, isTouched, isDirty, error },
      }) => {
        return (
          <section
            data-testid="toggleInput"
            className={`${s.toggle} ${value || value ? s.on : ""} ${
              disabled ? s.disabled : ""
            }`}
            onClick={(e) => {
              e.target.querySelector("label")?.click();
            }}
            tabIndex={0}
            onKeyDown={(e) => {
              if ([32, 13, 39, 37].includes(e.keyCode)) {
                e.preventDefault();
                // if ([32, 13].includes(e.keyCode)) {
                //   setValue(name, !value);
                // }
                // if (e.keyCode === 39) {
                //   setValue(name, false);
                // }
                // if (e.keyCode === 37) {
                //   setValue(name, true);
                // }
              }
            }}
          >
            <input
              ref={ref}
              type="checkbox"
              checked={!!value}
              onChange={onChange}
              style={{ display: "none" }}
              name={name}
              id={id.current}
            />
            <label className={s.ball} htmlFor={id.current} />
            {error && <span className={s.errMsg}>{error.message}</span>}
          </section>
        );
      }}
    />
  );
};

export const MobileNumberInput = ({
  label,
  className,
  name,
  control,
  formOptions,
  icon,
  ...rest
}) => {
  const { control: cControl, setValue: cSetValue } = useForm();
  const [country, setCountry] = useState(null);
  const change = useCallback(
    (_value, onChange) => {
      const _number = _value?.trim().startsWith("+") && phone(_value);
      if (_number?.isValid) {
        const country = countries.find((c) => c.iso2 === _number.countryIso2);
        cSetValue("country", country.code);
        setCountry({
          value: country.code,
          label: country.name,
          iso2: country.iso2,
        });
        onChange(_number.phoneNumber);
      } else if (country) {
        const _number = phone(_value, { country: country.iso2 });
        if (_number.isValid) {
          onChange(_number.phoneNumber);
        } else {
          onChange(_value);
        }
      } else {
        onChange(_value);
      }
    },
    [country]
  );
  useEffect(() => {
    const preferredCountry = countries.find((c) => c.iso2 === "IN");
    cSetValue("country", preferredCountry.code);
    setCountry({
      value: preferredCountry.code,
      label: preferredCountry.name,
      iso2: preferredCountry.iso2,
    });
  }, []);
  return (
    <Controller
      control={control}
      name={name}
      rules={{ ...formOptions }}
      render={({
        field: { onChange, onBlur, value, name, ref },
        fieldState: { invalid, isTouched, isDirty, error },
      }) => (
        <section
          data-testid="mobileNumberInput"
          className={`${s.input} ${s.mobileNumberInput} ${className || ""} ${
            error ? s.err : ""
          }`}
        >
          {label && (
            <label>
              {label} {formOptions.required && "*"}
            </label>
          )}
          <div className={s.wrapper}>
            <span className={s.field}>
              <div className={s.country}>
                <Combobox
                  className={s.countryFlags}
                  options={countries.map((c) => ({
                    value: c.code,
                    label: c.name,
                    iso2: c.iso2,
                  }))}
                  item={(option) => {
                    return (
                      <>
                        <img
                          src={`https://flagcdn.com/w20/${option.iso2.toLowerCase()}.webp`}
                          alt={`Country Flag - ${option.iso2}`}
                        />
                        <p style={{ marginLeft: "6px", display: "inline" }}>
                          {option.label}
                        </p>
                      </>
                    );
                  }}
                  renderValue={(selected) => {
                    return selected ? (
                      <img
                        src={`https://flagcdn.com/w20/${countries
                          .find((c) => c.code === selected)
                          ?.iso2.toLowerCase()}.webp`}
                        alt={`Country Flag - ${
                          countries.find((c) => c.code === selected)?.iso2 || ""
                        }`}
                      />
                    ) : (
                      "No"
                    );
                  }}
                  control={cControl}
                  name="country"
                  onChange={(option) => {
                    setCountry(option);
                    // clearErrors?.(name);
                    const _number =
                      value && phone(value, { country: option.iso2 });
                    if (_number?.isValid) {
                      onChange(_number.phoneNumber);
                    }
                  }}
                />
              </div>
              <input
                type="text"
                onChange={(e) => {
                  change(e.target.value, onChange);
                }}
                onPaste={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  let _value = (
                    e.clipboardData || window.clipboardData
                  ).getData("Text");
                  if (_value.replace(/[^0-9]/gi, "")) {
                    _value = `${
                      _value.startsWith("+") ? "+" : ""
                    }${_value.replace(/[^0-9]/gi, "")}`;
                  }
                  change(_value, onChange);
                }}
                name={name}
                value={value || ""}
                ref={ref}
                maxLength="15"
                {...rest}
              />
              {error && (
                <span className={s.errIcon}>
                  <BsFillExclamationTriangleFill />
                </span>
              )}
              {icon && icon}
            </span>
            {error && <span className={s.errMsg}>{error.message}</span>}
          </div>
        </section>
      )}
    />
  );
};
export const Checkbox = forwardRef(
  ({ label, readOnly, className, ...rest }, ref) => {
    const id = useRef(Math.random().toString(36).substr(-8));
    return (
      <section
        className={`${s.checkbox} ${className || ""}`}
        style={readOnly ? { pointerEvents: "none" } : {}}
        data-testid="checkbox-input"
      >
        <input ref={ref} id={id.current} type="checkbox" {...rest} />
        {label && <label htmlFor={id.current}>{label}</label>}
      </section>
    );
  }
);

export const CountUp = ({
  number = 0,
  duration = 5000,
  offset = 1000,
  ease,
  locale,
}) => {
  const nodeRef = useRef();
  useEffect(() => {
    const node = nodeRef.current;
    const controls = animate(Math.max(number - offset, 0), number, {
      duration: duration / 1000,
      onUpdate(value) {
        if (locale) {
          node.textContent = Math.round(value).toLocaleString(locale);
          return;
        }
        node.textContent = Math.round(value);
      },
    });

    return () => controls.stop();
  }, [number]);

  return <span ref={nodeRef} />;
};

export const Spinner = ({ size }) => {
  return (
    <div className={s.spinner} style={{ fontSize: size || "1rem" }}>
      <motion.svg
        version="1.0"
        xmlns="http://www.w3.org/2000/svg"
        width="3em"
        height="3em"
        viewBox="0 0 1000.000000 1000.000000"
        preserveAspectRatio="xMidYMid meet"
        initial={{
          rotate: 180,
        }}
        animate={{
          rotate: [180, 275, 360, 450, 540],
        }}
        transition={{
          repeat: Infinity,
          ease: [0.65, 0.04, 0.23, 0.92],
          duration: 5,
          times: [1, 1, 1, 1],
        }}
      >
        <defs>
          <linearGradient
            id="grad1"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
            gradientTransform="rotate(-45)"
          >
            <stop
              offset="0%"
              style={{
                stopColor: "var(--primary-color-dark1)",
                stopOpacity: 0.7,
              }}
            />
            <stop
              offset="100%"
              style={{
                stopColor: "var(--primary-color-dark2)",
                stopOpacity: 0.7,
              }}
            />
          </linearGradient>
        </defs>
        <g transform="translate(0.000000,1000.000000) scale(0.100000,-0.100000)">
          <motion.path
            style={{
              fill: "url(#grad1)",
              stroke: "none",
            }}
            d="M 0 0 L 10000 0 L 10000 10000 L 0 10000 Z M 4690 9400 L 5300 9400 L 5300 9400 L 5300 9400 L 5300 9400 L 9400 9400 L 9400 3640 L 9400 3640 L 9400 3030 L 9400 3030 L 9400 600 L 5290 600 L 5290 600 L 4680 600 L 4680 600 L 4680 600 L 4680 600 L 600 600 L 600 6370 L 600 6370 L 600 6980 L 600 6980 L 600 9400 L 4690 9400 Z"
            animate={{
              d: [
                "M 0 0 L 10000 0 L 10000 10000 L 0 10000 Z M 4690 9400 L 5300 9400 L 5300 9400 L 5300 9400 L 5300 9400 L 9400 9400 L 9400 3640 L 9400 3640 L 9400 3030 L 9400 3030 L 9400 600 L 5290 600 L 5290 600 L 4680 600 L 4680 600 L 4680 600 L 4680 600 L 600 600 L 600 6370 L 600 6370 L 600 6980 L 600 6980 L 600 9400 L 4690 9400 Z",
                "M 0 0 L 10000 0 L 10000 10000 L 0 10000 Z M 4690 6360 L 5300 6360 L 5300 6970 L 5300 6970 L 5300 9400 L 9400 9400 L 9400 3640 L 9400 3640 L 9400 3030 L 9400 3030 L 9400 600 L 5290 600 L 5290 3650 L 4680 3650 L 4680 3040 L 4680 3040 L 4680 600 L 600 600 L 600 6370 L 600 6370 L 600 6980 L 600 6980 L 600 9400 L 4690 9400 Z",
                "M 0 0 L 10000 0 L 10000 10000 L 0 10000 Z M 4690 6360 L 7100 6360 L 7100 6970 L 5300 6970 L 5300 9400 L 9400 9400 L 9400 3640 L 7280 3640 L 7280 3030 L 9400 3030 L 9400 600 L 5290 600 L 5290 3650 L 2890 3650 L 2890 3040 L 4680 3040 L 4680 600 L 600 600 L 600 6370 L 2700 6370 L 2700 6980 L 600 6980 L 600 9400 L 4690 9400 Z",
                "M 0 0 L 10000 0 L 10000 10000 L 0 10000 Z M 4690 6360 L 5300 6360 L 5300 6970 L 5300 6970 L 5300 9400 L 9400 9400 L 9400 3640 L 9400 3640 L 9400 3030 L 9400 3030 L 9400 600 L 5290 600 L 5290 3650 L 4680 3650 L 4680 3040 L 4680 3040 L 4680 600 L 600 600 L 600 6370 L 600 6370 L 600 6980 L 600 6980 L 600 9400 L 4690 9400 Z",
                "M 0 0 L 10000 0 L 10000 10000 L 0 10000 Z M 4690 9400 L 5300 9400 L 5300 9400 L 5300 9400 L 5300 9400 L 9400 9400 L 9400 3640 L 9400 3640 L 9400 3030 L 9400 3030 L 9400 600 L 5290 600 L 5290 600 L 4680 600 L 4680 600 L 4680 600 L 4680 600 L 600 600 L 600 6370 L 600 6370 L 600 6980 L 600 6980 L 600 9400 L 4690 9400 Z",
              ],
            }}
            transition={{
              repeat: Infinity,
              ease: [0.65, 0.04, 0.23, 0.92],
              duration: 5,
              times: [0, 1, 1, 1, 1, 0],
            }}
          />
        </g>
      </motion.svg>
    </div>
  );
};
