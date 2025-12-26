from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
from io import BytesIO
from PIL import Image
import os

app = Flask(__name__)
CORS(app)

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False
    print("Warning: DeepFace not installed. Using mock emotion analysis.")

def decode_base64_image(base64_string):
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    image_data = base64.b64decode(base64_string)
    return Image.open(BytesIO(image_data))

@app.route('/api/analyze-emotion', methods=['POST'])
def analyze_emotion():
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'success': False, 'error': 'No image provided'}), 400
        
        image = decode_base64_image(data['image'])
        img_array = np.array(image.convert('RGB'))
        
        if DEEPFACE_AVAILABLE:
            result = DeepFace.analyze(img_array, actions=['emotion'], enforce_detection=False)
            if isinstance(result, list):
                result = result[0]
            emotions = result.get('emotion', {})
            dominant = result.get('dominant_emotion', 'neutral')
            confidence = emotions.get(dominant, 0) / 100
            return jsonify({'success': True, 'emotion': dominant, 'confidence': confidence, 'emotions': emotions})
        else:
            import random
            emotions = ['happy', 'neutral', 'sad', 'surprise']
            return jsonify({'success': True, 'emotion': random.choice(emotions), 'confidence': random.uniform(0.6, 0.95), 'emotions': {}})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'deepface_available': DEEPFACE_AVAILABLE})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5001)), debug=True)
