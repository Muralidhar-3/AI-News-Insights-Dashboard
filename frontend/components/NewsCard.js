export default function NewsCard({ article }) {
  const sentimentColor =
    article.sentiment === "POSITIVE"
      ? "text-green-600"
      : article.sentiment === "NEGATIVE"
      ? "text-red-600"
      : "text-yellow-600";

  return (
    <div className="border p-4 rounded-lg shadow-md bg-white">
      <h2 className="text-lg font-semibold mb-2">{article.title}</h2>

      {article.urlToImage && (
        <img
          src={article.urlToImage}
          alt={article.title}
          className="w-full h-40 object-cover rounded mb-2"
        />
      )}

      <p className="text-sm text-gray-700 mb-2">{article.description}</p>

      <p className={`font-medium ${sentimentColor}`}>
        Sentiment: {article.sentiment || "Unknown"}
      </p>

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 font-medium block mt-2"
      >
        Read more →
      </a>
    </div>
  );
}
