document.addEventListener('DOMContentLoaded', function() {
  const videos = document.querySelectorAll('.hero-video video');
  if (videos.length > 1) {
    let currentVideo = 0;

    function changeVideo() {
      videos[currentVideo].classList.remove('active');
      currentVideo = (currentVideo + 1) % videos.length;
      videos[currentVideo].classList.add('active');
    }

    // Troca o vídeo a cada 5 segundos
    setInterval(changeVideo, 5000);
  }
});
