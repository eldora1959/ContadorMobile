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
    let hsv = new cv.Mat();
    let mask = new cv.Mat();
    let morph = new cv.Mat();

    // 🔥 Trabalhar em HSV (melhor para brilho)
    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

    // 🔥 Detectar regiões claras (valor alto)
    let lower = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 0, 120, 0]);
    let upper = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [180, 80, 255, 255]);

    cv.inRange(hsv, lower, upper, mask);

    let kernel = cv.getStructuringElement(
        cv.MORPH_RECT,
        new cv.Size(7, 7)
    );

    cv.morphologyEx(mask, morph, cv.MORPH_CLOSE, kernel);

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

        if (area < 800) continue;

        count++;

        let rect = cv.boundingRect(cnt);

        cv.rectangle(
            src,
            new cv.Point(rect.x, rect.y),
            new cv.Point(rect.x + rect.width, rect.y + rect.height),
            new cv.Scalar(0, 255, 0, 255),
            3
        );
    }

    countText.innerText = count;

    cv.imshow(canvas, src);

    src.delete();
    hsv.delete();
    mask.delete();
    morph.delete();
    contours.delete();
    hierarchy.delete();
    kernel.delete();
    lower.delete();
    upper.delete();
}



});
