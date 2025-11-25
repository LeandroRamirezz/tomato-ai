from flask import Flask
from flask_cors import CORS
from config import Config
from routes import api

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Cargar configuración
    app.config.from_object(Config)
    
    # Registrar Rutas
    app.register_blueprint(api, url_prefix='/api')
    
    return app

if __name__ == '__main__':
    app = create_app()
    print(f"🚀 Servidor corriendo en puerto 5000")
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
