# Usamos Python 3.10
FROM python:3.10-slim

# 1. Instalar dependencias del sistema para OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 2. Directorio de trabajo
WORKDIR /app

# 3. Copiar y limpiar requerimientos
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 4. Copiar el código
COPY . .

# 5. Crear carpetas necesarias
RUN mkdir -p uploads results && chmod 777 uploads results

# 6. Exponer el puerto 80 (Estándar de Azure)
EXPOSE 80

# 7. Variables de entorno para optimizar Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 8. Comando de inicio
# Timeout alto (600s) para que le dé tiempo de cargar los modelos
CMD ["gunicorn", "--bind", "0.0.0.0:80", "--timeout", "600", "--workers", "1", "--threads", "2", "app:create_app()"]