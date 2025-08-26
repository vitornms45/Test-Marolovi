 // Toggle Sidebar
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.querySelector('.vertical-sidebar');
        
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
        
        // Chatbot Toggle
        const chatButton = document.getElementById('chat-button');
        const chatContainer = document.getElementById('chat-container');
        const closeChat = document.getElementById('close-chat');
        
        chatButton.addEventListener('click', () => {
            chatContainer.style.display = chatContainer.style.display === 'flex' ? 'none' : 'flex';
        });
        
        closeChat.addEventListener('click', () => {
            chatContainer.style.display = 'none';
        });
        
        // Drag and Drop for Upload
        const dropArea = document.getElementById('drop-area');
        const fileInput = document.getElementById('file-input');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            dropArea.style.borderColor = 'var(--primary-color)';
            dropArea.style.backgroundColor = 'rgba(52, 152, 219, 0.05)';
        }
        
        function unhighlight() {
            dropArea.style.borderColor = 'var(--border-color)';
            dropArea.style.backgroundColor = 'transparent';
        }
        
        dropArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            fileInput.files = files;
            handleFiles(files);
        }
        
        fileInput.addEventListener('change', function() {
            handleFiles(this.files);
        });
        
        function handleFiles(files) {
            if (files.length) {
                const file = files[0];
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    dropArea.innerHTML = `
                        <div style="text-align: center;">
                            <i class="bi bi-file-earmark-text" style="font-size: 1.5rem; color: var(--primary-color);"></i>
                            <h3 style="margin: 8px 0 4px; font-size: 0.9rem;">${file.name}</h3>
                            <p style="color: #7f8c8d; font-size: 0.75rem;">${(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    `;
                };
                
                reader.readAsDataURL(file);
            }
        }
        
        // Simulate AI Analysis (demo only)
        document.querySelector('.upload-btn').addEventListener('click', function() {
            const fileInput = document.getElementById('file-input');
            if (fileInput.files.length) {
                setTimeout(() => {
                    document.querySelector('.result-content').innerHTML = `
                        <h3>Análise Completa</h3>
                        <p style="font-size: 0.85rem;">Resultados da análise:</p>
                        
                        <div style="text-align: left; margin: 15px 0;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.85rem;">
                                <span>Normalidade</span>
                                <span>85%</span>
                            </div>
                            <div class="confidence-meter">
                                <div class="confidence-level"></div>
                            </div>
                        </div>
                        
                        <p style="text-align: left; font-size: 0.85rem;">Resultado dentro dos parâmetros normais, sem alterações significativas.</p>
                        
                        <div class="result-actions">
                            <button class="action-btn primary-btn">
                                <i class="bi bi-download"></i> Relatório
                            </button>
                            <button class="action-btn secondary-btn">
                                <i class="bi bi-share"></i> Compartilhar
                            </button>
                        </div>
                    `;
                }, 2000);
            }
        });

        // Mobile menu toggle for sidebar
        function handleMobileView() {
            if (window.innerWidth < 1200) {
                sidebar.classList.add('collapsed');
            }
        }

        // Initialize and add resize listener
        window.addEventListener('load', handleMobileView);
        window.addEventListener('resize', handleMobileView);