
document.addEventListener("DOMContentLoaded", () => {
    const analyzeBtn = document.getElementById("analyzeBtn");
    const clearBtn = document.getElementById("clearBtn");
    const fileInput = document.getElementById("medicalFileInput");
    const dropZone = document.getElementById("dropZone");
    const thumbnailContainer = document.getElementById("thumbnailContainer");

    if (!analyzeBtn || !clearBtn || !fileInput || !dropZone || !thumbnailContainer) {
        console.error("Erro Crítico: Um ou mais elementos essenciais não foram encontrados no HTML.");
        return;
    }

    let selectedFiles = []; // Array para armazenar todos os arquivos selecionados

    function displayThumbnails(filesToDisplay) {
        filesToDisplay.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const thumbnailWrapper = document.createElement('div');
                    thumbnailWrapper.className = 'thumbnail-preview';
                    
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    
                    const overlay = document.createElement('div');
                    overlay.className = 'thumbnail-overlay';
                    overlay.textContent = file.name;

                    thumbnailWrapper.appendChild(img);
                    thumbnailWrapper.appendChild(overlay);
                    thumbnailContainer.appendChild(thumbnailWrapper);
                };
                reader.readAsDataURL(file);
            }
        });

        if (selectedFiles.length > 0) {
            dropZone.classList.add('has-files');
            analyzeBtn.disabled = false;
        }
    }

    function clearSelection() {
        selectedFiles = [];
        fileInput.value = '';
        thumbnailContainer.innerHTML = '';
        analyzeBtn.disabled = true;
        dropZone.classList.remove('has-files');
    }

    function handleFileSelection(newFiles) {
        const filesArray = Array.from(newFiles);
        selectedFiles = selectedFiles.concat(filesArray);
        displayThumbnails(filesArray);
    }

    // Função de envio para o backend (agora envia TODOS os arquivos)
    async function sendImages(files) {
        if (files.length === 0) return;

        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ANALISANDO...';

        const formData = new FormData();
        // Adiciona cada arquivo ao FormData com a chave "files[]"
        files.forEach(file => {
            formData.append("files[]", file);
        });

        try {
            const response = await fetch("/predict", { method: "POST", body: formData });
            const data = await response.json();

            if (response.ok && data.success) {
                window.location.href = data.redirect_url;
            } else {
                throw new Error(data.error || "Erro desconhecido do servidor.");
            }
        } catch (error) {
            console.error("Erro ao enviar imagens:", error);
            alert(`Erro na predição: ${error.message}`);
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-search-plus"></i> ANALISAR IMAGENS';
        }
    }

    // --- Event Listeners ---
    analyzeBtn.addEventListener("click", () => sendImages(selectedFiles));
    clearBtn.addEventListener("click", clearSelection);
    dropZone.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("drag-over");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        handleFileSelection(e.dataTransfer.files);
    });

    fileInput.addEventListener("change", () => {
        handleFileSelection(fileInput.files);
    });
});
