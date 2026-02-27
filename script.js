const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const templateCanvas = document.getElementById('templateCanvas');
const countDisplay = document.getElementById('count');
const statusText = document.getElementById('status');

const btnCalibrate = document.getElementById('btnCalibrate');
const btnCapture = document.getElementById('btnCapture');
const btnBack = document.getElementById('btnBack');

let templateMat = null;
let opencvReady = false;

// 🔥 ESPERA OPENCV CARREGAR
cv['onRuntimeInitialized'] = () => {
    opencvReady = true;
    statusText.innerText = "OpenCV carregado!";
    iniciarCamera();
};

// 📷 INICIAR CÂMERA
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

// 🎯 CALIBRAR (pega somente o centro da imagem)
btnCalibrate.onclick = () => {

    if (!opencvReady) {
        alert("OpenCV ainda não carregou!");
        return;
    }

    templateCanvas.width = video.videoWidth;
    templateCanvas.height = video.videoHeight;

    const ctx = templateCanvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    let src = cv.imread(templateCanvas);
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 🔥 recorta centro (25% da imagem)
    let size = Math.floor(Math.min(gray.cols, gray.rows) * 0.25);
    let x = Math.floor((gray.cols - size) / 2);
    let y = Math.floor((gray.rows - size) / 2);

    let roi = new cv.Rect(x, y, size, size);
    templateMat = gray.roi(roi).clone();

    src.delete();
    gray.delete();

    alert("Modelo calibrado! Coloque vários itens e clique em Contar.");
};

// 📸 CONTAR
btnCapture.onclick = () => {

    if (!opencvReady) {
        alert("OpenCV ainda não carregou!");
        return;
    }

    if (!templateMat) {
        alert("Primeiro clique em Calibrar!");
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    let result = new cv.Mat();
    cv.matchTemplate(gray, templateMat, result, cv.TM_CCOEFF_NORMED);

    let threshold = 0.75;
    let count = 0;

    for (let y = 0; y < result.rows; y += 4) {
        for (let x = 0; x < result.cols; x += 4) {

            let value = result.floatAt(y, x);

            if (value >= threshold) {

                count++;

                cv.rectangle(
                    src,
                    new cv.Point(x, y),
                    new cv.Point(x + templateMat.cols, y + templateMat.rows),
                    [255, 0, 0, 255],
                    2
                );
            }
        }
    }

    countDisplay.innerText = count;

    video.style.display = "none";
    canvas.style.display = "block";

    cv.imshow(canvas, src);

    src.delete();
    gray.delete();
    result.delete();
};

// 🔄 VOLTAR
btnBack.onclick = () => {
    canvas.style.display = "none";
    video.style.display = "block";
    countDisplay.innerText = 0;
};