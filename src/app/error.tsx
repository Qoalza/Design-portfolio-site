"use client";

import { ErrorScreen } from "../components/error-screen";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorScreen variant="500" title="Что-то сломалось..." action={<button type="button" onClick={reset}>Перезагрузить</button>}>
      <p>Такое бывает, ты не виноват. Я уже в крусе о проблеме.<br />Подожди или попробуй перезагрузить страницу.</p>
    </ErrorScreen>
  );
}
