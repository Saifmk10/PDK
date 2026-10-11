FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app/backend
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY database-functions/ ./database-functions/

# finance.py opens ../database.db (/app/backend/database.db); mount the host file there:
#   docker run -p 8000:8000 -v "$(pwd)/database.db:/app/backend/database.db" <image>
WORKDIR /app/backend/database-functions

EXPOSE 8000
CMD ["sh", "-c", "python -c 'import finance; finance.create_schema()' && uvicorn finance:app --host 0.0.0.0 --port 8000"]



# sudo docker run -p 8000:8000 -v "$(pwd)/database.db:/app/backend/database.db" pdk-backend

# # sudo docker run -p 8000:8000 \
#   -v "$(pwd)/database.db:/app/backend/database.db" \
#   -v "$(pwd)/../certs:/certs:ro" \
#   api-https