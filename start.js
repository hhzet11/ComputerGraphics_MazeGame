/*
   texture is just image plastered onto a face
   normal maps affect how light bounces off different part of a face
*/
var scene, camera, renderer, mesh, cone;
var meshFloor, ambientLight, light;

var crate, crateTexture, crateNormalMap, crateBumpMap;

var keyboard = {};
var player = { height:1.3, speed:0.1, turnSpeed:Math.PI*0.02 };
var USE_WIREFRAME = false;

var loadingScreen = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(90, 1280/720, 0.1, 100),
    box: new THREE.Mesh(
        new THREE.BoxGeometry(0.5,0.5,0.5),
        new THREE.MeshBasicMaterial({ color:0x4444ff })
    )
};
var loadingManager = null;
var RESOURCES_LOADED = false;

var counter = 0;
var timeleft = 300;

// Models index
var models = {
    lightpostHanging: {
        obj:"models/lightpostHanging.obj",
        mtl:"models/lightpostHanging.mtl",
        mesh: null
    },
};

// Meshes index
var meshes = {};

function loading(){

    loadingScreen.box.position.set(0,0,5);
    loadingScreen.camera.lookAt(loadingScreen.box.position);
    loadingScreen.scene.add(loadingScreen.box);

    loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = function(item, loaded, total){
        console.log(item, loaded, total);
    };

    loadingManager.onLoad = function(){
        console.log("loaded all resources");
        //3초 딜레이 후 시작
        setTimeout(function(){
            RESOURCES_LOADED = true;
            timer();
        }, 3000);
        onResourcesLoaded();
    };
}

function init(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(90, 1280/720, 0.1, 1000);

    loading();

    //돌아가고있는물체
    mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2,2,2),//3차원이라3개parameter-값:size
        //color-물체색깔, wireframe-화면에보이게할건지설정->position의 +-에영향받음->순서?
        new THREE.MeshPhongMaterial({color:0x4444ff, wireframe:USE_WIREFRAME})
    );
    mesh.position.set(0,2,3);
    mesh.receiveShadow = true; //object에그림자설정
    mesh.castShadow = true; //바닥에비칠그림자설정
    scene.add(mesh);

    //하얀바닥
    meshFloor = new THREE.Mesh(
        //10,10,2,2보다 segment 많을수록 더 많은 polygon 나옴
        new THREE.PlaneGeometry(20,20, 10,10), //plane이니까2차원-앞parameter2개가size결정
        new THREE.MeshPhongMaterial({color:0xffffff, wireframe:USE_WIREFRAME})
    );
    meshFloor.rotation.x -= Math.PI / 2; // Rotate the floor 90 degrees
    meshFloor.receiveShadow = true;   //바닥에비칠그림자설정
    scene.add(meshFloor);

    //texture추가할거면->crate의MeshPhongMaterial에서 map:crateTexture추가필요!
    var textureLoader = new THREE.TextureLoader();
    //원하는사진""안에서넣어서불러오기
    crateTexture = new textureLoader.load("crate0/crate0_diffuse.png");
    crateBumpMap = new textureLoader.load("crate0/crate0_bump.png");
    crateNormalMap = new textureLoader.load("crate0/crate0_normal.png");


    //load objects with mtl, obj loaders
    for( var _key in models ){
        (function(key){

            var mtlLoader = new THREE.MTLLoader(loadingManager);
            mtlLoader.load(models[key].mtl, function(materials){
                materials.preload();

                var objLoader = new THREE.OBJLoader(loadingManager);

                objLoader.setMaterials(materials);
                objLoader.load(models[key].obj, function(mesh){

                    mesh.traverse(function(node){
                        if( node instanceof THREE.Mesh ){
                            node.castShadow = true;
                            node.receiveShadow = true;
                        }
                    });
                    models[key].mesh = mesh;

                });
            });

        })(_key);
    }

    camera.position.set(0, player.height, -5);
    camera.lookAt(new THREE.Vector3(0,player.height,0));

    //전체적인 조명(자연광)-색깔,밝기
    ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    //포인트조명-색깔,밝기,위치,near,far설정가능
    light = new THREE.PointLight(0xffffff, 0.4, 50);
    light.position.set(0,10,3);
    light.castShadow = true;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 11;
    scene.add(light);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(1280, 720);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;

    document.body.appendChild(renderer.domElement);

    //onResourcesLoaded();
    animate();


}

function moveCam(eye_x, eye_y, eye_z)
{
    camera.position.set ( eye_x, eye_y, eye_z );
    camera.rotation.x = -3.0;
    camera.rotation.y = 0.0;
    //controls.target.set( target_x, target_y, target_z );
}


// Runs when all resources are loaded
function onResourcesLoaded(){

    // Clone models into meshes.
    meshes["lightpostHanging1"] = models.lightpostHanging.mesh.clone();
    meshes["lightpostHanging2"] = models.lightpostHanging.mesh.clone();

    meshes["lightpostHanging1"].position.set(0, 3, 8);
    meshes["lightpostHanging2"].position.set(0, 3, 8);

    meshes["lightpostHanging1"].scale.set(2,2,2);
    meshes["lightpostHanging2"].scale.set(2,2,2);
    //rotate mesh - Math.PI = 180degree, Math.PI/2 = 90 degree
    meshes["lightpostHanging1"].rotateY(Math.PI);
    meshes["lightpostHanging2"].rotateY(Math.PI);

    /*
    scene.add(meshes["lightpostHanging1"]);
    scene.add(meshes["lightpostHanging2"]);
    */
}


function animate(){

    // Play the loading screen until resources are loaded.
    if( RESOURCES_LOADED == false ){
        requestAnimationFrame(animate);

        loadingScreen.box.position.x -= 0.1;
        if( loadingScreen.box.position.x < -10 ) loadingScreen.box.position.x = 10;
        loadingScreen.box.position.y = Math.sin(loadingScreen.box.position.x);

        renderer.render(loadingScreen.scene, loadingScreen.camera);
        return;
    }

    requestAnimationFrame(animate);

    //돌아가도록하는코드-x축,y축방향으로
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;

    // Keyboard movement inputs
    if(keyboard[87]){ // W key
        camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
        camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
    }
    if(keyboard[83]){ // S key
        camera.position.x += Math.sin(camera.rotation.y) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
    }
    if(keyboard[65]){ // A key
        // Redirect motion by 90 degrees
        camera.position.x += Math.sin(camera.rotation.y + Math.PI/2) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y + Math.PI/2) * player.speed;
    }
    if(keyboard[68]){ // D key
        camera.position.x += Math.sin(camera.rotation.y - Math.PI/2) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y - Math.PI/2) * player.speed;
    }

    // Keyboard turn inputs
    if(keyboard[37]){ // left arrow key
        camera.rotation.y -= player.turnSpeed;
    }
    if(keyboard[39]){ // right arrow key
        camera.rotation.y += player.turnSpeed;
    }


    renderer.render(scene, camera);

    document.getElementById('monitor').innerText =
        camera.position.x.toFixed(1) + ", " +
        camera.position.y.toFixed(1) + ", " +
        camera.position.z.toFixed(1) + "\n " +
        camera.rotation.x.toFixed(1) + ", " +
        camera.rotation.y.toFixed(1);


    if(camera.position.x > -2 && camera.position.x < 2){
        if(camera.position.z > -2.5 && camera.position.z < 2.5){
            location.replace("teamProject.html");
        }
    }

}
function convertSeconds(s){
    var min = Math.floor(s / 60);
    var sec = s % 60;
    if(sec<10){sec = "0" + sec;}
    return min + ':' + sec;
}

function timeIt(){
    counter++;
    document.getElementById('timer').innerText = convertSeconds( timeleft - counter );
}

function timer(){
    document.getElementById('timer').innerText = convertSeconds( timeleft - counter );
    setInterval(timeIt, 1000);
}

function keyDown(event){
    keyboard[event.keyCode] = true;
}

function keyUp(event){
    keyboard[event.keyCode] = false;
}


window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

window.onload = init;