#!/bin/sh
cd backend
python3 manage.py migrate --noinput
exec daphne -b 0.0.0.0 -p ${PORT:-10000} backend.asgi:application