from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from config import Config
import certifi
import ssl

class DBService:
    def __init__(self):
        self.db = None
        self.predictions = None
        self._connect()

    def _connect(self):
        # INTENTO 1: Conexión Segura Estándar (Recomendada)
        try:
            print("🔌 Intentando conectar a MongoDB (Modo Seguro)...")
            client = MongoClient(
                Config.MONGO_URI,
                serverSelectionTimeoutMS=5000,
                tlsCAFile=certifi.where() # Usamos certificados actualizados
            )
            # Forzamos una llamada para verificar que realmente conectó
            client.admin.command('ping')
            
            self.db = client[Config.MONGO_DB]
            self.predictions = self.db['predictions']
            print("✅ MongoDB conectado (Seguro)")
            
        except Exception as e:
            print(f"⚠️ Falló conexión segura: {e}")
            print("🔄 Activando modo de compatibilidad SSL...")
            
            # INTENTO 2: Modo Compatibilidad (Bypass SSL Handshake Error)
            try:
                client = MongoClient(
                    Config.MONGO_URI,
                    serverSelectionTimeoutMS=5000,
                    tls=True,
                    tlsAllowInvalidCertificates=True # <--- ESTO ES LA CLAVE PARA TU ERROR
                )
                client.admin.command('ping')
                
                self.db = client[Config.MONGO_DB]
                self.predictions = self.db['predictions']
                print("✅ MongoDB conectado (Modo Compatibilidad)")
                
            except Exception as e2:
                print(f"❌ ERROR CRÍTICO: No se pudo conectar a MongoDB: {e2}")
                self.db = None
                self.predictions = None

    def is_connected(self):
        return self.db is not None

    def save_prediction(self, data):
        if self.predictions is not None:
            try:
                data['timestamp'] = datetime.utcnow()
                result = self.predictions.insert_one(data)
                return str(result.inserted_id)
            except Exception as e:
                print(f"Error guardando: {e}")
        return None

    def get_all_predictions(self, limit=50, filters=None):
        if self.predictions is None: return []
        query = filters if filters else {}
        try:
            cursor = self.predictions.find(query).sort('timestamp', -1).limit(limit)
            results = []
            for doc in cursor:
                doc['_id'] = str(doc['_id'])
                results.append(doc)
            return results
        except:
            return []
    
    def get_stats(self):
        if self.predictions is None: return {}
        try:
            return {
                'total': self.predictions.count_documents({}),
                'by_type': {
                    'classification': self.predictions.count_documents({'type': 'classification'}),
                    'segmentation': self.predictions.count_documents({'type': 'segmentation'}),
                    'comparison': self.predictions.count_documents({'type': 'comparison'})
                }
            }
        except:
            return {}

# Instancia Singleton
db_service = DBService()