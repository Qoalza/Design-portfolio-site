import { LocalRequestError, PublishCommandError } from "./admin-errors.mjs";

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
  if (error instanceof LocalRequestError) {
    return {
      title: "Сеанс админки устарел",
      message: "Перезагрузите админку и повторите действие. Несохранённые поля останутся в локальном черновике.",
      status: 403,
    };
  }
  if (error instanceof PublishCommandError) {
    const messages = {
      AUTHENTICATION_FAILED: "GitHub отклонил учётные данные. Проверьте вход в GitHub и повторите публикацию.",
      PERMISSION_DENIED: "GitHub не разрешил запись в репозиторий. Проверьте права доступа перед повтором.",
      DNS_UNAVAILABLE: "Не удалось найти сервер GitHub по сети. Проверьте подключение и повторите действие.",
      HTTP2_RPC_RESET: "Соединение с GitHub было сброшено во время отправки. Публикацию можно безопасно продолжить.",
      NETWORK_UNAVAILABLE: "Соединение с GitHub недоступно. Проверьте сеть и продолжите публикацию.",
      COMMAND_FAILED: "Команда публикации завершилась с ошибкой. Данные сохранены; используйте номер диагностики для проверки.",
    };
    return { title: "Публикация остановлена", message: messages[error.failureCode] ?? messages.COMMAND_FAILED, status: 500 };
  }

  const source = error instanceof Error ? error.message : String(error ?? "");
  if (/request body too large/i.test(source)) return {
    title: "Файл слишком большой",
    message: "Размер файла превышает допустимый предел. Уменьшите файл и загрузите его ещё раз.",
    status: 413,
  };
  if (/Image MIME type is not supported/i.test(source)) return {
    title: "Формат изображения не поддерживается",
    message: "Загрузите изображение в PNG, JPEG, GIF или WebP и повторите попытку.",
    status: 400,
  };
  if (/Image extension does not match its MIME type/i.test(source)) return {
    title: "Расширение изображения не совпадает с форматом",
    message: "Переименуйте или экспортируйте файл так, чтобы расширение соответствовало его формату, затем загрузите его ещё раз.",
    status: 400,
  };
  if (/Image size must be between 1 byte and 20 MB/i.test(source)) return {
    title: "Размер изображения недопустим",
    message: "Файл пустой или превышает 20 МБ. Выберите другое изображение и повторите загрузку.",
    status: 400,
  };
  if (/(PNG|JPEG|GIF|WebP) (signature|dimensions).*invalid|WebP dimensions were not found/i.test(source)) return {
    title: "Файл не удалось распознать как изображение",
    message: "Файл повреждён или его содержимое не соответствует указанному формату. Экспортируйте изображение заново и повторите загрузку.",
    status: 400,
  };
  if (/Image resolution is invalid or exceeds 40 megapixels/i.test(source)) return {
    title: "Разрешение изображения недопустимо",
    message: "Изображение должно иметь ненулевой размер и не превышать 40 мегапикселей. Уменьшите его и повторите загрузку.",
    status: 400,
  };
  if (/first image proportion/i.test(source)) return {
    title: "Пропорции не совпадают с первым изображением",
    message: "Первое изображение фиксирует пропорции пула. Загрузите файл той же пропорции или удалите все изображения из пула, чтобы задать новую пропорцию.",
    status: 400,
  };
  if (/outside the allowed pixel range/i.test(source)) return {
    title: "Размер изображения вне допустимого диапазона",
    message: "Ширина или высота файла выходит за диапазон, указанный рядом с полем загрузки. Измените размер изображения и повторите загрузку.",
    status: 400,
  };
  if (/has an incompatible proportion/i.test(source)) return {
    title: "Пропорции изображения не подходят",
    message: "Пропорции изображения не соответствуют утверждённому визуальному слоту. Экспортируйте Frame в исходных пропорциях и повторите загрузку.",
    status: 400,
  };
  if (/is below the minimum 2× source size/i.test(source)) return {
    title: "Изображение слишком маленькое",
    message: "Для этого слота нужен файл как минимум в два раза больше его размера на странице. Загрузите изображение большего разрешения.",
    status: 400,
  };
  if (/uses an unsupported MIME type/i.test(source)) return {
    title: "Формат не подходит для этого слота",
    message: "Выбранный формат не разрешён утверждённым шаблоном. Экспортируйте изображение в формате, указанном в поле загрузки.",
    status: 400,
  };
  if (/Unexpected token|JSON|не удалось разобрать/i.test(source)) return {
    title: "Данные не удалось прочитать",
    message: "Админка получила неполные или некорректные данные. Повторите действие; если ошибка останется, потребуется ручная диагностика разработчиком.",
    status: 400,
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
