// Espera a página carregar completamente
window.addEventListener("load", () => {

  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const countText = document.getElementById("count");
  const btnCapture = document.getElementById("btnCapture");
  const btnCalibrate = document.getElementById("btnCalibrate");

  let minArea = 400;
  let circularityThreshold = 0.6;

  // 🔹 Garantir que os botões existam
  if (!btnCapture || !btnCalibrate) {
      console.error("Botões não encontrados no HTML.");
      return;
  }

  // 🔹 Ativar câmera traseira
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

  // 🔹 Evento botão Capturar
  btnCapture.addEventListener("click", () => {
      capture();
  });

  // 🔹 Evento botão Calibrar
  btnCalibrate.addEventListener("click", () => {
      calibrate();
  });

  // =========================
  // 📸 CAPTURA
  // =========================
  function capture() {

      if (typeof cv === "undefined") {
          alert("OpenCV ainda não carregou.");
          return;
      }

      const ctx = canvas.getContext("2d");

      canvas.width = 640;
      canvas.height = 480;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      processImage();
  }

  // =========================
  // 🔍 PROCESSAMENTO
  // =========================
  function processImage() {

      let src = cv.imread(canvas);
      let gray = new cv.Mat();
      let blur = new cv.Mat();
      let thresh = new cv.Mat();

      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // CLAHE (melhora contraste)
      let clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
      clahe.apply(gray, gray);

      cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);

      cv.threshold(
          blur,
          thresh,
          0,
          255,
          cv.THRESH_BINARY_INV + cv.THRESH_OTSU
      );

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
          let circularity = (4 * Math.PI * area) / (perimeter * perimeter);

          if (circularity > circularityThreshold) {
              count++;
              cv.drawContours(
                  src,
                  contours,
                  i,
                  new cv.Scalar(0, 255, 0, 255),
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

  // =========================
  // 🎯 CALIBRAÇÃO
  // =========================
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

      cv.threshold(
          gray,
          thresh,
          0,
          255,
          cv.THRESH_BINARY_INV + cv.THRESH_OTSU
      );

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

          minArea = area * 0.5;

          alert("Calibração concluída!");
      } else {
          alert("Nenhum objeto detectado.");
      }

      src.delete();
      gray.delete();
      thresh.delete();
      contours.delete();
      hierarchy.delete();
  }

});
