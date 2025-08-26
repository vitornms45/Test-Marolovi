from flask import Flask, request, jsonify, render_template
import os
import io
import numpy as np
from PIL import Image
import onnxruntime as ort # Replaces tensorflow and ultralytics

# --- Llama Index / Chatbot imports (mantidos comentados) ---
# from llama_index.llms.groq import Groq
# from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext
# from llama_index.embeddings.huggingface import HuggingFaceEmbedding
# from llama_index.core.memory import ChatSummaryMemoryBuffer
# from llama_index.core.vector_stores import SimpleVectorStore
# from llama_index.core import Settings
# from dotenv import load_dotenv

app = Flask(__name__)

# --- Configuração dos Modelos ONNX ---
IMG_SIZE = (224, 224)

# Define o provedor de execução (CPU neste caso)
providers = ['CPUExecutionProvider']

# Carrega os modelos .onnx em sessões de inferência
# Certifique-se de que os nomes dos arquivos .onnx estão corretos
keras_session = ort.InferenceSession("Models/Modelo_Keras.onnx", providers=providers)
yolo_session = ort.InferenceSession("Models/Modelo_Yolov11.onnx", providers=providers)

# Obtém os nomes das camadas de entrada dos modelos (necessário para o ONNX)
keras_input_name = keras_session.get_inputs()[0].name
yolo_input_name = yolo_session.get_inputs()[0].name

# --- Funções de Pré-processamento de Imagem ---

def preprocess_image(img, target_size=IMG_SIZE):
    """Função genérica para abrir e redimensionar a imagem."""
    if img.mode != "RGB":
        img = img.convert("RGB")
    return img.resize(target_size)

def get_keras_input(img):
    """Prepara a imagem para o formato esperado pelo modelo Keras."""
    img_array = np.array(img, dtype=np.float32)
    # Adiciona a dimensão do batch e normaliza os pixels para o intervalo [0, 1]
    img_array = np.expand_dims(img_array, axis=0) / 255.0
    return img_array

def get_yolo_input(img):
    """Prepara a imagem para o formato esperado pelo modelo YOLO."""
    img_array = np.array(img, dtype=np.float32)
    # Reorganiza as dimensões de (Altura, Largura, Canais) para (Canais, Altura, Largura)
    img_array = img_array.transpose(2, 0, 1)
    # Adiciona a dimensão do batch e normaliza os pixels
    img_array = np.expand_dims(img_array, axis=0) / 255.0
    return img_array


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

'''
@app.route("/chat", methods=["POST"])
def chat():
    # ... (código do chatbot inalterado) ...
    pass
'''

@app.route("/oftsys", methods=["GET", "POST"])
def oftsys():
    if request.method == "POST":
        return render_template("oftsys.html")
    return render_template("oftsys.html")

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "Nenhuma imagem enviada"}), 400

    file = request.files["file"]
    
    try:
        # Abre a imagem a partir dos bytes recebidos
        img_bytes = io.BytesIO(file.read())
        img = Image.open(img_bytes)
        
        # Pré-processa a imagem uma vez
        processed_img = preprocess_image(img)

        # --- Predição com o modelo Keras via ONNX ---
        keras_input = get_keras_input(processed_img)
        keras_pred_onnx = keras_session.run(None, {keras_input_name: keras_input})[0]
        
        keras_confidence = float(np.max(keras_pred_onnx))
        keras_class = int(np.argmax(keras_pred_onnx))

        # --- Predição com o modelo YOLO via ONNX ---
        yolo_input = get_yolo_input(processed_img)
        yolo_pred_onnx = yolo_session.run(None, {yolo_input_name: yolo_input})[0]

        # A saída do YOLO é um array de probabilidades, pegamos o máximo na dimensão das classes
        yolo_confidence = float(np.max(yolo_pred_onnx, axis=1)[0])
        yolo_class = int(np.argmax(yolo_pred_onnx, axis=1)[0])

        # Retorna o resultado em formato JSON
        return jsonify({
            "keras": {
                "predicted_class": keras_class,
                "confidence": keras_confidence
            },
            "yolo": {
                "predicted_class": yolo_class,
                "confidence": yolo_confidence
            }
        })

    except Exception as e:
        # Log do erro no console do servidor para depuração
        print(f"Ocorreu um erro durante a predição: {e}")
        # Retorna uma mensagem de erro genérica para o cliente
        return jsonify({"error": "Falha ao processar a imagem no servidor."}), 500


@app.route("/analises")
def analises():
    return render_template("analises.html")

@app.route("/oftsys-cadastro-paciente")
def cadastro_paciente():
    return render_template("oftsys-cadastro-paciente.html")

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
    app.run(host='0.0.0.0', port=port)
