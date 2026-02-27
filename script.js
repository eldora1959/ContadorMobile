const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const countDisplay = document.getElementById('count');
const statusText = document.getElementById('status');

const btnCapture = document.getElementById('btnCapture');
const btnBack = document.getElementById('btnBack');

let opencvReady = false;

// 🔥 Espera OpenCV carregar
cv['onRuntimeInitialized'] = () => {
    opencvReady = true;
    statusText.innerText = "OpenCV carregado!";
    iniciarCamera();
};

// 📷 Iniciar câmera
function iniciarCamera() {
    navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
    })
    .then(stream => {
        video.srcObject = stream;
        statusText.innerText = "Câmera pronta!";
    })
    .catch(err => {
        statusText.innerText = "Erro ao acessar câmera";
        console.error(err);
    });
}

// 📸 CONTAR PARAFUSOS
btnCapture.onclick = () => {

    if (!opencvReady) {
        alert("OpenCV ainda não carregou!");
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    let blur = new cv.Mat();
    let thresh = new cv.Mat();

    // 🔥 Converter para cinza
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 🔥 Aplicar blur para reduzir ruído
    cv.GaussianBlur(gray, blur, new cv.Size(5,5), 0);

    // 🔥 Threshold adaptativo
    cv.adaptiveThreshold(
        blur,
        thresh,
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY_INV,
        11,
        2
    );

    // 🔥 Encontrar contornos
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    cv.findContours(
        thresh,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
    );

    let count = 0;

    for (let i = 0; i < contours.size(); i++) {

        let cnt = contours.get(i);
        let area = cv.contourArea(cnt);

        // 🔥 Filtra por área mínima (ajustável)
        if (area > 500) {

            let rect = cv.boundingRect(cnt);

            cv.rectangle(
                src,
                new cv.Point(rect.x, rect.y),
                new cv.Point(rect.x + rect.width, rect.y + rect.height),
                [255, 0, 0, 255],
                2
            );

            count++;
        }

        cnt.delete();
    }

    countDisplay.innerText = count;

    video.style.display = "none";
    canvas.style.display = "block";

    cv.imshow(canvas, src);

    // Limpeza de memória
    src.delete();
    gray.delete();
    blur.delete();
    thresh.delete();
    contours.delete();
    hierarchy.delete();
};

// 🔄 VOLTAR
btnBack.onclick = () => {
    canvas.style.display = "none";
    video.style.display = "block";
    countDisplay.innerText = 0;
};