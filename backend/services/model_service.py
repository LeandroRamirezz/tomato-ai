import json
import cv2
import numpy as np
from pathlib import Path
from PIL import Image
from tensorflow import keras
from config import MODELS_DIR

# Importaciones específicas de preprocesamiento
from tensorflow.keras.applications.resnet50 import preprocess_input as resnet_preprocess
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mobilenet_preprocess
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

class ClassificationModel:
    PREPROCESS_MAP = {
        'resnet50': resnet_preprocess,
        'mobilenetv2': mobilenet_preprocess,
        'efficientnetb2': efficientnet_preprocess,
    }
    
    def __init__(self, model_path, config_path):
        with open(config_path, 'r') as f:
            self.config = json.load(f)
            
        self.model_name = self.config['model_name']
        self.img_size = tuple(self.config['img_size'])
        self.classes = self.config['classes']
        self.idx_to_class = {v: k for k, v in self.config['class_indices'].items()}
        
        self.preprocess_fn = self.PREPROCESS_MAP.get(self.model_name, lambda x: x / 255.0)
        self.model = keras.models.load_model(str(model_path))
        self.model.compile() # Optimización inferencia
        
    def predict(self, image_path, top_k=3):
        # Carga y preprocesamiento
        img = Image.open(str(image_path)).convert('RGB')
        img = img.resize(self.img_size, Image.BILINEAR)
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)
        img_preprocessed = self.preprocess_fn(img_array)
        
        # Inferencia
        predictions = self.model.predict(img_preprocessed, verbose=0)[0]
        
        # Post-procesamiento
        top_indices = np.argsort(predictions)[::-1][:top_k]
        results = []
        for idx in top_indices:
            results.append({
                'class': self.idx_to_class[idx],
                'confidence': float(predictions[idx]),
                'confidence_percent': f"{float(predictions[idx]) * 100:.2f}%"
            })
            
        return {
            'predictions': results,
            'top_class': results[0]['class'],
            'top_confidence': results[0]['confidence']
        }

class ModelManager:
    def __init__(self):
        self.classification_models = {}
        self.segmentation_model = None
        self.load_models()
        
    def load_models(self):
        print("⚡ Cargando modelos...")
        model_names = ['resnet50', 'mobilenetv2', 'efficientnetb2']
        
        # Cargar Clasificación
        for name in model_names:
            path = MODELS_DIR / name
            # Lógica de búsqueda de archivos (simplificada para el ejemplo)
            model_file = next(path.glob("*.h5"), next(path.glob("*.keras"), None))
            config_file = path / 'config.json'
            
            if model_file and config_file.exists():
                try:
                    self.classification_models[name] = ClassificationModel(model_file, config_file)
                    print(f"✅ {name} cargado")
                except Exception as e:
                    print(f"❌ Error cargando {name}: {e}")

        # Cargar YOLO
        yolo_path = MODELS_DIR / 'yolo' / 'tomato_segmentation' / 'weights' / 'best.pt'
        if YOLO_AVAILABLE and yolo_path.exists():
            try:
                self.segmentation_model = YOLO(str(yolo_path))
                # Warmup
                self.segmentation_model.predict(np.zeros((640, 640, 3), dtype=np.uint8), verbose=False)
                print("✅ YOLO cargado")
            except Exception as e:
                print(f"❌ Error YOLO: {e}")

# Instancia Singleton
model_manager = ModelManager()