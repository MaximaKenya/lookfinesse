interface Props {
  title: string;
  content: string;
}

export default function InsightCard({
  title,
  content,
}: Props) {
  return (
    <div className="bg-[#111111] border border-gray-800 rounded-3xl p-6">
      <h2 className="text-xl font-semibold mb-4">
        {title}
      </h2>

      <p className="text-gray-300 whitespace-pre-line leading-7">
        {content}
      </p>
    </div>
  );
}