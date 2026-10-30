FROM python:3.11-slim
WORKDIR /app
COPY . /app
EXPOSE 8080
ENV PORT=8080 HOST=0.0.0.0
CMD ["python3", "run_server.py"]
