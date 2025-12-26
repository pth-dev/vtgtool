#!/bin/bash
cd /root/vtgtool/packages/backend
source venv/bin/activate

export DATABASE_URL="postgresql+asyncpg://vtg_dev:dev_password_2024@localhost:5433/vtgtool_dev"
export REDIS_URL="redis://172.18.0.3:6379"
export SECRET_KEY="dev_secret_key_2024"
export ENVIRONMENT=development

uvicorn main:app --reload --port 8001 --host 0.0.0.0

