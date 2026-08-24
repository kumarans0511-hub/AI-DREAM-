FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (cache layer)
COPY requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt
# Pre-download the default Chroma embedding model to prevent runtime timeouts
COPY download_model.py /app/backend/download_model.py
RUN python /app/backend/download_model.py

# Copy backend code preserving the backend.app.xxx import structure
COPY . /app/backend/

EXPOSE 8000

CMD ["uvicorn", "backend.app.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
