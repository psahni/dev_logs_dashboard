type Variant = "green" | "violet" | "amber" | "red";

type Props = {
  label: string;
  variant?: Variant;
};

export default function Chip({ label, variant = "violet" }: Props) {
  return <span className={`chip chip-${variant}`}>{label}</span>;
}
