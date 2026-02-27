const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const templateCanvas = document.getElementById('templateCanvas');
const countDisplay = document.getElementById('count');

const btnCapture = document.getElementById('btnCapture');
const btnCalibrate = document.getElementById('btnCalibrate');
const btnBack = document.getElementById('btnBack');

let templateMat = null;

// INICIAR CÂMERA
navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
})
.then(stream => {
    video.srcObject = stream;
})
.catch(err => {
    alert("Erro ao acessar câmera");
});


// 🎯 CAPTURAR MODELO
btnCalibrate.onclick = () => {
    const ctx = templateCanvas.getContext('2d');
    templateCanvas.width = video.videoWidth;
    templateCanvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    let src = cv.imread(templateCanvas);
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);

    templateMat = src.clone();
    alert("Modelo calibrado com sucesso!");
};


// 📸 CAPTURAR E CONTAR
btnCapture.onclick = () => {

    if (!templateMat) {
        alert("Calibre primeiro!");
        return;
    }

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    let result = new cv.Mat();
    let mask = new cv.Mat();

    cv.matchTemplate(gray, templateMat, result, cv.TM_CCOEFF_NORMED, mask);

    let threshold = 0.8;
    let locations = [];

    for (let y = 0; y < result.rows; y++) {
        for (let x = 0; x < result.cols; x++) {
            let value = result.floatAt(y, x);
            if (value >= threshold) {
                locations.push({ x, y });
            }
        }
    }

    let count = 0;
    locations.forEach(pt => {
        count++;
        cv.rectangle(
            src,
            new cv.Point(pt.x, pt.y),
            new cv.Point(pt.x + templateMat.cols, pt.y + templateMat.rows),
            [255, 0, 0, 255],
            2
        );
    });

    countDisplay.innerText = count;

    cv.imshow(canvas, src);

    src.delete();
    gray.delete();
    result.delete();
    mask.delete();
};


// 🔄 NOVA CAPTURA
btnBack.onclick = () => {
    canvas.style.display = "none";
    countDisplay.innerText = 0;
};