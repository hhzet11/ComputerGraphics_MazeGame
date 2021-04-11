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

var keyboard = {};
var player = { height:1.8, speed:0.6, turnSpeed:Math.PI*0.02 };
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
//작동법 보여주기
function operating(){
	alert('작동법');
	moveCam(30, 1.8, -48);
}

function init(){
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(90, 1280/720, 0.1, 1000);
	
	loading();
	
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
	meshFloor.receiveShadow = true;	//바닥에비칠그림자설정
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

/*
	//또다른물체-texture예시
	crate = new THREE.Mesh(
		new THREE.BoxGeometry(3,3,3),	//사이즈-가로,세로,너비
		new THREE.MeshPhongMaterial({
				color:0xffffff,
				map:crateTexture,
				bumpMap:crateBumpMap,
				normalMap:crateNormalMap
			})
	);
	scene.add(crate);
	crate.position.set(2.5, 3/2, 2.5);	//object 둘 위치설정
	crate.receiveShadow = true; 
	crate.castShadow = true;

	//미로 벽
	boarder1 = new THREE.Mesh(
		new THREE.BoxGeometry(50,10,1),//3차원이라3개parameter-값:size
		//color-물체색깔, wireframe-화면에보이게할건지설정->position의 +-에영향받음->순서?
		new THREE.MeshPhongMaterial({color:0x8C8C8C, wireframe:USE_WIREFRAME})
	);
	boarder1.position.set(0, 10/2, 25);	//object 둘 위치설정
	boarder1.receiveShadow = true; //object에그림자설정
	boarder1.castShadow = true; //바닥에비칠그림자설정
	scene.add(boarder1);
	
	//미로 벽
	boarder2 = new THREE.Mesh(
		new THREE.BoxGeometry(20,10,1),//3차원이라3개parameter-값:size
		//color-물체색깔, wireframe-화면에보이게할건지설정->position의 +-에영향받음->순서?
		new THREE.MeshPhongMaterial({color:0x8C8C8C, wireframe:USE_WIREFRAME})
	);
	boarder2.position.set(15, 10/2, 22);	//object 둘 위치설정
	boarder2.receiveShadow = true; //object에그림자설정
	boarder2.castShadow = true; //바닥에비칠그림자설정
	scene.add(boarder2);
*/		
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
	
	camera.position.set(30, player.height, -48);
	camera.rotation.x = -3.1;
	camera.rotation.y = 0.0;
	camera.lookAt(new THREE.Vector3(0,player.height,0));
	
	//전체적인 조명(자연광)-색깔,밝기
	ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
	scene.add(ambientLight);
	
	//포인트조명-색깔,밝기,위치,near,far설정가능
	var light = new THREE.PointLight(0xff4444, 0.4, 50);
	light.position.set(18,3,-24);
	light.castShadow = true;
	light.shadow.camera.near = 0.1;
	light.shadow.camera.far = 3;
	scene.add(light);
	
	var light2 = new THREE.PointLight(0xff4444, 0.4, 50);
	light2.position.set(6,3,-30);
	light2.castShadow = true;
	light2.shadow.camera.near = 0.1;
	light2.shadow.camera.far = 3;
	scene.add(light2);
	
	//왜안돼?
	var light3 = new THREE.PointLight(0xff4444, 0.4, 50);
	light3.position.set(-42.5,3,-17);
	light3.castShadow = true;
	light3.shadow.camera.near = 0.1;
	light3.shadow.camera.far = 3;
	scene.add(light3);
	
	var light4 = new THREE.PointLight(0xff4444, 0.4, 50);
	light4.position.set(30,3,0);
	light4.castShadow = true;
	light4.shadow.camera.near = 0.1;
	light4.shadow.camera.far = 3;
	scene.add(light4);
	
	var light5 = new THREE.PointLight(0xff4444, 0.4, 50);
	light5.position.set(0,3,6);
	light5.castShadow = true;
	light5.shadow.camera.near = 0.1;
	light5.shadow.camera.far = 3;
	scene.add(light5);
	
	var light6 = new THREE.PointLight(0xff4444, 0.4, 50);
	light6.position.set(-26,3,6);
	light6.castShadow = true;
	light6.shadow.camera.near = 0.1;
	light6.shadow.camera.far = 3;
	scene.add(light6);
	
	var light7 = new THREE.PointLight(0xff4444, 0.4, 50);
	light7.position.set(-12,3,12);
	light7.castShadow = true;
	light7.shadow.camera.near = 0.1;
	light7.shadow.camera.far = 3;
	scene.add(light7);
	
	var light8 = new THREE.PointLight(0xff4444, 0.4, 50);
	light8.position.set(-36,3,18);
	light8.castShadow = true;
	light8.shadow.camera.near = 0.1;
	light8.shadow.camera.far = 3;
	scene.add(light8);
	
	var light9 = new THREE.PointLight(0xff4444, 0.4, 50);
	light9.position.set(-13,3,42);
	light9.castShadow = true;
	light9.shadow.camera.near = 0.1;
	light9.shadow.camera.far = 3;
	scene.add(light9);
	
	var light10 = new THREE.PointLight(0xff4444, 0.4, 50);
	light10.position.set(24,3,18);
	light10.castShadow = true;
	light10.shadow.camera.near = 0.1;
	light10.shadow.camera.far = 3;
	scene.add(light10);
	
	var light11 = new THREE.PointLight(0xff4444, 0.4, 50);
	light11.position.set(32,3,36);
	light11.castShadow = true;
	light11.shadow.camera.near = 0.1;
	light11.shadow.camera.far = 3;
	scene.add(light11);
	
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
	meshes["skeleton1"] = models.skeleton.mesh.clone();
	meshes["skeleton2"] = models.skeleton.mesh.clone();
	meshes["gravestoneFlatOpen1"] = models.gravestoneFlatOpen.mesh.clone();
	meshes["gravestoneFlatOpen2"] = models.gravestoneFlatOpen.mesh.clone();
	meshes["grave1"] = models.grave.mesh.clone();
	meshes["grave2"] = models.grave.mesh.clone();
	meshes["zombie1"] = models.zombie.mesh.clone();
	meshes["zombie2"] = models.zombie.mesh.clone();
	meshes["fountain1"] = models.fountain.mesh.clone();
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
	meshes["skeleton1"].position.set(-42, 0, -18);
	meshes["skeleton2"].position.set(24, 0, 17);
	meshes["gravestoneFlatOpen1"].position.set(-42, 0, -19);
	meshes["gravestoneFlatOpen2"].position.set(24, 0, 16);
	meshes["ghost1"].position.set(30, 0, 0);
	meshes["ghost2"].position.set(0, 0, 6);
	meshes["trunk1"].position.set(30, 0, 0);
	meshes["trunk2"].position.set(0, 0, 6);
	meshes["fountain1"].position.set(-12, 0, 12);
	meshes["grave1"].position.set(-12, 0, 42.5);
	meshes["grave2"].position.set(6, 0, -31);
	meshes["zombie1"].position.set(-12, 0, 41.5);
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
	meshes["skeleton1"].scale.set(3,5,2);
	meshes["skeleton2"].scale.set(3,5,2);
	meshes["gravestoneFlatOpen1"].scale.set(3,5,2);
	meshes["gravestoneFlatOpen2"].scale.set(3,5,2);
	meshes["fountain1"].scale.set(1,2,1);
	meshes["grave1"].scale.set(3,4,2);
	meshes["grave2"].scale.set(3,4,2);
	meshes["zombie1"].scale.set(2,3,2);
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
	meshes["benchDamaged2"].rotateY(Math.PI/2*3);
	meshes["zombie1"].rotateY(Math.PI/2*3);
	meshes["grave1"].rotateY(Math.PI/2*3);
	meshes["gravestoneFlatOpen1"].rotateX(Math.PI/2);
	meshes["gravestoneFlatOpen2"].rotateX(Math.PI/2);
	meshes["coffin1"].rotateX(Math.PI/2);
	meshes["coffin1"].rotateZ(Math.PI/2);
	meshes["vampire1"].rotateY(Math.PI/2*3);
	meshes["coffin2"].rotateX(Math.PI/2);
	meshes["coffin2"].rotateZ(Math.PI/2*3);
	meshes["vampire2"].rotateY(Math.PI/2);
	meshes["ghost2"].rotateY(Math.PI/2);
	
	// add meshes to scene
	scene.add(meshes["benchDamaged1"]);
	scene.add(meshes["benchDamaged2"]);
	scene.add(meshes["skeleton1"]);
	scene.add(meshes["skeleton2"]);
	scene.add(meshes["gravestoneFlatOpen1"]);
	scene.add(meshes["gravestoneFlatOpen2"]);
	scene.add(meshes["fountain1"]);
	scene.add(meshes["grave1"]);
	scene.add(meshes["grave2"]);
	scene.add(meshes["zombie1"]);
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
	
	//돌아가도록하는코드-x축,y축방향으로
	mesh.rotation.x += 0.01;
	mesh.rotation.y += 0.02;
	mesh2.rotation.x += 0.01;
	mesh2.rotation.y += 0.02;
	
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
	
	document.getElementById('death').innerText = 
		"목숨 " + deathCount + "개";
	
	//장애물 - 죽음
	if(camera.position.x > 17 && camera.position.x < 19.6){
		if(camera.position.z < -22.0 && camera.position.z > -25.0){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(camera.position.x > 4.8 && camera.position.x < 7.2){
		if(camera.position.z < -29.0 && camera.position.z > -31.0){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(camera.position.x <-40.5 && camera.position.x > -44.5){
		if(camera.position.z < -16.0 && camera.position.z > -19.0){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(camera.position.x >28.5 && camera.position.x < 31.5){
		if(camera.position.z > -1.0 && camera.position.z < 2.0){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(camera.position.x >30.0 && camera.position.x < 32.5){
		if(camera.position.z > 35.0 && camera.position.z < 37.0){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(camera.position.x >22.2 && camera.position.x < 24.8){
		if(camera.position.z > 16.5 && camera.position.z < 19.4){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(camera.position.x >-0.5 && camera.position.x < 2.0){
		if(camera.position.z > 5.0 && camera.position.z < 7.7){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(camera.position.x <-11.5 && camera.position.x > -13.5){
		if(camera.position.z > 40.0 && camera.position.z < 43.5){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(camera.position.x <-34.5 && camera.position.x > -37.5){
		if(camera.position.z > 16.5 && camera.position.z < 19.5){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(camera.position.x <-10.5 && camera.position.x > -13.5){
		if(camera.position.z > 9.5 && camera.position.z < 12.0){
			alert("장애물!! 목숨 -1");
			die();
		}
	}
	if(camera.position.x <-23.0 && camera.position.x > -26.0){
		if(camera.position.z > 4.4 && camera.position.z < 7.0){
			alert("장애물!! 목숨 -1");
			die();
		}
	}

	//완전히 Die
	if(deathCount == 0){
		alert("You Die!!");
		RESOURCES_LOADED = false;
	}
	
	//타이머 오버
	if(timeleft - counter == 0){
		alert("Time End!");
		document.getElementById('timer').style.display = "none";
		RESOURCES_LOADED = false;
	};
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
   scene.add(crate);
   // x, y, z -> x는 가로좌표 y가 상하 height, z가 앞뒤 depth
   // 현재 구성 -> ++ / -- 왼쪽 위가 양수 오른쪽 아래가 음수임
   crate.position.set(2*mx, my, 2*mz);   //object 둘 위치설정
   crate.receiveShadow = true;
   crate.castShadow = true;
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