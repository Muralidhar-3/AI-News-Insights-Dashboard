export default function NewsCard({ article }) {
  return (
    <div className="border p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-2">{article.title}</h2>
      {article.urlToImage && (
        <img
          src={article.urlToImage}
          alt={article.title}
          className="w-full h-40 object-cover rounded mb-2"
        />
      )}
      <p className="text-sm text-gray-700 mb-2">{article.description}</p>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 font-medium"
      >
        Read more →
      </a>
    </div>
  );
}
