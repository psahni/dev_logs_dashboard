type Props = { tag: string };

export default function TagChip({ tag }: Props) {
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
      {tag}
    </span>
  );
}
