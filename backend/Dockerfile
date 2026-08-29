FROM python:3.11-slim AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt


FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib/python3.11/site-packages \
    /usr/local/lib/python3.11/site-packages

COPY --from=builder /usr/local/bin \
    /usr/local/bin

COPY . .

RUN useradd -m appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 10000

CMD ["sh", "-c", "cd backend && python3 manage.py migrate --noinput && daphne -b 0.0.0.0 -p ${PORT:-10000} core.asgi:application"]