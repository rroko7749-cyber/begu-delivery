# Remotion - Создание видео для БегуДоставка

## Что установлено

- **Remotion** - фреймворк для программного создания видео
- **@remotion/cli** - CLI инструменты
- **@remotion/player** - плеер для предпросмотра

## Структура

```
remotion/
├── index.jsx              # Главный файл (регистрация композиций)
├── compositions/          # Видео композиции
│   └── PromoVideo.jsx    # Промо-видео БегуДоставка
└── assets/               # Ресурсы (изображения, аудио)
```

## Команды

### Предпросмотр видео
```bash
npm run video:preview
```
Откроет браузер с интерактивным предпросмотром на http://localhost:3000

### Рендер видео
```bash
npm run video:render
```
Создаст файл `out/promo.mp4` (1920x1080, 30fps, 5 секунд)

## Созданные композиции

### PromoVideo
**Длительность:** 5 секунд (150 кадров @ 30fps)  
**Разрешение:** 1920x1080 (Full HD)

**Анимации:**
- 0-1 сек: Появление логотипа с пружинным эффектом
- 1-2 сек: Плавное появление слогана
- 3-5 сек: Показ преимуществ (⚡ Быстро, 💰 Выгодно, 🔒 Надёжно)
- Фон: Плавная смена цвета

## Как создать новое видео

1. Создай файл в `remotion/compositions/MyVideo.jsx`:
```jsx
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const MyVideo = () => {
  const frame = useCurrentFrame();
  
  return (
    <AbsoluteFill style={{ backgroundColor: 'blue' }}>
      <h1>Кадр: {frame}</h1>
    </AbsoluteFill>
  );
};
```

2. Зарегистрируй в `remotion/index.jsx`:
```jsx
import { MyVideo } from './compositions/MyVideo';

<Composition
  id="MyVideo"
  component={MyVideo}
  durationInFrames={90}
  fps={30}
  width={1920}
  height={1080}
/>
```

3. Запусти предпросмотр:
```bash
npm run video:preview
```

## Возможности

- ⚛️ React компоненты для видео
- 🎨 CSS анимации
- 📊 Динамические данные
- 🔊 Аудио синхронизация
- 🎬 Композиция сцен
- 📹 Экспорт в MP4/WebM/GIF

## Примеры использования

### Для БегуДоставка:
- Промо-видео для соцсетей
- Обучающие видео для курьеров
- Видео-инструкции для клиентов
- Анимированная статистика
- Персонализированные видео для пользователей

## Документация

https://www.remotion.dev/docs
