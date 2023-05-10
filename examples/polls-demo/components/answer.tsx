"use client";
import clsx from "clsx";

export const Answer = ({
  text,
  percentage = 0,
  showPercentage = false,
  disabled = false,
  loading = false,
  votes = 0,
  onClick,
}: {
  text: string;
  percentage?: number;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  votes?: number;
  showPercentage?: boolean;
}) => {
  return (
    <li className="flex mb-4">
      <button
        onClick={onClick}
        type="button"
        disabled={disabled || loading}
        className={clsx(
          "text-xl bg-blue-800 rounded-xl p-4 text-left block w-full relative overflow-hidden group",
          {
            "cursor-wait": loading,
            "cursor-not-allowed": disabled,
            "cursor-pointer": !disabled && !loading,
          }
        )}
      >
        <div
          className={clsx("bg-blue-500 absolute left-0 top-0 bottom-0", {
            "transition-all": disabled,
            "group-hover:!w-full": !disabled,
          })}
          style={{ width: showPercentage ? `${percentage}%` : 0 }}
        ></div>

        {loading && (
          <div
            className={clsx("bg-blue-500 absolute inset-0 animate-pulse")}
          ></div>
        )}

        <span className="relative z-10">{text}</span>
      </button>

      <div
        className={clsx(
          "flex py-4 items-center flex-col justify-center ml-4 text-xl w-28",
          {
            "opacity-0": !showPercentage,
          }
        )}
      >
        <div>{percentage.toPrecision(2)}%</div>
        <div className="text-xs">({votes} votes)</div>
      </div>
    </li>
  );
};
