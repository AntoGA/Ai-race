<div align="center">

# 🏁 AI Racing Platform — Виртуальные гонки ИИ-пилотов

**Платформа для трансляций виртуальных гонок, где пилоты — это ИИ-модели автономного вождения**

[![CI](https://github.com/AntoGA/Ai-race/actions/workflows/ci.yml/badge.svg)](https://github.com/AntoGA/Ai-race/actions)
[![License](https://img.shields.io/github/license/AntoGA/Ai-race)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?logo=docker&logoColor=white)](#-быстрый-старт)

</div>

---

## О проекте

`AI Racing Platform` — это веб-платформа для организации и трансляции **виртуальных гонок**, в которых участвуют не люди, а **модели искусственного интеллекта**, обученные автономному вождению в различных симуляциях (CARLA, AirSim, Donkey Car и др.).

Каждая модель — это «пилот» с собственным профилем, статистикой и историей заездов. Зрители смотрят гонки в реальном времени, следят за лидербордом и общаются в чате.

### Ключевые возможности

- 📺 **Живые трансляции** — приём видеопотока из OBS Studio (RTMP/SRT), доставка зрителям через HLS (LL-HLS) и WebRTC.
- 🤖 **Профили ИИ-пилотов** — каждая модель имеет карточку: имя, команда, версия, тип обучения, статистика и история заездов.
- 🏆 **Лидерборды** — общий зачёт сезона и живой лидерборд гонки.
- 💬 **Чат** — общение зрителей в реальном времени (WebSocket).
- 🏎️ **История и архив** — записи гонок, события (обгоны, круги, финиши) и телеметрия.
- 📱 **Полная адаптация для мобильных устройств** — mobile-first интерфейс, адаптивный плеер, PWA.

---

## Архитектура

```
┌─────────────┐   захват   ┌────────────┐   RTMP    ┌──────────────────┐
│  Симулятор  │ ─────────► │ OBS Studio │ ────────► │    MediaMTX      │
│ (CARLA и др.)│            │ (кодирование│          │  (приём потока)   │
└─────────────┘            └────────────┘           └────────┬─────────┘
                                                             │ HLS/WebRTC
                                                     ┌───────▼─────────┐
                                                     │   Nginx (edge)  │
                                                     └───────┬─────────┘
        ┌──────────────┐   REST API    ┌──────────────┐     ┌───────▼─────────┐
        │   Frontend   │ ◄────────────► │   Backend    │     │   Web-плеер     │
        │   (Next.js)  │                │  (Node.js)   │     │  (hls.js/WebRTC)│
        └──────────────┘                └──────┬───────┘     └─────────────────┘
                                        ┌──────▼───────┐
                                        │  PostgreSQL  │
                                        │  + Redis     │
                                        └──────────────┘
```

### Стек технологий

| Слой | Технология |
|---|---|
| **Frontend** | Next.js (React) + TypeScript + Tailwind CSS |
| **Backend** | Node.js + Express + Socket.IO |
| **База данных** | PostgreSQL 16 |
| **Кэш/Realtime** | Redis 7 |
| **Медиасервер** | MediaMTX (RTMP/SRT → HLS/WebRTC) |
| **Хранилище VOD** | MinIO (S3-совместимое) |
| **Reverse proxy** | Nginx |
| **Деплой** | Docker Compose |

---

## 🚀 Быстрый старт

### Требования

- [Docker](https://docs.docker.com/get-docker/) и [Docker Compose](https://docs.docker.com/compose/install/) (v2+)
- OBS Studio (для источника видеопотока)

### Установка

```bash
git clone https://github.com/AntoGA/Ai-race.git
cd Ai-race
cp .env.example .env    # отредактируйте .env, задав свои пароли
docker compose up -d --build
```

После запуска:

| Сервис | Адрес |
|---|---|
| Веб-сайт | http://localhost:3000 |
| Nginx (единая точка входа) | http://localhost |
| Backend API | http://localhost:3001/api |
| MediaMTX (HLS) | http://localhost:8888 |
| MinIO Console | http://localhost:9001 |
| PostgreSQL | localhost:5432 |

### Проверка API

```bash
curl http://localhost/api/health
# → {"ok":true}
```

---

## 🎥 Подключение OBS Studio

1. OBS → **Settings → Stream**.
2. **Service:** `Custom...`.
3. **Server:** `rtmp://localhost:1935`
4. **Stream Key:** `race_001` (должен совпадать с `stream_key` в таблице `races`).

> 💡 Для задержки 1–2 сек используйте **SRT** (порт `8890`) и WebRTC-плеер.

### HLS-адрес потока

```
http://localhost/hls/race_001/index.m3u8
```

---

## 🗄️ База данных

Схема создаётся автоматически при первом запуске (`db/init.sql`), включая демо-данные.

| Таблица | Описание |
|---|---|
| `seasons` | Сезоны/чемпионаты |
| `pilots` | Профили ИИ-моделей («пилотов») |
| `races` | Гонки (расписание, статус, поток) |
| `race_participants` | Участники гонок с результатами |
| `pilot_stats` | Агрегированная статистика (пилот × сезон) |
| `race_events` | События гонки (круги, обгоны, финиши) |
| `chat_messages` | Сообщения чата |

Статистика пересчитывается автоматически триггером `refresh_pilot_stats()`.

---

## 📡 API (основные эндпоинты)

| Метод | Эндпоинт | Описание |
|---|---|---|
| GET | `/api/pilots` | Список моделей |
| GET | `/api/pilots/:id` | Карточка пилота + статистика |
| GET | `/api/pilots/:id/races` | История заездов пилота |
| GET | `/api/races` | Список гонок (`?status=live`) |
| GET | `/api/races/:id` | Детали гонки |
| GET | `/api/races/:id/participants` | Участники гонки |
| GET | `/api/leaderboard/season/current` | Лидерборд сезона |
| WS | `/socket.io/` | Чат (`join:race`, `chat:message`) |

---

## 📱 Мобильная адаптация

- Mobile-first вёрстка (1 колонка на телефоне, 2–3 на планшете, 4 на десктопе).
- Адаптивный плеер с выбором качества (ABR).
- Нативный HLS на iOS Safari, `hls.js` на Android/десктопе.
- Автовоспроизведение без звука (требование браузеров).
- Тёмная тема (AMOLED-friendly) и сенсорное управление.

---

## 🔧 Разработка

```bash
cd frontend && npm install && npm run dev
cd backend && npm install && npm run dev
```

Подробнее — [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 🧪 CI/CD

GitHub Actions (`.github/workflows/ci.yml`): сборка Docker-образов backend/frontend + проверка SQL-схемы.

---

## 🗺️ Дорожная карта

- [x] Живые трансляции (RTMP → HLS/WebRTC)
- [x] Профили ИИ-пилотов с историей
- [x] Лидерборды и чат
- [x] Мобильная адаптация
- [ ] PWA-манифест и push-уведомления
- [ ] Админ-панель для управления гонками
- [ ] Автоматический перенос записей в MinIO
- [ ] Телеметрия поверх видео (HUD-оверлей)
- [ ] Сравнение моделей (A/B на одной трассе)

---

## 📄 Лицензия

Проект распространяется под лицензией [MIT](LICENSE).
