import { Link } from "react-router-dom";

type Props = {
  className?: string;
};

export function Logo({ className = "" }: Props) {
  return (
    <Link to="/" className={`inline-flex shrink-0 items-center ${className}`} aria-label="Unidades Chile">
      <img
        src="/logos/logo.png"
        alt="Automotriz Unidades Chile"
        className="h-7 w-auto max-w-[136px] object-contain object-left sm:h-9 sm:max-w-[180px] lg:h-10 lg:max-w-[200px]"
      />
    </Link>
  );
}

export function Emblem({ className = "h-11 w-11" }: Props) {
  return (
    <img
      src="/logos/emblem.png"
      alt=""
      className={`object-contain ${className}`}
    />
  );
}
