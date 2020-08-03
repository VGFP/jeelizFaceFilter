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
let engine = null, scene = null, camera = null, ASPECTRATIO = -1;
let ISDETECTED = false;
let boxFM= null, boxFL= null, boxFR= null, boxSub=null, boxSL = null, boxSR = null;
var firstDetection=false;
var distanceFromScreen;
var canvas = document.getElementById("jeeFaceFilterCanvas");
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
  engine = new BABYLON.Engine(spec.GL);

  // CREATE THE SCENE:
  scene = new BABYLON.Scene(engine);

  scene.audioEnabled = true;
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

  //ADD Camera
  // CREATE THE CAMERA:
  camera = new BABYLON.Camera('camera', new BABYLON.Vector3(0,screenCenterY,distanceFromScreen), scene);
  scene.setActiveCameraByName('camera');
  // This targets the camera to Front-Middle speaker
  //camera.setTarget(new BABYLON.Vector3(0,0,0));
  camera.fov = SETTINGS.cameraFOV * Math.PI/180;
  camera.minZ = 0.1;
  camera.maxZ = 100;
  ASPECTRATIO = engine.getAspectRatio(camera);

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
  const pointLight = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 1, 0), scene);
  pointLight.intensity = 0.5;

  //ADD Sounds
  
  var musicFL = new BABYLON.Sound(
    //Front left
    "Front-left",
    "https://raw.githubusercontent.com/VGFP/jeelizFaceFilter/master/demos/babylonjs/sound/demo_OGG_Files/FrontLeft.ogg",
    scene,
    soundReady,
    { 
    loop: true,
    spatialSound: true,
    distanceModel: "exponential",
    rolloffFactor: 2 
    }
    );
var musicFR = new BABYLON.Sound(
    "Front-right",
    //Front right
    "https://raw.githubusercontent.com/VGFP/jeelizFaceFilter/master/demos/babylonjs/sound/demo_OGG_Files/FrontRight.ogg",
    scene,
    soundReady,
    { 
    loop: true,
    spatialSound: true,
    distanceModel: "exponential",
    rolloffFactor: 2 
    }
    );
var musicFM = new BABYLON.Sound(
    //Front center
    "Front-center",
    "https://raw.githubusercontent.com/VGFP/jeelizFaceFilter/master/demos/babylonjs/sound/demo_OGG_Files/FrontCenter.ogg",
    scene,
    soundReady,
    { 
    loop: true,
    spatialSound: true,
    distanceModel: "exponential",
    rolloffFactor: 2 
    }
    );
var musicSub = new BABYLON.Sound(
    //Sub
    "Sub",
    "https://raw.githubusercontent.com/VGFP/jeelizFaceFilter/master/demos/babylonjs/sound/demo_OGG_Files/Sub.ogg",
    scene,
    soundReady,
    { 
    loop: true,
    spatialSound: true,
    distanceModel: "exponential",
    rolloffFactor: 2 
    }
    );
var musicSL = new BABYLON.Sound(
    //Surround left
    "Surround-left",
    "https://raw.githubusercontent.com/VGFP/jeelizFaceFilter/master/demos/babylonjs/sound/demo_OGG_Files/LeftSurr.ogg",
    scene,
    soundReady,
    { 
    loop: true,
    spatialSound: true,
    distanceModel: "exponential",
    rolloffFactor: 2 
    }
    );
var musicSR = new BABYLON.Sound(
    //Surround Right
    "Surround-Right",
    "https://raw.githubusercontent.com/VGFP/jeelizFaceFilter/master/demos/babylonjs/sound/demo_OGG_Files/RightSurr.ogg",
    scene,
    soundReady,
    { 
    loop: true,
    spatialSound: true,
    distanceModel: "exponential",
    rolloffFactor: 2 
    }
    );

var soundsReady = 0;
var musicControll = false;
function soundReady() {
    soundsReady++;
    if (soundsReady === 6) {
        musicFL.attachToMesh(boxFL);
        musicFR.attachToMesh(boxFR);
        musicFM.attachToMesh(boxFM);
        musicSub.attachToMesh(boxSub);
        musicSR.attachToMesh(boxSR);
        musicSL.attachToMesh(boxSL);

        musicFL.play();
        musicFR.play();
        musicFM.play();
        musicSub.play();
        musicSR.play();
        musicSL.play();
        musicControll=true;
    }
}
scene.onKeyboardObservable.add((kbInfo) => {
    switch (kbInfo.type) {
        case BABYLON.KeyboardEventTypes.KEYDOWN:
            switch (kbInfo.event.key) {
                case "a":
                case "A":
                    if(musicControll)
                    {
                    musicFL.pause();
                    musicFR.pause();
                    musicFM.pause();
                    musicSub.pause();
                    musicSR.pause();
                    musicSL.pause();
                    musicControll=false;
                    }
                    else
                    {
                    musicFL.play();
                    musicFR.play();
                    musicFM.play();
                    musicSub.play();
                    musicSR.play();
                    musicSL.play();
                    musicControll=true;
                    }
                break
            }
        break;
    }
});

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

    // called at each render iteration (drawing loop):
    callbackTrack: function(detectState){
      if (ISDETECTED && detectState.detected<SETTINGS.detectionThreshold-SETTINGS.detectionHysteresis){
        // DETECTION LOST
        detect_callback(false);
        ISDETECTED = false;
      } else if (!ISDETECTED && detectState.detected>SETTINGS.detectionThreshold+SETTINGS.detectionHysteresis){
        // FACE DETECTED
        detect_callback(true);
        ISDETECTED = true;
      }

      if (ISDETECTED){
        if(!firstDetection)
        {
          //detect distance from a users head to better place sourrand sound sources
          
        }
        // move the cube in order to fit the head:
        const tanFOV = Math.tan(ASPECTRATIO*camera.fov/2); // tan(FOV/2), in radians
        const W = detectState.s;  // relative width of the detection window (1-> whole width of the detection window)
        const D = 1 / (2*W*tanFOV); // distance between the front face of the cube and the camera
        
        // coords in 2D of the center of the detection window in the viewport:
        const xv = detectState.x;
        const yv = detectState.y;
        
        // coords in 3D of the center of the cube (in the view coordinates system):
        var z=-D-0.5;   // minus because view coordinate system Z goes backward. -0.5 because z is the coord of the center of the cube (not the front face)
        var x=xv*D*tanFOV;
        var y=yv*D*tanFOV/ASPECTRATIO;

        // move and rotate the cube:
        //BABYLONFACEOBJ3D.position.set(x,y+SETTINGS.pivotOffsetYZ[0],-z-SETTINGS.pivotOffsetYZ[1]);
        //BABYLONFACEOBJ3D.rotation.set(-detectState.rx+SETTINGS.rotationOffsetX, -detectState.ry, detectState.rz);//"XYZ" rotation order;
       
      }

      // reinitialize the state of BABYLON.JS because JEEFACEFILTER have changed stuffs:
      engine.wipeCaches(true);
      
      // trigger the render of the BABYLON.JS SCENE:
      scene.render();
      
      engine.wipeCaches();
    } //end callbackTrack()
  });
}