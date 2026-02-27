const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const countDisplay = document.getElementById('count');
const statusText = document.getElementById('status');

const btnCapture = document.getElementById('btnCapture');
const btnBack = document.getElementById('btnBack');

let opencvReady = false;

cv['onRuntimeInitialized'] = () => {
    opencvReady = true;
    statusText.innerText = "OpenCV carregado!";
    iniciarCamera();
};

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
    let edges = new cv.Mat();
    let kernel = cv.Mat.ones(3, 3, cv.CV_8U);

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blur, new cv.Size(5,5), 0);

    // 🔥 DETECÇÃO DE BORDAS
    cv.Canny(blur, edges, 50, 150);

    // 🔥 DILATA PARA UNIR PARTES
    cv.dilate(edges, edges, kernel);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    cv.findContours(
        edges,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
    );

    let count = 0;

    for (let i = 0; i < contours.size(); i++) {

        let cnt = contours.get(i);
        let area = cv.contourArea(cnt);

        if (area > 800 && area < 20000) {

            let rect = cv.boundingRect(cnt);

            let aspectRatio = rect.height / rect.width;

            // 🔥 FILTRA OBJETOS ALONGADOS (formato parafuso)
            if (aspectRatio > 2 || aspectRatio < 0.5) {

                cv.rectangle(
                    src,
                    new cv.Point(rect.x, rect.y),
                    new cv.Point(rect.x + rect.width, rect.y + rect.height),
                    [0, 255, 0, 255],
                    2
                );

                count++;
            }
        }

        cnt.delete();
    }

    countDisplay.innerText = count;

    video.style.display = "none";
    canvas.style.display = "block";

    cv.imshow(canvas, src);

    src.delete();
    gray.delete();
    blur.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
    kernel.delete();
};

btnBack.onclick = () => {
    canvas.style.display = "none";
    video.style.display = "block";
    countDisplay.innerText = 0;
};