export default function Loading() {
  return (
    <div className="loading-state" role="status">
      <div className="skeleton heading" />
      <div className="skeleton subtitle" />
      <div className="loading-rows" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <div className="skeleton loading-row" key={n} />
        ))}
      </div>
      <span className="sr-only">Загрузка данных KEPIL…</span>
    </div>
  );
}
