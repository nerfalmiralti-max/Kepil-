export default function Loading() {
  return (
    <div className="loading-state" role="status">
      <div className="skeleton heading" />
      <div className="skeleton subtitle" />
      <div className="metrics">
        {[1, 2, 3, 4].map((n) => (
          <div className="skeleton metric" key={n} />
        ))}
      </div>
      <div className="skeleton content" />
      <span className="sr-only">Загрузка данных KEPIL…</span>
    </div>
  );
}
