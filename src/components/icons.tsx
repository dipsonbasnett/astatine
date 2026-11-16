import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function OverviewIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    </IconBase>
  );
}

export function CheckInIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.2 12.2 2.6 2.6 5-5.4" />
    </IconBase>
  );
}

export function VitalsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M2.5 12h4.2l2-4.8 3.2 9.6 2.3-6 1.7 1.2h5.6" />
    </IconBase>
  );
}

export function CrewIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19c.4-3.1 2.6-5 5.5-5s5.1 1.9 5.5 5" />
      <circle cx="16.5" cy="9.5" r="2.2" opacity="0.6" />
      <path d="M15.5 14.2c2.4.1 4.2 1.8 4.6 4.8" opacity="0.6" />
    </IconBase>
  );
}

export function RecoveryIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4.5V10h-5.5" />
      <path d="M7.5 12h2l1.5-3 2 6 1.5-3h2" />
    </IconBase>
  );
}

export function MissionIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="2.5" />
      <ellipse cx="12" cy="12" rx="9" ry="4.2" transform="rotate(-28 12 12)" />
      <path d="M20.2 8.2a4.6 4.6 0 0 1 .3 6.3" opacity="0.55" />
    </IconBase>
  );
}

export function ReportsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 3.5h8.5L19 8v12.5H6z" />
      <path d="M14.5 3.5V8H19M9 12h6M9 15.5h6" />
    </IconBase>
  );
}

export function BriefIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6.5 4.5h11v15h-11z" />
      <path d="M9.5 9h5M9.5 12h5M9.5 15h3" />
    </IconBase>
  );
}

export function ResearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 5.5c2.8-1.2 5.4-1.2 8 .5 2.6-1.7 5.2-1.7 8-.5v13c-2.8-1.2-5.4-1.2-8 .5-2.6-1.7-5.2-1.7-8-.5z" />
      <path d="M12 6v13" />
    </IconBase>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h7M15 7h5M4 17h5M13 17h7" />
      <circle cx="13" cy="7" r="2" />
      <circle cx="11" cy="17" r="2" />
    </IconBase>
  );
}

export function AboutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </IconBase>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </IconBase>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m7 9.5 5 5 5-5" />
    </IconBase>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </IconBase>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.2 19 6v5.2c0 4.3-2.9 7.6-7 9.6-4.1-2-7-5.3-7-9.6V6z" />
      <path d="m9 12 2.1 2.1L15.2 10" />
    </IconBase>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.5 21 20H3z" />
      <path d="M12 9v5" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </IconBase>
  );
}
