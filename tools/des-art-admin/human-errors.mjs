export class UserFacingError extends Error {
  constructor(title, message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "UserFacingError";
    this.title = title;
    this.userMessage = message;
    this.status = options.status;
  }
}

const manualDiagnosis = (title = "Действие не выполнено") => ({
  title,
  message: "Причину не удалось определить автоматически. Сохранённые данные не изменены; требуется ручная диагностика разработчиком.",
});

export function humanError(error) {
  if (error instanceof UserFacingError) {
    return { title: error.title, message: error.userMessage, status: error.status ?? 400 };
  }

  const source = error instanceof Error ? error.message : String(error ?? "");
  if (/request body too large/i.test(source)) return {
    title: "Файл слишком большой",
    message: "Размер файла превышает допустимый предел. Уменьшите файл и загрузите его ещё раз.",
    status: 413,
  };
  if (/Unexpected token|JSON|не удалось разобрать/i.test(source)) return {
    title: "Данные не удалось прочитать",
    message: "Админка получила неполные или некорректные данные. Повторите действие; если ошибка останется, потребуется ручная диагностика разработчиком.",
    status: 400,
  };
  if (/Host|Origin|CSRF/i.test(source)) return {
    title: "Сеанс админки устарел",
    message: "Перезагрузите админку и повторите действие. Несохранённые поля останутся в локальном черновике.",
    status: 403,
  };
  if (/SVG size is invalid/i.test(source)) return {
    title: "Логотип не удалось загрузить",
    message: "SVG пустой или превышает допустимый размер. Экспортируйте логотип заново как компактный SVG и повторите загрузку.",
    status: 400,
  };
  if (/SVG extension is required/i.test(source)) return {
    title: "Для логотипа нужен SVG",
    message: "Выбран файл другого формата. Экспортируйте квадратный логотип в SVG и загрузите его ещё раз.",
    status: 400,
  };
  if (/SVG contains active or unsafe markup/i.test(source)) return {
    title: "SVG содержит небезопасные элементы",
    message: "В файле есть скрипт, внешний ресурс или другой активный элемент. Экспортируйте логотип как обычный автономный SVG без ссылок и скриптов.",
    status: 400,
  };
  if (/SVG must contain a viewBox/i.test(source)) return {
    title: "У SVG не задан размер области",
    message: "В файле отсутствует viewBox. Экспортируйте логотип из редактора с сохранением viewBox и загрузите его снова.",
    status: 400,
  };
  if (/SVG viewBox must be square/i.test(source)) return {
    title: "Логотип должен быть квадратным",
    message: "Область SVG имеет разные ширину и высоту. Поместите логотип в квадратный Frame и экспортируйте SVG заново.",
    status: 400,
  };
  if (/Проект .* не найден|Проект для публикации не найден/i.test(source)) return {
    title: "Проект не найден",
    message: "Проект больше не существует в текущей рабочей области. Обновите список проектов и выберите его заново.",
    status: 404,
  };
  if (/Неизвестное назначение Figma Frame/i.test(source)) return manualDiagnosis("Frame не удалось импортировать");
  return { ...manualDiagnosis(), status: 400 };
}
