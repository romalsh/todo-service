# To-Do Service

Бэкенд для мобильного To-Do приложения: NestJS, REST, PostgreSQL, JWT-авторизация.

## Стек

- NestJS + TypeScript
- PostgreSQL + TypeORM (миграции)
- JWT (passport-jwt), bcrypt
- Swagger, Helmet, rate limiting (throttler)

## Запуск

### Через Docker (всё разом)

```bash
docker compose up --build
```

Поднимет PostgreSQL и приложение на `http://localhost:3000`.

### Локально

```bash
docker compose up postgres -d   # только база
npm install
cp .env.example .env
npm run migration:run           # накатить миграции
npm run dev                     # watch-режим
```

## Окружение

Переменные - в [.env.example](.env.example). Ключевое:

| Переменная       | Назначение               | По умолчанию |
|------------------|--------------------------|--------------|
| `PORT`           | порт приложения          | `3000`       |
| `DB_*`           | подключение к PostgreSQL | см. example  |
| `JWT_SECRET`     | секрет для JWT           | -            |
| `JWT_EXPIRES_IN` | время жизни токена       | `1h`         |

> `JWT_SECRET` обязателен - без него приложение не стартует. В production задайте свой.

## API

Глобальный префикс - `/api`. Swagger UI: `http://localhost:3000/docs`.

| Метод    | Путь                  | Описание                             | Auth |
|----------|-----------------------|--------------------------------------|------|
| `POST`   | `/api/auth/register`  | регистрация, выдаёт токен            | -    |
| `POST`   | `/api/auth/login`     | вход, выдаёт токен                   | -    |
| `POST`   | `/api/tasks`          | создать задачу                       | JWT  |
| `GET`    | `/api/tasks`          | активные задачи (фильтр + пагинация) | JWT  |
| `GET`    | `/api/tasks/archived` | архивные задачи (read-only)          | JWT  |
| `GET`    | `/api/tasks/:id`      | одна задача                          | JWT  |
| `PATCH`  | `/api/tasks/:id`      | обновить активную задачу             | JWT  |
| `DELETE` | `/api/tasks/:id`      | архивировать (soft-delete, 204)      | JWT  |

Статусы задачи: `todo`, `in_progress`, `done`. Пагинация: `page` (≥1), `limit` (1–100), `order` (`ASC`/`DESC`).

## Примеры curl

Регистрация (или `login`) - в ответе `accessToken`:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password123"}'
```

Дальше подставляем токен в `Authorization: Bearer <token>`:

```bash
TOKEN=<accessToken>

# Создать задачу
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Купить продукты","description":"Молоко, яйца, хлеб","status":"todo"}'

# Список активных (фильтр по статусу + пагинация)
curl "http://localhost:3000/api/tasks?status=todo&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Архивные
curl http://localhost:3000/api/tasks/archived \
  -H "Authorization: Bearer $TOKEN"

# Обновить задачу
curl -X PATCH http://localhost:3000/api/tasks/<id> \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"done"}'

# Архивировать (soft-delete)
curl -X DELETE http://localhost:3000/api/tasks/<id> \
  -H "Authorization: Bearer $TOKEN"
```

## Тесты

```bash
npm run test:unit   # юнит-тесты
npm run test:e2e    # e2e (поднимает Postgres через testcontainers)
npm test            # всё разом
```
