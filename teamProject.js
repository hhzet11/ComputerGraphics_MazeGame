/*
   texture is just image plastered onto a face
   normal maps affect how light bounces off different part of a face
*/
var scene, camera, renderer, mesh, mesh2, cone;
var meshFloor, ambientLight, light;
var boarder1, boarder2;

var deathCount = 3;

var crate, crateTexture, crateNormalMap, crateBumpMap;
var characterSize = 50;

var collisions = [];
var boxPosition;

var keyboard = {};
var player = { height:1.8, speed:0.1, turnSpeed:Math.PI*0.02 };
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
var timeleft = 600;

// Models index
var models = {
	benchDamaged: {
		obj:"models/benchDamaged.obj",
		mtl:"models/benchDamaged.mtl",
		mesh: null
	},
	skeleton: {
		obj:"models/skeleton.obj",
		mtl:"models/skeleton.mtl",
		mesh: null
	},
	lightpostHanging: {
		obj:"models/lightpostHanging.obj",
		mtl:"models/lightpostHanging.mtl",
		mesh: null
	},
	tree: {
		obj:"models/tree.obj",
		mtl:"models/tree.mtl",
		mesh: null
	},
	fountain: {
		obj:"models/fountain.obj",
		mtl:"models/fountain.mtl",
		mesh: null
	},
	grave: {
		obj:"models/gravestoneCrossLarge.obj",
		mtl:"models/gravestoneCrossLarge.mtl",
		mesh: null
	},
	gravestoneFlatOpen: {
		obj:"models/gravestoneFlatOpen.obj",
		mtl:"models/gravestoneFlatOpen.mtl",
		mesh: null
	},
	zombie: {
		obj:"models/zombie.obj",
		mtl:"models/zombie.mtl",
		mesh: null
	},
	coffin: {
		obj:"models/coffinOld.obj",
		mtl:"models/coffinOld.mtl",
		mesh: null
	},
	vampire: {
		obj:"models/vampire.obj",
		mtl:"models/vampire.mtl",
		mesh: null
	},
	ghost: {
		obj:"models/ghost.obj",
		mtl:"models/ghost.mtl",
		mesh: null
	},
	trunk: {
		obj:"models/trunk.obj",
		mtl:"models/trunk.mtl",
		mesh: null
	}
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

	createCharacter();

	camera = new THREE.PerspectiveCamera(90, 1280/720, 0.1, 1000);

	camera.position.z = -0.1;
	camera.rotation.x = -3.1;
	camera.rotation.y = 0.0;
	camera.lookAt(new THREE.Vector3(0,0,0));

	box.add(camera);

	loading();

	/*
       //돌아가고있는물체
       mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1,1,1),//3차원이라3개parameter-값:size
          //color-물체색깔, wireframe-화면에보이게할건지설정->position의 +-에영향받음->순서?
          new THREE.MeshPhongMaterial({color:0xff4444, wireframe:USE_WIREFRAME})
       );
       mesh.position.set(30, 0, -46);
       mesh.position.y += 1; // Move the mesh up 1 meter
       mesh.receiveShadow = true; //object에그림자설정
       mesh.castShadow = true; //바닥에비칠그림자설정
       scene.add(mesh);
       */
	   
	//돌아가고있는물체
	mesh2 = new THREE.Mesh(
		new THREE.BoxGeometry(1,1,1),//3차원이라3개parameter-값:size
		//color-물체색깔, wireframe-화면에보이게할건지설정->position의 +-에영향받음->순서?
		new THREE.MeshPhongMaterial({color:0x4444ff, wireframe:USE_WIREFRAME})
	);
	mesh2.position.set(-24, 0, 46);
	mesh2.position.y += 1; // Move the mesh up 1 meter
	mesh2.receiveShadow = true; //object에그림자설정
	mesh2.castShadow = true; //바닥에비칠그림자설정
	scene.add(mesh2);

	//하얀바닥
	meshFloor = new THREE.Mesh(
		//10,10,2,2보다 segment 많을수록 더 많은 polygon 나옴
		new THREE.PlaneGeometry(100,100, 10,10), //plane이니까2차원-앞parameter2개가size결정
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

	// 미로 생성 x, z 좌표 plane size 5배로 늘리자고 얘기해보기

	// boundary
	maze(7, 8, 1, 19.5, 8/2, -22.5);
	maze(37, 8, 1, -4.5, 8/2, -22.5);
	maze(1, 8, 46, -23, 8/2, 0);
	maze(1, 8, 46, 23, 8/2, 0);
	maze(10, 8, 1, -18, 8/2, 22.5);
	maze(34, 8, 1, 6, 8/2, 22.5);

	// 세로 열

	maze(1, 8, 4, 19.5, 8/2, -18);
	maze(1, 8, 7, 19.5, 8/2, -10.5);
	maze(1, 8, 7, 19.5, 8/2, 1.5);
	maze(1, 8, 4, 19.5, 8/2, 9);
	maze(1, 8, 4, 19.5, 8/2, 17);

	maze(1, 8, 10, 16.5, 8/2, -15);
	maze(1, 8, 4, 16.5, 8/2, -6);
	maze(1, 8, 4, 16.5, 8/2, 0);
	maze(1, 8, 10, 16.5, 8/2, 9);

	maze(1, 8, 3, 13.5, 8/2, -20.5);
	maze(1, 8, 7, 13.5, 8/2, -13.5);
	maze(1, 8, 4, 13.5, 8/2, -6);
	maze(1, 8, 4, 13.5, 8/2, 0);
	maze(1, 8, 4, 13.5, 8/2, 9);
	maze(1, 8, 4, 13.5, 8/2, 18);

	maze(1, 8, 6, 10.5, 8/2, -19);
	maze(1, 8, 4, 10.5, 8/2, -12);
	maze(1, 8, 4, 10.5, 8/2, -6);
	maze(1, 8, 7, 10.5, 8/2, 1.5);
	maze(1, 8, 7, 10.5, 8/2, 10.5);
	maze(1, 8, 4, 10.5, 8/2, 21);

	maze(1, 8, 13, 7.5, 8/2, -13.5);
	maze(1, 8, 4, 7.5, 8/2, -3);
	maze(1, 8, 7, 7.5, 8/2, 7.5);

	maze(1, 8, 3, 4.5, 8/2, -20.5);
	maze(1, 8, 7, 4.5, 8/2, -13.5);
	maze(1, 8, 4, 4.5, 8/2, -6);
	maze(1, 8, 4, 4.5, 8/2, 0);
	maze(1, 8, 4, 4.5, 8/2, 9);
	maze(1, 8, 4, 4.5, 8/2, 18);

	maze(1, 8, 4, 1.5, 8/2, -15);
	maze(1, 8, 4, 1.5, 8/2, -9);
	maze(1, 8, 4, 1.5, 8/2, -3);
	maze(1, 8, 4, 1.5, 8/2, 6);
	maze(1, 8, 4, 1.5, 8/2, 12);
	maze(1, 8, 3, 1.5, 8/2, 20.5);

	maze(1, 8, 13, -1.5, 8/2, -10.5);
	maze(1, 8, 7, -1.5, 8/2, 1.5);
	maze(1, 8, 4, -1.5, 8/2, 15);

	maze(1, 8, 4, -4.5, 8/2, -15);
	maze(1, 8, 4, -4.5, 8/2, -9);
	maze(1, 8, 4, -4.5, 8/2, -3);
	maze(1, 8, 4, -4.5, 8/2, 6);
	maze(1, 8, 4, -4.5, 8/2, 12);
	maze(1, 8, 4, -4.5, 8/2, 21);

	maze(1, 8, 6, -7.5, 8/2, -19);
	maze(1, 8, 4, -7.5, 8/2, -3);
	maze(1, 8, 7, -7.5, 8/2, 4.5);

	maze(1, 8, 4, -10.5, 8/2, -18);
	maze(1, 8, 4, -10.5, 8/2, -3);
	maze(1, 8, 4, -10.5, 8/2, 3);
	maze(1, 8, 4, -10.5, 8/2, 9);
	maze(1, 8, 7, -10.5, 8/2, 19.5);

	maze(1, 8, 10, -13.5, 8/2, -12);
	maze(1, 8, 4, -13.5, 8/2, 0);
	maze(1, 8, 10, -13.5, 8/2, 18);

	maze(1, 8, 4, -16.5, 8/2, -6);
	maze(1, 8, 7, -16.5, 8/2, 7.5);
	maze(1, 8, 4, -16.5, 8/2, 15);

	maze(1, 8, 7, -19.5, 8/2, -16.5);
	maze(1, 8, 4, -19.5, 8/2, -9);
	maze(1, 8, 4, -19.5, 8/2, -3);
	maze(1, 8, 4, -19.5, 8/2, 3);
	maze(1, 8, 4, -19.5, 8/2, 18);



	// 가로 열

	maze(4, 8, 1, 18, 8/2, -19.5);
	maze(4, 8, 1, 6, 8/2, -19.5);
	maze(7, 8, 1, -1.5, 8/2, -19.5);
	maze(7, 8, 1, -13.5, 8/2, -19.5);

	maze(4, 8, 1, 3, 8/2, -16.5);
	maze(4, 8, 1, -15, 8/2, -16.5);

	maze(4, 8, 1, 9, 8/2, -13.5);
	maze(7, 8, 1, -7.5, 8/2, -13.5);
	maze(4, 8, 1, -18, 8/2, -13.5);

	maze(7, 8, 1, 16.5, 8/2, -10.5);
	maze(7, 8, 1, 1.5, 8/2, -10.5);
	maze(4, 8, 1, -6, 8/2, -10.5);
	maze(4, 8, 1, -12, 8/2, -10.5);
	maze(7, 8, 1, -19.5, 8/2, -10.5);

	maze(7, 8, 1, 16.5, 8/2, -7.5);
	maze(4, 8, 1, 9, 8/2, -7.5);
	maze(7, 8, 1, -7.5, 8/2, -7.5);
	maze(4, 8, 1, -15, 8/2, -7.5);

	maze(4, 8, 1, 21, 8/2, -4.5);
	maze(4, 8, 1, 12, 8/2, -4.5);
	maze(4, 8, 1, 6, 8/2, -4.5);
	maze(4, 8, 1, 0, 8/2, -4.5);
	maze(4, 8, 1, -6, 8/2, -4.5);
	maze(4, 8, 1, -12, 8/2, -4.5);
	maze(4, 8, 1, -18, 8/2, -4.5);

	maze(4, 8, 1, 15, 8/2, -1.5);
	maze(4, 8, 1, 9, 8/2, -1.5);
	maze(4, 8, 1, 3, 8/2, -1.5);
	maze(4, 8, 1, -3, 8/2, -1.5);
	maze(4, 8, 1, -9, 8/2, -1.5);
	maze(4, 8, 1, -15, 8/2, -1.5);
	maze(4, 8, 1, -21, 8/2, -1.5);

	maze(10, 8, 1, 9, 8/2, 1.5);
	maze(4, 8, 1, 0, 8/2, 1.5);
	maze(4, 8, 1, -6, 8/2, 1.5);
	maze(4, 8, 1, -12, 8/2, 1.5);
	maze(4, 8, 1, -18, 8/2, 1.5);

	maze(7, 8, 1, 13.5, 8/2, 4.5);
	maze(13, 8, 1, 1.5, 8/2, 4.5);
	maze(10, 8, 1, -12, 8/2, 4.5);

	maze(4, 8, 1, 12, 8/2, 7.5);
	maze(4, 8, 1, 3, 8/2, 7.5);
	maze(7, 8, 1, -4.5, 8/2, 7.5);
	maze(4, 8, 1, -12, 8/2, 7.5);
	maze(7, 8, 1, -19.5, 8/2, 7.5);

	maze(4, 8, 1, 18, 8/2, 10.5);
	maze(4, 8, 1, 9, 8/2, 10.5);
	maze(4, 8, 1, 0, 8/2, 10.5);
	maze(7, 8, 1, -10.5, 8/2, 10.5);
	maze(4, 8, 1, -18, 8/2, 10.5);

	maze(7, 8, 1, 16.5, 8/2, 13.5);
	maze(7, 8, 1, 4.5, 8/2, 13.5);
	maze(13, 8, 1, -7.5, 8/2, 13.5);
	maze(4, 8, 1, -18, 8/2, 13.5);

	maze(4, 8, 1, 21, 8/2, 16.5);
	maze(7, 8, 1, 13.5, 8/2, 16.5);
	maze(10, 8, 1, 3, 8/2, 16.5);
	maze(7, 8, 1, -7.5, 8/2, 16.5);

	maze(7, 8, 1, 16.5, 8/2, 19.5);
	maze(4, 8, 1, 9, 8/2, 19.5);
	maze(7, 8, 1, -4.5, 8/2, 19.5);
	maze(7, 8, 1, -16.5, 8/2, 19.5);


	//load objects with mtl, obj loaders
	// obj 파일 불러오기
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



	//전체적인 조명(자연광)-색깔,밝기
	ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
	scene.add(ambientLight);

	light_red(18,3,-24);
	light_red(6,3,-30);
	light_red(-42.5,3,-17);
	light_red(30,3,0);
	light_red(0,3,6);
	light_red(-26,3,6);
	light_red(-12,3,12);
	light_red(-36, 3, 18);
	light_red(-13, 3, 42);
	light_red(24, 3, 18);
	light_red(32, 3, 36);

	// 그래픽 깨지면 주석처리 할 것

	light_yel(29.3, 2, -42);
	light_yel(43.7, 2, -14);
	light_yel(10.8, 2, -28);
/*
	light_yel(-12.7, 2, -36);
	light_yel(-30, 2, -12.7);
	light_yel(15, 2, 5.3);
	light_yel(10.8, 2, 36);
	light_yel(0, 2, 22.8);
	light_yel(-26, 2, 10.8);
	light_yel(-25.2, 2, 30);
*/

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
	keyboard = {};
	box.position.set(30, player.height, -48);


	camera.position.z = -0.1;
	camera.rotation.x = -3.1;
	camera.rotation.y = 0.0;

	//controls.target.set( target_x, target_y, target_z );
}

function clearDeath(){
	alert("다시 시작!");
	moveCam(30, 1.8, -48);
	deathCount = 3;
	RESOURCES_LOADED = true;
	counter = -1;
}

// Runs when all resources are loaded
function onResourcesLoaded(){

	// Clone models into meshes.
	meshes["benchDamaged1"] = models.benchDamaged.mesh.clone();
	meshes["benchDamaged2"] = models.benchDamaged.mesh.clone();
	//meshes["skeleton1"] = models.skeleton.mesh.clone();
	meshes["skeleton2"] = models.skeleton.mesh.clone();
	//meshes["gravestoneFlatOpen1"] = models.gravestoneFlatOpen.mesh.clone();
	meshes["gravestoneFlatOpen2"] = models.gravestoneFlatOpen.mesh.clone();
	meshes["lightpostHanging1"] = models.lightpostHanging.mesh.clone();
	meshes["lightpostHanging2"] = models.lightpostHanging.mesh.clone();
	meshes["lightpostHanging3"] = models.lightpostHanging.mesh.clone();
	meshes["lightpostHanging4"] = models.lightpostHanging.mesh.clone();
	meshes["lightpostHanging5"] = models.lightpostHanging.mesh.clone();
	meshes["lightpostHanging6"] = models.lightpostHanging.mesh.clone();
	meshes["lightpostHanging7"] = models.lightpostHanging.mesh.clone();
	meshes["lightpostHanging8"] = models.lightpostHanging.mesh.clone();
	meshes["lightpostHanging9"] = models.lightpostHanging.mesh.clone();
	meshes["lightpostHanging10"] = models.lightpostHanging.mesh.clone();
	//meshes["grave1"] = models.grave.mesh.clone();
	meshes["grave2"] = models.grave.mesh.clone();
	//meshes["zombie1"] = models.zombie.mesh.clone();
	meshes["zombie2"] = models.zombie.mesh.clone();
	//meshes["fountain1"] = models.fountain.mesh.clone();
	meshes["coffin1"] = models.coffin.mesh.clone();
	meshes["coffin2"] = models.coffin.mesh.clone();
	meshes["tree1"] = models.tree.mesh.clone();
	meshes["tree2"] = models.tree.mesh.clone();
	meshes["vampire1"] = models.vampire.mesh.clone();
	meshes["vampire2"] = models.vampire.mesh.clone();
	meshes["ghost1"] = models.ghost.mesh.clone();
	meshes["ghost2"] = models.ghost.mesh.clone();
	meshes["trunk1"] = models.trunk.mesh.clone();
	meshes["trunk2"] = models.trunk.mesh.clone();

	// Reposition individual meshes
	meshes["benchDamaged1"].position.set(18, 0, -24);
	meshes["benchDamaged2"].position.set(-36, 0, 18);
	//meshes["skeleton1"].position.set(-42, 0, -18);
	meshes["skeleton2"].position.set(24, 0, 17);
	//meshes["gravestoneFlatOpen1"].position.set(-42, 0, -19);
	meshes["gravestoneFlatOpen2"].position.set(24, 0, 16);
	meshes["ghost1"].position.set(30, 0, 0);
	meshes["ghost2"].position.set(0, 0, 6);
	meshes["trunk1"].position.set(30, 0, 0);
	meshes["trunk2"].position.set(0, 0, 6);
	
	meshes["lightpostHanging1"].position.set(28.3, 3, -42);
	meshes["lightpostHanging2"].position.set(44.7, 3, -14);
	meshes["lightpostHanging3"].position.set(10.3, 3, -28);
	meshes["lightpostHanging4"].position.set(-13.7, 3, -36);
	meshes["lightpostHanging5"].position.set(-30, 3, -13.7);
	meshes["lightpostHanging6"].position.set(15, 3, 4.3);
	meshes["lightpostHanging7"].position.set(10.3, 3, 36);
	meshes["lightpostHanging8"].position.set(0, 3, 22.3);
	meshes["lightpostHanging9"].position.set(-26, 3, 10.3);
	meshes["lightpostHanging10"].position.set(-25.7, 3, 30);
	
	//meshes["fountain1"].position.set(-12, 0, 12);
	//meshes["grave1"].position.set(-12, 0, 42.5);
	meshes["grave2"].position.set(6, 0, -31);
	//meshes["zombie1"].position.set(-12, 0, 42.5);
	meshes["zombie2"].position.set(7, 0, -31);
	
	meshes["coffin1"].position.set(-24, 2, 6);
	meshes["coffin2"].position.set(30, 2, 36);
	meshes["vampire1"].position.set(-25, 1, 6);
	meshes["vampire2"].position.set(31, 1, 36);
	meshes["tree1"].position.set(17, 0, -24.5);
	meshes["tree2"].position.set(-36, 0, 16.5);

	//Resize individual meshes
	meshes["benchDamaged1"].scale.set(3,3,2);
	meshes["benchDamaged2"].scale.set(3,3,2);
	//meshes["skeleton1"].scale.set(3,5,2);
	meshes["skeleton2"].scale.set(3,5,2);
	//meshes["gravestoneFlatOpen1"].scale.set(3,5,2);
	meshes["gravestoneFlatOpen2"].scale.set(3,5,2);
	meshes["lightpostHanging1"].scale.set(2,2,2);
	meshes["lightpostHanging2"].scale.set(2,2,2);
	meshes["lightpostHanging3"].scale.set(2,2,2);
	meshes["lightpostHanging4"].scale.set(2,2,2);
	meshes["lightpostHanging5"].scale.set(2,2,2);
	meshes["lightpostHanging6"].scale.set(2,2,2);
	meshes["lightpostHanging7"].scale.set(2,2,2);
	meshes["lightpostHanging8"].scale.set(2,2,2);
	meshes["lightpostHanging9"].scale.set(2,2,2);
	meshes["lightpostHanging10"].scale.set(2,2,2);
	//meshes["fountain1"].scale.set(1,2,1);
	//meshes["grave1"].scale.set(3,4,2);
	meshes["grave2"].scale.set(3,4,2);
	//meshes["zombie1"].scale.set(2,3,2);
	meshes["zombie2"].scale.set(2,3,2);
	meshes["coffin1"].scale.set(3,3,5);
	meshes["coffin2"].scale.set(3,3,5);
	meshes["vampire1"].scale.set(2,4,3);
	meshes["vampire2"].scale.set(2,4,3);
	meshes["tree1"].scale.set(2,2,2);
	meshes["tree2"].scale.set(2,2,2);
	meshes["ghost1"].scale.set(3,7,2);
	meshes["ghost2"].scale.set(3,7,2);
	meshes["trunk1"].scale.set(3,2,2);
	meshes["trunk2"].scale.set(3,2,2);

	//rotate mesh - Math.PI = 180degree, Math.PI/2 = 90 degree
	meshes["lightpostHanging1"].rotateY(Math.PI/2);
	meshes["lightpostHanging2"].rotateY(Math.PI/2*3);
	meshes["lightpostHanging3"].rotateY(Math.PI/2);
	meshes["lightpostHanging4"].rotateY(Math.PI/2);
	//meshes["lightpostHanging5"].rotateY(Math.PI);
	//meshes["lightpostHanging6"].rotateY(Math.PI/2);
	meshes["lightpostHanging7"].rotateY(Math.PI/2);
	//meshes["lightpostHanging8"].rotateY(Math.PI/2);
	//meshes["lightpostHanging9"].rotateY(Math.PI/2);
	meshes["lightpostHanging10"].rotateY(Math.PI/2);
	meshes["benchDamaged2"].rotateY(Math.PI/2*3);
	meshes["benchDamaged2"].rotateY(Math.PI/2*3);
	//meshes["zombie1"].rotateY(Math.PI/2*3);
	//meshes["grave1"].rotateY(Math.PI/2*3);
	//meshes["gravestoneFlatOpen1"].rotateX(Math.PI/2);
	meshes["gravestoneFlatOpen2"].rotateX(Math.PI/2);
	meshes["coffin1"].rotateX(Math.PI/2);
	meshes["coffin2"].rotateX(Math.PI/2);
	meshes["coffin2"].rotateZ(Math.PI/2*3);
	meshes["vampire2"].rotateY(Math.PI/2);
	meshes["ghost2"].rotateY(Math.PI/2);

	// add meshes to scene
	scene.add(meshes["benchDamaged1"]);
	scene.add(meshes["benchDamaged2"]);
	//scene.add(meshes["skeleton1"]);
	scene.add(meshes["skeleton2"]);
	//scene.add(meshes["gravestoneFlatOpen1"]);
	scene.add(meshes["gravestoneFlatOpen2"]);
	scene.add(meshes["lightpostHanging1"]);
	scene.add(meshes["lightpostHanging2"]);
	scene.add(meshes["lightpostHanging3"]);
	scene.add(meshes["lightpostHanging4"]);
	scene.add(meshes["lightpostHanging5"]);
	scene.add(meshes["lightpostHanging6"]);
	scene.add(meshes["lightpostHanging7"]);
	scene.add(meshes["lightpostHanging8"]);
	scene.add(meshes["lightpostHanging9"]);
	scene.add(meshes["lightpostHanging10"]);
	//scene.add(meshes["fountain1"]);
	//scene.add(meshes["grave1"]);
	scene.add(meshes["grave2"]);
	//scene.add(meshes["zombie1"]);
	scene.add(meshes["zombie2"]);
	scene.add(meshes["coffin1"]);
	scene.add(meshes["coffin2"]);
	scene.add(meshes["vampire1"]);
	scene.add(meshes["vampire2"]);
	scene.add(meshes["tree1"]);
	scene.add(meshes["tree2"]);
	scene.add(meshes["ghost1"]);
	scene.add(meshes["ghost2"]);
	scene.add(meshes["trunk1"]);
	scene.add(meshes["trunk2"]);
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
	checkCollision();
	Keyboard();
	//돌아가도록하는코드-x축,y축방향으로
	//mesh.rotation.x += 0.01;
	//mesh.rotation.y += 0.02;
	mesh2.rotation.x += 0.01;
	mesh2.rotation.y += 0.02;


	renderer.render(scene, camera);

	document.getElementById('monitor').innerText =
		box.position.x.toFixed(1) + ", " +
		box.position.y.toFixed(1) + ", " +
		box.position.z.toFixed(1) + "\n " +
		camera.rotation.x.toFixed(1) + ", " +
		camera.rotation.y.toFixed(1);

	document.getElementById('death').innerText =
		"목숨 " + deathCount + "개";

	//장애물 - 죽음
	if(box.position.x > 17 && box.position.x < 19.6){
		if(box.position.z < -22.0 && box.position.z > -25.0){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(box.position.x > 4.8 && box.position.x < 7.2){
		if(box.position.z < -29.0 && box.position.z > -31.0){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(box.position.x <-40.5 && box.position.x > -44.5){
		if(box.position.z < -16.0 && box.position.z > -19.0){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(box.position.x >28.5 && box.position.x < 31.5){
		if(box.position.z > -1.0 && box.position.z < 2.0){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(box.position.x >30.0 && box.position.x < 32.5){
		if(box.position.z > 35.0 && box.position.z < 37.0){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(box.position.x >22.2 && box.position.x < 24.8){
		if(box.position.z > 16.5 && box.position.z < 19.4){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(box.position.x >-0.5 && box.position.x < 2.0){
		if(box.position.z > 5.0 && box.position.z < 7.7){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(box.position.x <-11.5 && box.position.x > -13.5){
		if(box.position.z > 40.0 && box.position.z < 43.5){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(box.position.x <-34.5 && box.position.x > -37.5){
		if(box.position.z > 16.5 && box.position.z < 19.5){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(box.position.x <-10.5 && box.position.x > -13.5){
		if(box.position.z > 9.5 && box.position.z < 12.0){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(box.position.x <-23.0 && box.position.x > -26.0){
		if(box.position.z > 4.4 && box.position.z < 7.0){
			alert("장애물!! 목숨 -1");
			die();
		}
	}

	//완전히 Die
	if(deathCount == 0){
		alert("You Die!!");
		RESOURCES_LOADED = false;
		setTimeout(function(){
			RESOURCES_LOADED = true;
			counter = -1;
			document.getElementById('timer').style.display = "block";}, 3000);
		location.replace("retry.html");
	}

	//타이머 오버
	if(timeleft - counter == 0){
		alert("Time End!");
		document.getElementById('timer').style.display = "none";
		RESOURCES_LOADED = false;
	};

	// 목적지 도달
	if(box.position.x < -22.0 && box.position.x > -26.0){
		if(box.position.z > 38 && box.position.z < 48){
			location.replace("retry.html");
		}
	}
}

function die(){
	deathCount--;
	document.getElementById('death').innerText = "목숨 " + deathCount + "개";
	document.getElementById('timer').style.display = "none";

	//loading화면 띄우기
	RESOURCES_LOADED = false;
	setTimeout(function(){
		RESOURCES_LOADED = true;
		counter = -1;
		document.getElementById('timer').style.display = "block";}, 3000);
	moveCam(30, 1.8, -48);
	//전에 누른 마지막 키 눌러줘야함!
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

function maze(mw, mh, md, mx, my, mz){
	crate = new THREE.Mesh(
		new THREE.BoxGeometry(2*mw,mh, 2*md),   //사이즈-가로,세로,너비
		new THREE.MeshPhongMaterial({
			color:0xffffff,
			map:crateTexture,
			bumpMap:crateBumpMap,
			normalMap:crateNormalMap
		})
	);
	collisions.push(crate)
	scene.add(crate);
	// x, y, z -> x는 가로좌표 y가 상하 height, z가 앞뒤 depth
	// 현재 구성 -> ++ / -- 왼쪽 위가 양수 오른쪽 아래가 음수임
	crate.position.set(2*mx, my, 2*mz);   //object 둘 위치설정
	crate.receiveShadow = true;
	crate.castShadow = true;
}

function light_red(x, y, z) {
	//포인트조명-색깔,밝기,위치,near,far설정가능
	var light = new THREE.PointLight(0xff4444, 0.4, 50);
	light.position.set(x,y,z);
	light.castShadow = true;
	light.shadow.camera.near = 0.1;
	light.shadow.camera.far = 3;
	scene.add(light);
}

function light_yel(x, y, z) {
	//포인트조명-색깔,밝기,위치,near,far설정가능
	var light = new THREE.PointLight(0xffff44, 0.3, 50);
	light.position.set(x,y,z);
	light.castShadow = true;
	light.shadow.camera.near = 0.1;
	light.shadow.camera.far = 3;
	scene.add(light);
}

function keyDown(event){
	keyboard[event.keyCode] = true;
}

function keyUp(event){
	keyboard[event.keyCode] = false;
}

function createCharacter() {
	var geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
	var material = new THREE.MeshPhongMaterial({ color: 0x22dd88 });
	box = new THREE.Mesh( geometry, material );
	box.position.set(30, player.height, -48);
	box.material.visible = true;
	scene.add(box);
}

function checkCollision(){
	var origin = box.position.clone();
	// okToMove 함수가 true 일때만 키보드 조작 가능
	for(var v = 0; v < box.geometry.vertices.length; v ++){
		var localVertex = box.geometry.vertices[v].clone();
		var globalVertex = localVertex.applyMatrix4(box.matrix);
		var directionVector = globalVertex.sub(box.position);

		var ray = new THREE.Raycaster(origin, directionVector.clone().normalize());
		var collisionResults = ray.intersectObjects(collisions);
		if(collisionResults.length > 0 && collisionResults[0].distance <
			directionVector.length()){
			// 충돌 시 이벤트
			console.log("hit"); // 로그 창에 'hit' 출력
			setTimeout("",1000);
			setTimeout(backKeyboard(),100);
		}
		//
	}
}


function Keyboard(){

	if(keyboard[87]){ // W key
		box.position.x -= Math.sin(camera.rotation.y) * player.speed;
		box.position.z -= -Math.cos(camera.rotation.y) * player.speed;

	}

	if(keyboard[83]){ // S key
		box.position.x += Math.sin(camera.rotation.y) * player.speed;
		box.position.z += -Math.cos(camera.rotation.y) * player.speed;


	}
	if(keyboard[65]){ // A key
		// Redirect motion by 90 degrees
		box.position.x += Math.sin(camera.rotation.y + Math.PI/2) * player.speed;
		box.position.z += -Math.cos(camera.rotation.y + Math.PI/2) * player.speed;


	}
	if(keyboard[68]){ // D key
		box.position.x += Math.sin(camera.rotation.y - Math.PI/2) * player.speed;
		box.position.z += -Math.cos(camera.rotation.y - Math.PI/2) * player.speed;

	}
	// Keyboard turn inputs
	if(keyboard[37]){ // left arrow key
		camera.rotation.y -= player.turnSpeed;
	}
	if(keyboard[39]){ // right arrow key
		camera.rotation.y += player.turnSpeed;
	}

	if(keyboard[27]){ // esc 눌렀을 때
		location.replace("retry.html");
	}
}

function backKeyboard(){


	if(keyboard[87]){ // W key
		box.position.x += Math.sin(camera.rotation.y) * player.speed * 1.5;
		box.position.z += -Math.cos(camera.rotation.y) * player.speed * 1.5;


	}

	if(keyboard[83]){ // S key
		box.position.x -= Math.sin(camera.rotation.y) * player.speed * 1.5;
		box.position.z -= -Math.cos(camera.rotation.y) * player.speed * 1.5;


	}
	if(keyboard[65]){ // A key
		// Redirect motion by 90 degrees
		box.position.x -= Math.sin(camera.rotation.y + Math.PI/2) * player.speed * 1.5;
		box.position.z -= -Math.cos(camera.rotation.y + Math.PI/2) * player.speed * 1.5;


	}
	if(keyboard[68]){ // D key
		box.position.x -= Math.sin(camera.rotation.y - Math.PI/2) * player.speed * 1.5;
		box.position.z -= -Math.cos(camera.rotation.y - Math.PI/2) * player.speed * 1.5;

	}

}

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

window.onload = init;