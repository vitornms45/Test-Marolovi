document.addEventListener('DOMContentLoaded', function() {
  const videos = document.querySelectorAll('.hero-video video');
  let currentVideo = 0;

  function changeVideo() {
    videos[currentVideo].classList.remove('active');
    currentVideo = (currentVideo + 1) % videos.length;
    videos[currentVideo].classList.add('active');
  }

  // Troca o vídeo a cada 5 segundos (ajuste o tempo)
  setInterval(changeVideo, 5000);
});

document.addEventListener("DOMContentLoaded", () => {
    const analyzeBtn = document.getElementById("analyzeBtn");
    const fileInput = document.getElementById("medicalFileInput");
    const dropZone = document.getElementById("dropZone");
    const confidenceEl = document.getElementById("confidenceValue");
    const errorRateEl = document.getElementById("taxaDeErro");

    // ===================== Função de envio de imagem =====================
    async function sendImage(file) {
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/predict", { method: "POST", body: formData });

            const text = await response.text();

            if (!response.ok) {
                console.error("Erro do servidor:", text);
                alert("Erro na predição: " + text);
                return;
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                console.error("Resposta não é JSON:", text);
                alert("Erro ao interpretar resposta do servidor");
                return;
            }

            // Atualiza a interface com resultados do Keras
            confidenceEl.innerText = (data.keras.confidence * 100).toFixed(1) + "%";
            errorRateEl.innerText = (100 - data.keras.confidence * 100).toFixed(1) + "%";

            console.log("Predição Keras:", data.keras);
            console.log("Predição YOLO:", data.yolo);

        } catch (error) {
            console.error("Erro ao enviar imagem:", error);
            alert("Erro ao enviar imagem para o servidor");
        }
    }

    // ===================== Botão Analyze =====================
    analyzeBtn.addEventListener("click", () => {
        if (fileInput.files.length === 0) {
            alert("Selecione uma imagem primeiro!");
            return;
        }
        sendImage(fileInput.files[0]);
    });

    // ===================== Drag and Drop =====================
    dropZone.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
    });

    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            sendImage(fileInput.files[0]);
        }
    });

});
