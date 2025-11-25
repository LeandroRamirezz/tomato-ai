from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from config import Config

class DBService:
    def __init__(self):
        self.db = None
        self.predictions = None
        self._connect()

    def _connect(self):
        try:
            client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
            client.server_info() # Trigger conexión
            self.db = client[Config.MONGO_DB]
            self.predictions = self.db['predictions']
            print("✅ MongoDB conectado")
        except Exception as e:
            print(f"⚠️  MongoDB no disponible: {e}")

    def is_connected(self):
        return self.db is not None

    def save_prediction(self, data):
        if self.predictions is not None:
            try:
                data['timestamp'] = datetime.utcnow()
                result = self.predictions.insert_one(data)
                return str(result.inserted_id)
            except Exception as e:
                print(f"Error guardando en DB: {e}")
        return None

    def get_all_predictions(self, limit=50, filters=None):
        if self.predictions is None: return []
        query = filters if filters else {}
        
        cursor = self.predictions.find(query).sort('timestamp', -1).limit(limit)
        results = []
        for doc in cursor:
            doc['_id'] = str(doc['_id'])
            results.append(doc)
        return results
    
    def get_stats(self):
        if self.predictions is None: return None
        return {
            'total': self.predictions.count_documents({}),
            'by_type': {
                'classification': self.predictions.count_documents({'type': 'classification'}),
                'segmentation': self.predictions.count_documents({'type': 'segmentation'}),
                'comparison': self.predictions.count_documents({'type': 'comparison'})
            }
        }

# Instancia Singleton
db_service = DBService()