import Link from "next/link";
export default function NotFound() {
  return (
    <div className="error-state">
      <div className="eyebrow">404 · KEPIL</div>
      <h1>Запись не найдена</h1>
      <p>Такой страницы нет или у вашей организации нет доступа к записи.</p>
      <Link href="/" className="button primary">
        В рабочее пространство
      </Link>
    </div>
  );
}
