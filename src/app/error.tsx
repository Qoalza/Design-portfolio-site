"use client";

import { ErrorScreen } from "../components/error-screen";

export default function ErrorPage() {
  return (
    <ErrorScreen variant="500" title="Что-то сломалось..." actionLabel="Перезагрузить">
      <p>Такое бывает, ты не виноват. Я уже в крусе о проблеме.<br />Подожди или попробуй перезагрузить страницу.</p>
    </ErrorScreen>
  );
}
