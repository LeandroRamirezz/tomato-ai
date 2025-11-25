import os
from pathlib import Path

# 1. Obtenemos la ruta absoluta de la carpeta donde está este archivo (backend/)
BASE_DIR = Path(__file__).resolve().parent

# 2. Subimos un nivel (al proyecto) y buscamos la carpeta 'models'
# BASE_DIR.parent es la raíz del proyecto
MODELS_DIR = BASE_DIR.parent / 'models'

# Rutas internas del backend
UPLOAD_FOLDER = BASE_DIR / 'uploads'
RESULTS_FOLDER = BASE_DIR / 'results'

# Crear directorios si no existen
UPLOAD_FOLDER.mkdir(exist_ok=True)
RESULTS_FOLDER.mkdir(exist_ok=True)

class Config:
    # Configuración de MongoDB
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    MONGO_DB = os.getenv('MONGO_DB', 'tomato_classifier')
    
    # Configuración de archivos
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp', 'gif'}
    
    # Ruta de modelos disponible para la app (opcional, por si la necesitas en otro lado)
    MODELS_PATH = MODELS_DIR