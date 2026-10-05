FROM python:3.12-slim
WORKDIR /srv
ARG WITH_VOICE=true
COPY requirements.txt requirements-voice.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
 && if [ "$WITH_VOICE" = "true" ]; then pip install --no-cache-dir -r requirements-voice.txt; fi
COPY app ./app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
