from flask import Flask, request, jsonify, render_template, redirect, url_for, session
import os
import io
import numpy as np
from PIL import Image
import onnxruntime as ort 
import secrets


app = Flask(__name__)
app.secret_key = secrets.token_hex(16)

# --- Configuração dos Modelos ONNX ---
IMG_SIZE = (224, 224)
providers = ['CPUExecutionProvider']
keras_session = ort.InferenceSession("Models/Modelo_Keras.onnx", providers=providers)
yolo_session = ort.InferenceSession("Models/Modelo_Yolov11.onnx", providers=providers)
keras_input_name = keras_session.get_inputs()[0].name
yolo_input_name = yolo_session.get_inputs()[0].name

# --- Funções de Pré-processamento de Imagem ---
def preprocess_image(img, target_size=IMG_SIZE):
    if img.mode != "RGB":
        img = img.convert("RGB")
    return img.resize(target_size)

def get_keras_input(img):
    img_array = np.array(img, dtype=np.float32)
    img_array = np.expand_dims(img_array, axis=0) / 255.0
    return img_array

def get_yolo_input(img):
    img_array = np.array(img, dtype=np.float32)
    img_array = img_array.transpose(2, 0, 1)
    img_array = np.expand_dims(img_array, axis=0) / 255.0
    return img_array

# --- Rotas ---
@app.route("/")
def index():   
    return render_template("index.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/oftsys-cadastro-paciente")
def cadastro_paciente():
    return render_template("oftsys-cadastro-paciente.html")

@app.route("/oftsys", methods=["GET", "POST"])
def oftsys():
    if request.method == "POST":
        session['patient_data'] = {
            'nome': request.form.get('nome'),
            'nascimento': request.form.get('nascimento'),
            'sexo': request.form.get('sexo'),
            'prontuario': request.form.get('prontuario')
        }
        return render_template("oftsys.html")
    return redirect(url_for('cadastro_paciente'))

@app.route("/predict", methods=["POST"])
def predict():
    files = request.files.getlist("files[]")
    
    if not files or 'patient_data' not in session:
        return jsonify({"error": "Dados incompletos ou nenhuma imagem enviada."}), 400

    all_results = []

    try:
        for file in files:
            img_bytes = io.BytesIO(file.read())
            img = Image.open(img_bytes)
            
            processed_img = preprocess_image(img)

                      # Predição Keras
            keras_input = get_keras_input(processed_img)
            # keras_pred agora será algo como [[0.95]] ou [[0.12]]
            keras_pred_value = keras_session.run(None, {keras_input_name: keras_input})[0][0][0]

            # --- LÓGICA CORRIGIDA PARA CLASSIFICAÇÃO BINÁRIA ---
            threshold = 0.5
            if keras_pred_value >= threshold:
                predicted_class_keras = 1
                confidence_keras = float(keras_pred_value)
            else:
                predicted_class_keras = 0
                confidence_keras = 1.0 - float(keras_pred_value)

            yolo_input = get_yolo_input(processed_img)
            yolo_pred = yolo_session.run(None, {yolo_input_name: yolo_input})[0]

            all_results.append({
                "filename": file.filename,
                "keras": {
                    "predicted_class": predicted_class_keras,
                    "confidence": confidence_keras
                },
                "yolo": {
                    "predicted_class": int(np.argmax(yolo_pred, axis=1)[0]),
                    "confidence": float(np.max(yolo_pred, axis=1)[0])
                }
            })

        session['ia_results'] = all_results
        
        return jsonify({
            "success": True,
            "redirect_url": url_for('analises')
        })

    except Exception as e:
        print(f"Ocorreu um erro durante a predição: {e}")
        return jsonify({"error": "Falha ao processar uma das imagens no servidor."}), 500

@app.route("/analises")
def analises():
    patient_data = session.get('patient_data')
    ia_results = session.get('ia_results')
    
    if not patient_data or not ia_results:
        return redirect(url_for('cadastro_paciente'))
    
    return render_template("analises.html", patient=patient_data, results=ia_results)

@app.route("/produto")
def produto():
    return render_template("produto.html")

@app.route("/como-funciona")
def como_funciona():
    return render_template("como-funciona.html")

@app.route("/recursos")
def recursos():
    return render_template("recursos.html")


if __name__ == '__main__':
    # Obtém a porta da variável de ambiente ou usa 5000 como padrão
    port = int(os.environ.get("PORT", 5000))
    # Executa a aplicação
    app.run(host='0.0.0.0', port=port, debug=True)
