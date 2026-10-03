FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app/database
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY database-functions/ ./database-functions/

# finance.py opens ../database.db relative to its directory; the schema is created at build time.
WORKDIR /app/database/database-functions
RUN python -c "import finance; finance.create_schema()"

EXPOSE 8000
CMD ["uvicorn", "finance:app", "--host", "0.0.0.0", "--port", "8000"]
