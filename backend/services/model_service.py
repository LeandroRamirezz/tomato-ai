import json
import numpy as np
from pathlib import Path
from PIL import Image
from config import MODELS_DIR

# Importamos TensorFlow/Keras solo cuando se necesitan (dentro de las funciones o clases)
# para no saturar la memoria al inicio.

class ClassificationModel:
    def __init__(self, model_path, config_path):
        from tensorflow import keras
        from tensorflow.keras.applications.resnet50 import preprocess_input as resnet_preprocess
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mobilenet_preprocess
        from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess

        self.PREPROCESS_MAP = {
            'resnet50': resnet_preprocess,
            'mobilenetv2': mobilenet_preprocess,
            'efficientnetb2': efficientnet_preprocess,
        }

        with open(config_path, 'r') as f:
            self.config = json.load(f)
            
        self.model_name = self.config['model_name']
        self.img_size = tuple(self.config['img_size'])
        self.classes = self.config['classes']
        self.idx_to_class = {v: k for k, v in self.config['class_indices'].items()}
        
        self.preprocess_fn = self.PREPROCESS_MAP.get(self.model_name, lambda x: x / 255.0)
        
        print(f"⏳ Cargando modelo {self.model_name} en memoria...")
        self.model = keras.models.load_model(str(model_path))
        # self.model.compile() # Omitimos compile para ahorrar tiempo/memoria en carga
        print(f"✅ {self.model_name} listo!")
        
    def predict(self, image_path, top_k=3):
        img = Image.open(str(image_path)).convert('RGB')
        img = img.resize(self.img_size, Image.BILINEAR)
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)
        img_preprocessed = self.preprocess_fn(img_array)
        
        predictions = self.model.predict(img_preprocessed, verbose=0)[0]
        
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
        # NO cargamos nada al inicio
        self.classification_models = {} 
        self.segmentation_model = None
        print("⚡ ModelManager iniciado (Modo Lazy Loading)")

    def get_classification_model(self, model_name):
        """Carga el modelo solo si no está en memoria"""
        if model_name not in self.classification_models:
            print(f"⚠️ El modelo {model_name} no está en memoria. Cargándolo ahora...")
            
            # Buscar archivos
            path = MODELS_DIR / model_name
            # Buscar .h5 o .keras
            model_file = next(path.glob("*.h5"), next(path.glob("*.keras"), None))
            config_file = path / 'config.json'

            if model_file and config_file.exists():
                try:
                    self.classification_models[model_name] = ClassificationModel(model_file, config_file)
                except Exception as e:
                    print(f"❌ Error cargando {model_name}: {e}")
                    return None
            else:
                print(f"❌ Archivos de {model_name} no encontrados")
                return None
        
        return self.classification_models[model_name]

    def get_segmentation_model(self):
        """Carga YOLO solo si se necesita"""
        if self.segmentation_model is None:
            print("⚠️ YOLO no está en memoria. Cargándolo ahora...")
            try:
                from ultralytics import YOLO
                yolo_path = MODELS_DIR / 'yolo' / 'tomato_segmentation' / 'weights' / 'best.pt'
                if yolo_path.exists():
                    self.segmentation_model = YOLO(str(yolo_path))
                    print("✅ YOLO cargado")
                else:
                    print("❌ Pesos de YOLO no encontrados")
            except Exception as e:
                print(f"❌ Error cargando YOLO: {e}")
        
        return self.segmentation_model
    
    # Helpers para mantener compatibilidad con las rutas viejas
    @property
    def loaded_models_list(self):
        # Retornamos los nombres teóricos disponibles para el frontend
        return ['resnet50', 'mobilenetv2', 'efficientnetb2']

# Instancia Singleton
model_manager = ModelManager()