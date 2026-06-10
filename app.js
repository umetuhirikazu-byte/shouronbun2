let video;
let correctedImage = null;

window.onload = async () => {

video =
document.getElementById("video");

try{

const stream =
  await navigator.mediaDevices
  .getUserMedia({

    video:{
      width:1920,
      height:1080
    },

    audio:false

  });

video.srcObject = stream;

}catch(err){

document
  .getElementById("status")
  .innerHTML =
  err.toString();


}

waitForOpenCV();
};

function waitForOpenCV(){

  console.log("checking cv");

  if(typeof cv === "undefined"){

    document
      .getElementById("status")
      .innerHTML =
      "OpenCV読込中...";

    setTimeout(
      waitForOpenCV,
      500
    );

    return;
  }

  document
    .getElementById("status")
    .innerHTML =
    "OpenCV準備完了";

  console.log("OpenCV OK");
}

function captureEssay(){

  const canvas =
    document.getElementById(
      "captureCanvas"
    );

  canvas.width =
    video.videoWidth;

  canvas.height =
    video.videoHeight;

  const ctx =
    canvas.getContext("2d");

  ctx.drawImage(
    video,
    0,
    0
  );

  const img =
    canvas.toDataURL(
      "image/jpeg",
      0.9
    );

  correctedImage = img;

  document
    .getElementById("preview")
    .src =
    img;

  document
    .getElementById("status")
    .innerHTML =
    "撮影成功";
}

function detectPaper(canvas){

try{

let src =
  cv.imread(canvas);

let gray =
  new cv.Mat();

let blur =
  new cv.Mat();

let edge =
  new cv.Mat();

cv.cvtColor(
  src,
  gray,
  cv.COLOR_RGBA2GRAY
);

cv.GaussianBlur(
  gray,
  blur,
  new cv.Size(5,5),
  0
);

cv.Canny(
  blur,
  edge,
  75,
  200
);

let contours =
  new cv.MatVector();

let hierarchy =
  new cv.Mat();

cv.findContours(
  edge,
  contours,
  hierarchy,
  cv.RETR_LIST,
  cv.CHAIN_APPROX_SIMPLE
);

let best = null;
let bestArea = 0;

for(let i=0;i<contours.size();i++){

  const cnt =
    contours.get(i);

  const peri =
    cv.arcLength(
      cnt,
      true
    );

  const approx =
    new cv.Mat();

  cv.approxPolyDP(
    cnt,
    approx,
    0.02 * peri,
    true
  );

  if(
    approx.rows === 4
  ){

    const area =
      cv.contourArea(
        approx
      );

    if(area > bestArea){

      bestArea = area;
      best = approx;
    }
  }
}

if(best == null){

  correctedImage =
    canvas.toDataURL(
      "image/jpeg",
      0.9
    );

  document
    .getElementById("preview")
    .src =
    correctedImage;

  return;
}

const rect =
  cv.boundingRect(best);

const roi =
  src.roi(rect);

const outCanvas =
  document
  .createElement(
    "canvas"
  );

cv.imshow(
  outCanvas,
  roi
);

correctedImage =
  outCanvas.toDataURL(
    "image/jpeg",
    0.95
  );

document
  .getElementById("preview")
  .src =
  correctedImage;

src.delete();
gray.delete();
blur.delete();
edge.delete();

}catch(err){

console.error(err);

document
  .getElementById("status")
  .innerHTML =
  err.toString();

}
}

async function sendToAI(){

if(!correctedImage){

alert(
  "先に撮影してください"
);

return;
}

document
.getElementById("status")
.innerHTML =
"AI添削中...";
  
const response =
await fetch(
"https://script.google.com/macros/s/AKfycbxrCgL9MQ7YKKP4Ez2tBuMVNMyQsgGKwbKlU6lbbNK8YLU7gK1vC0PNlSh78uYsyHCy/exec",
{
method:"POST",

    body:JSON.stringify({

      name:
      document
      .getElementById(
        "studentName"
      ).value,

      image:
      correctedImage
      .split(",")[1]

    })
  }
);

const result =
await response.json();

document
.getElementById("result")
.innerText =
result.feedback;

document
.getElementById("status")
.innerHTML =
"添削完了";
}
