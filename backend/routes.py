from flask import Blueprint, request, jsonify, send_file
from services.model_service import model_manager
from services.db_service import db_service
from utils.file_helpers import save_uploaded_file
from config import UPLOAD_FOLDER, RESULTS_FOLDER
import time
from datetime import datetime

api = Blueprint('api', __name__)

@api.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'db_status': db_service.is_connected(),
        'models_loaded': list(model_manager.classification_models.keys())
    })

@api.route('/models', methods=['GET'])
def get_models():
    # Devolvemos la lista estática porque no queremos cargar todo solo para listar
    models_list = [
        {'name': 'resnet50', 'type': 'classification', 'num_classes': 10}, # Ajusta num_classes si quieres
        {'name': 'mobilenetv2', 'type': 'classification', 'num_classes': 10},
        {'name': 'efficientnetb2', 'type': 'classification', 'num_classes': 10}
    ]
    return jsonify({'classification_models': models_list})

@api.route('/classify', methods=['POST'])
def classify_image():
    if 'file' not in request.files: return jsonify({'error': 'No file'}), 400
    
    file = request.files['file']
    model_name = request.form.get('model', 'resnet50')
    
    if model_name not in model_manager.classification_models:
        return jsonify({'error': 'Modelo no encontrado'}), 404
        
    model = model_manager.get_classification_model(model_name)
    
    if not model:
        return jsonify({'error': 'Modelo no disponible o falló al cargar'}), 503
    
    try:
        start = time.time()
        model = model_manager.classification_models[model_name]
        result = model.predict(filepath)
        elapsed = time.time() - start
        
        response = {
            'model': model_name,
            **result,
            'processing_time': f"{elapsed:.2f}s"
        }
        
        # Guardar en BD de forma asíncrona o directa
        db_service.save_prediction({
            'type': 'classification',
            'model': model_name,
            'result': response,
            'image_path': str(filepath)
        })
        
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/image/<filename>')
def get_image(filename):
    # Buscar primero en uploads, luego en results
    if (UPLOAD_FOLDER / filename).exists():
        return send_file(str(UPLOAD_FOLDER / filename))
    if (RESULTS_FOLDER / filename).exists():
        return send_file(str(RESULTS_FOLDER / filename))
    return jsonify({'error': 'Imagen no encontrada'}), 404
@api.route('/compare', methods=['POST'])
def compare_models():
    """Compara todos los modelos de clasificación cargados"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    filepath = save_uploaded_file(file)
    if not filepath:
        return jsonify({'error': 'Invalid file type'}), 400
    
    top_k = int(request.form.get('top_k', 3))
    
    try:
        start = time.time()
        comparisons = {}
        
        # Iterar sobre todos los modelos cargados en el manager
        model_names = ['resnet50', 'mobilenetv2', 'efficientnetb2']
        for name in model_names:
            model = model_manager.get_classification_model(name)
            if model:
                result = model.predict(filepath, top_k=top_k)
                comparisons[name] = result
            
        elapsed = time.time() - start
        
        response = {
            'comparisons': comparisons,
            'timestamp': datetime.utcnow().isoformat(),
            'processing_time': f"{elapsed:.2f}s",
            'models_compared': len(comparisons)
        }
        
        # Guardar en BD
        db_service.save_prediction({
            'type': 'comparison',
            'models': list(comparisons.keys()),
            'result': response,
            'image_path': str(filepath)
        })
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error en comparación: {e}")
        return jsonify({'error': str(e)}), 500


@api.route('/segment', methods=['POST'])
def segment_image():
    """Ruta para segmentación con YOLO"""
    yolo = model_manager.get_segmentation_model()
    if not yolo:
        return jsonify({'error': 'Modelo de segmentación no disponible'}), 503

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    filepath = save_uploaded_file(file)
    if not filepath:
        return jsonify({'error': 'Invalid file type'}), 400

    conf = float(request.form.get('conf', 0.25))

    try:
        start = time.time()
        
        # Ruta de salida para la imagen segmentada
        filename = f"seg_{filepath.name}"
        result_path = RESULTS_FOLDER / filename
        
        # Predicción usando YOLO (ultralytics)
        # Nota: model_manager.segmentation_model es la instancia de YOLO cargada
        results = model_manager.segmentation_model.predict(
            source=str(filepath),
            conf=conf,
            save=True,
            project=str(RESULTS_FOLDER.parent), # Truco para que ultralytics guarde donde queremos
            name='results', # Carpeta temp
            exist_ok=True,
            verbose=False
        )
        
        # Ultralytics guarda automáticamente, pero para tener control total
        # a veces es mejor usar plot() y guardar manual con cv2.
        # Vamos a hacerlo manual para asegurar la ruta exacta:
        result = results[0]
        img_with_masks = result.plot()
        import cv2
        cv2.imwrite(str(result_path), img_with_masks)
        
        # Extraer datos de detección
        detections = []
        if result.boxes:
            for box in result.boxes:
                detections.append({
                    'class_id': int(box.cls),
                    'class_name': result.names[int(box.cls)],
                    'confidence': float(box.conf)
                })

        elapsed = time.time() - start

        response = {
            'num_detections': len(detections),
            'detections': detections,
            'result_image': filename, # El frontend usará /api/image/seg_...
            'processing_time': f"{elapsed:.2f}s"
        }

        # Guardar en BD
        db_service.save_prediction({
            'type': 'segmentation',
            'model': 'yolo',
            'result': response,
            'image_path': str(filepath)
        })

        return jsonify(response)

    except Exception as e:
        print(f"Error en segmentación: {e}")
        return jsonify({'error': str(e)}), 500
    
# ... imports y rutas anteriores ...

@api.route('/predictions', methods=['GET'])
def get_predictions():
    """Obtiene el historial de predicciones"""
    if not db_service.is_connected():
        return jsonify({'error': 'Base de datos no disponible'}), 503
    
    try:
        # Leer parámetros de la URL (?limit=10&type=classification)
        limit = int(request.args.get('limit', 50))
        pred_type = request.args.get('type')
        model = request.args.get('model')
        
        # Construir filtros
        filters = {}
        if pred_type:
            filters['type'] = pred_type
        if model:
            filters['model'] = model
            
        # Usar el servicio de DB que ya creamos
        predictions = db_service.get_all_predictions(limit=limit, filters=filters)
        
        return jsonify({
            'predictions': predictions,
            'count': len(predictions)
        })
    except Exception as e:
        print(f"Error obteniendo historial: {e}")
        return jsonify({'error': str(e)}), 500

@api.route('/stats', methods=['GET'])
def get_stats():
    """Obtiene estadísticas generales"""
    if not db_service.is_connected():
        return jsonify({'error': 'Base de datos no disponible'}), 503
    
    try:
        # Obtener estadísticas básicas de la DB
        db_stats = db_service.get_stats()
        
        # Enriquecer con info de los modelos cargados en memoria
        stats = {
            'total_predictions': db_stats.get('total', 0),
            'by_type': db_stats.get('by_type', {}),
            'available_models': {
                'classification': list(model_manager.classification_models.keys()),
                'segmentation': ['yolov11'] if model_manager.segmentation_model else []
            }
        }
        
        return jsonify(stats)
    except Exception as e:
        print(f"Error obteniendo stats: {e}")
        return jsonify({'error': str(e)}), 500