window.addEventListener("load", () => {

  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const countText = document.getElementById("count");

  const btnCapture = document.getElementById("btnCapture");
  const btnCalibrate = document.getElementById("btnCalibrate");
  const btnBack = document.getElementById("btnBack");

  let minArea = 800;
  let circularityThreshold = 0.6;
  let opencvReady = false;

  // ===============================
  // ESPERAR OPENCV
  // ===============================
  cv.onRuntimeInitialized = () => {
      console.log("OpenCV pronto");
      opencvReady = true;
  };

  // ===============================
  // ATIVAR CÂMERA
  // ===============================
  navigator.mediaDevices.getUserMedia({
      video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 }
      }
  })
  .then(stream => {
      video.srcObject = stream;
  })
  .catch(err => {
      alert("Erro ao acessar câmera: " + err);
  });

  // ===============================
  // CAPTURAR
  // ===============================
  btnCapture.addEventListener("click", () => {

      if (!opencvReady) {
          alert("OpenCV ainda carregando...");
          return;
      }

      const ctx = canvas.getContext("2d");

      canvas.width = 640;
      canvas.height = 480;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.style.display = "block";
      video.style.display = "none";

      processImage();
  });

  // ===============================
  // NOVA CAPTURA
  // ===============================
  btnBack.addEventListener("click", () => {

      canvas.style.display = "none";
      video.style.display = "block";
      countText.innerText = "0";
  });

  // ===============================
  // CALIBRAR
  // ===============================
  btnCalibrate.addEventListener("click", () => {

      if (!opencvReady) {
          alert("OpenCV ainda carregando...");
          return;
      }

      calibrate();
  });

  // ===============================
  // PROCESSAMENTO
  // ===============================
  function processImage() {

    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    let blur = new cv.Mat();
    let thresh = new cv.Mat();
    let morph = new cv.Mat();

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);

    // Fundo escuro
    cv.threshold(
        blur,
        thresh,
        0,
        255,
        cv.THRESH_BINARY + cv.THRESH_OTSU
    );

    let kernel = cv.getStructuringElement(
        cv.MORPH_RECT,
        new cv.Size(5, 5)
    );

    cv.morphologyEx(thresh, morph, cv.MORPH_CLOSE, kernel);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    cv.findContours(
        morph,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
    );

    let count = 0;

    for (let i = 0; i < contours.size(); i++) {

        let cnt = contours.get(i);
        let area = cv.contourArea(cnt);

        if (area < 500) continue;

        let rect = cv.boundingRect(cnt);

        let aspectRatio = rect.width / rect.height;

        // 🔥 Detecta objetos alongados (parafusos)
        if (aspectRatio > 2.0 || aspectRatio < 0.5) {

            count++;

            cv.rectangle(
                src,
                new cv.Point(rect.x, rect.y),
                new cv.Point(rect.x + rect.width, rect.y + rect.height),
                new cv.Scalar(0, 255, 0, 255),
                3
            );
        }
    }

    countText.innerText = count;

    cv.imshow(canvas, src);

    src.delete();
    gray.delete();
    blur.delete();
    thresh.delete();
    morph.delete();
    contours.delete();
    hierarchy.delete();
    kernel.delete();
}



});
