const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const countText = document.getElementById("count");

let minArea = 400;  // valor inicial
let circularityThreshold = 0.6;

// Ativar câmera traseira (melhor para celular)
navigator.mediaDevices.getUserMedia({
    video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 640 },
        height: { ideal: 480 }
    }
}).then(stream => {
    video.srcObject = stream;
});

// Captura imagem
function capture() {
    const ctx = canvas.getContext("2d");

    // Reduz resolução para melhor performance
    canvas.width = 640;
    canvas.height = 480;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    processImage();
}

// Processamento principal
function processImage() {

    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    let blur = new cv.Mat();
    let thresh = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // CLAHE (melhora contraste automático)
    let clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
    clahe.apply(gray, gray);

    cv.GaussianBlur(gray, blur, new cv.Size(5,5), 0);

    // Threshold automático OTSU
    cv.threshold(blur, thresh, 0, 255,
        cv.THRESH_BINARY_INV + cv.THRESH_OTSU);

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

        if (area < minArea) continue;

        let perimeter = cv.arcLength(cnt, true);
        let circularity = (4 * Math.PI * area) /
                          (perimeter * perimeter);

        // Filtro por formato (parafuso visto de cima é quase circular)
        if (circularity > circularityThreshold) {
            count++;
            cv.drawContours(
                src,
                contours,
                i,
                new cv.Scalar(0,255,0,255),
                2
            );
        }
    }

    countText.innerText = count;

    cv.imshow(canvas, src);

    src.delete();
    gray.delete();
    blur.delete();
    thresh.delete();
    contours.delete();
    hierarchy.delete();
}

// 🎯 CALIBRAÇÃO AUTOMÁTICA
function calibrate() {

    alert("Coloque apenas 1 parafuso na tela e pressione OK.");

    const ctx = canvas.getContext("2d");
    canvas.width = 640;
    canvas.height = 480;
    ctx.drawImage(video, 0, 0);

    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    let thresh = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, thresh, 0, 255,
        cv.THRESH_BINARY_INV + cv.THRESH_OTSU);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    cv.findContours(
        thresh,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
    );

    if (contours.size() > 0) {

        let cnt = contours.get(0);
        let area = cv.contourArea(cnt);

        // Ajusta área mínima para metade do tamanho detectado
        minArea = area * 0.5;

        alert("Calibração concluída!");
    } else {
        alert("Nenhum objeto detectado. Tente novamente.");
    }

    src.delete();
    gray.delete();
    thresh.delete();
    contours.delete();
    hierarchy.delete();
}
