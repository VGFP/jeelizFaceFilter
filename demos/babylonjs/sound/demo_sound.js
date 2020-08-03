"use strict";


// SETTINGS of this demo:
const SETTINGS = {
  rotationOffsetX: 0, // negative -> look upper. in radians
  cameraFOV: 40,      // in degrees, 3D camera FOV
  pivotOffsetYZ: [0.2,0.2], // XYZ of the distance between the center of the cube and the pivot
  detectionThreshold: 0.5,  // sensibility, between 0 and 1. Less -> more sensitive
  detectionHysteresis: 0.1,
  scale: 1 // scale of the 3D cube
};

// some globalz:
let BABYLONVIDEOTEXTURE = null, BABYLONENGINE = null, BABYLONFACEOBJ3D = null, BABYLONFACEOBJ3DPIVOTED = null, BABYLONSCENE = null, BABYLONCAMERA = null, ASPECTRATIO = -1, JAWMESH = null;
let ISDETECTED = false;

// analoguous to GLSL smoothStep function:
function smoothStep(edge0, edge1, x){
    const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0.0), 1.0);
    return t * t * (3.0 - 2.0 * t);
  }

// callback launched if a face is detected or lost:
function detect_callback(isDetected){
    if (isDetected){
      console.log('INFO in detect_callback(): DETECTED');
    } else {
      console.log('INFO in detect_callback(): LOST');
    }
  }

  // build the 3D. called once when Jeeliz Face Filter is OK:
function init_babylonScene(spec){
  // INIT THE BABYLON.JS context:
  BABYLONENGINE = new BABYLON.Engine(spec.GL);

  // CREATE THE SCENE:
  BABYLONSCENE = new BABYLON.Scene(BABYLONENGINE);

  //Estimate screen width for sound source placement
  //NOTE: this is estimation it is not very accurate but for this project it is acurate enought
  var $el = document.createElement('div');
  $el.style.width = '1cm';
  $el.style.height = '1cm';
  $el.style.backgroundColor = '#ff0000';
  $el.style.position = 'fixed';
  $el.style.bottom = 0;
  document.body.appendChild($el);
  var screenHeight=window.screen.height / $el.offsetHeight;
  var screenWidth=window.screen.width / $el.offsetWidth;
  console.log("Screen Width in cm: "+ screenWidth);
  console.log("Screen Height in cm: "+ screenHeight);
  var screenDiagonalInches = Math.sqrt(Math.pow((window.screen.width / $el.offsetWidth), 2) + Math.pow((window.screen.height / $el.offsetHeight), 2))/ 2.54;
  console.log("Screen Diagonal in in: "+ screenDiagonalInches);
  
  //ADD VIRTUAL SPEAKERS

  //Screen center height in meters
  var screenCenterY=(screenHeight/2)/100;

  //Calculate distance form screen based on estimated screen diagonal length and resolution
  //Screen resolution
  var screenResWidth = window.screen.width * window.devicePixelRatio;
  var screenResHeight = window.screen.height * window.devicePixelRatio;

  //distanceFromScreen will be used for initial positioning of the  Surround Left and Right speakers
  //
  var distanceFromScreen;
  if(screenResWidth<2240 && screenResHeight<1260){
    //FHD 1920x1080 px
    distanceFromScreen=0.336*screenDiagonalInches;
  }
  if (screenResWidth>=2240 && screenResHeight>=1260 && screenResWidth<3200 && screenResHeight<1800 ) {
    //QHD 2560x1440 px
    distanceFromScreen=0.252*screenDiagonalInches;
  }
  if (screenResWidth>=3200 && screenResHeight>=1800) {
    //4k 3840x2160 px 
    distanceFromScreen=0.168*screenDiagonalInches;
  } 
  else {
    //other screen (calculated as 1080p for this demo)
    distanceFromScreen=0.336*screenDiagonalInches;
  }

  // Front-Middle speaker.
  var boxFM = BABYLON.MeshBuilder.CreateBox("boxFM", {size: 0.01}, scene);
  boxFM.position=new BABYLON.Vector3(0,screenCenterY,0); 
  // Front-left speaker.
  var boxFL = BABYLON.MeshBuilder.CreateBox("boxFL", {size: 0.01}, scene);
  boxFL.position=new BABYLON.Vector3((-screenWidth/2)/100,screenCenterY,0);
  // Front-Right speaker.
  var boxFR = BABYLON.MeshBuilder.CreateBox("boxFR", {size: 0.01}, scene);
  boxFR.position=new BABYLON.Vector3((screenWidth/2)/100,screenCenterY,0);
  // Sub speaker.
  var boxSub = BABYLON.MeshBuilder.CreateBox("boxSub", {size: 0.01}, scene);
  boxSub.position=new BABYLON.Vector3(((-screenWidth/2)/100)-0.5,screenCenterY-0.2,-0.5);
  // Surround-Left speaker.
  var boxSL = BABYLON.MeshBuilder.CreateBox("boxSL", {size: 0.01}, scene);
  boxSL.position=new BABYLON.Vector3((-screenWidth/2)/100,screenCenterY,-Math.sin(20)*distanceFromScreen*distanceFromScreen);
  // Surround-Right speaker.
  var boxSR = BABYLON.MeshBuilder.CreateBox("boxSR", {size: 0.01}, scene);
  boxSR.position=new BABYLON.Vector3((screenWidth/2)/100,screenCenterY,-Math.sin(20)*distanceFromScreen*distanceFromScreen);



  // ADD A LIGHT:
  const pointLight = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 1, 0), BABYLONSCENE);
  pointLight.intensity = 0.5;
  
}

function main(){
  JEEFACEFILTERAPI.init({
    canvasId: 'jeeFaceFilterCanvas',
    NNCpath: '../../../dist/', // root of NNC.json file
    callbackReady: function(errCode, spec){
      if (errCode){
        console.log('AN ERROR HAPPENS. SORRY BRO :( . ERR =', errCode);
        return;
      }

      console.log('INFO : JEEFACEFILTERAPI IS READY');
      init_babylonScene(spec);
    }, //end callbackReady()
});
}