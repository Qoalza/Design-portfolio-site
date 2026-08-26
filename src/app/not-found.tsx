import { ErrorScreen } from "../components/error-screen";

export default function NotFound() {
  return (
    <ErrorScreen variant="404" title="Ох, я уже потерял тебя!" actionLabel="На главную">
      <p>Хорошо, что нашелся.<br />Давай вернемся на главную 🚀</p>
    </ErrorScreen>
  );
}
