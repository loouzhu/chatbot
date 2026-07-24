import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const commonProps: IconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function MailIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="M12 3 5 6v5c0 4.7 2.8 8.2 7 10 4.2-1.8 7-5.3 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.7 1.7 3.5-3.7" />
    </svg>
  );
}

export function EyeIcon({ open, ...props }: IconProps & { open: boolean }) {
  return (
    <svg {...commonProps} {...props}>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
      {!open && <path d="m4 4 16 16" />}
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...commonProps} {...props}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}
