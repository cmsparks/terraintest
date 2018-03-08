//script.js
//uses three.js and perlin.js

let scene, camera, renderer;
let controls;
let geometry, material, cube;
let data;
let meshWidth = 500;
let meshLength = 500;
let meshScale = 100;
let clock = new THREE.Clock();
init();
animate();
function init() {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

	//add camera controls

	var lights = [];
		lights[ 0 ] = new THREE.PointLight( 0x888888, 1, 0 );
		lights[ 1 ] = new THREE.PointLight( 0x888888, 1, 0 );
		lights[ 2 ] = new THREE.PointLight( 0x888888, 1, 0 );
		lights[ 0 ].position.set( 0, 200, 0 );
		lights[ 1 ].position.set( 100, 200, 100 );
		lights[ 2 ].position.set( - 100, - 200, - 100 );
		scene.add( lights[ 0 ] );
		scene.add( lights[ 1 ] );
		scene.add( lights[ 2 ] );

	controls = new THREE.FirstPersonControls( camera );
		controls.movementSpeed = 50;
		controls.lookSpeed = .3;
		controls.lookVertical = true;

	//data = createHeightmap(meshWidth, meshLength, 0.00007, 8, .25, 0,1);
	data = createRidged(500,500, 0.0007, 1, 3, Math.random());
	//let data2 = createHeightmap(meshWidth, meshLength, 0.00007, 8, .25, 0,4)
	console.log(JSON.parse(JSON.stringify(data)))
	//console.log(JSON.parse(JSON.stringify(data2)))
	/*for(let i = 0; i < data.length; i++) {
		data[i] *= 10
		data[i] += data2[i]*.1
	}*/
	let test = bufferTo2d(data,meshLength)
	let hydraulicData = hydraulicErosion(test, 500,  500, 1, .0001, 1, .75)
	//console.log(JSON.parse(JSON.stringify(hydraulicData)))
	/*for(let i = 0; i < test.length; i++) {
		for (let j = 0; j < test[0].length; j++){
			hydraulicData[i][j] = (test[i][j]*3) + hydraulicData[i][j]
		}
	}*/
	hydraulicData = convertBounds(hydraulicData, 1)
	data = bufferFrom2d(hydraulicData)

	let geometry = new THREE.PlaneBufferGeometry( meshWidth, meshLength, meshWidth-1, meshLength-1);
	//geometry.addAttribute('position', new THREE.BufferAttribute(49*49*3, 3))
	verticies = geometry.attributes.position.array;
	console.log(geometry.attributes.position.array);
	let l = geometry.attributes.position.length;
	geometry.rotateX(-Math.PI/2);
	for(let i = 0; i < l/3; i++) {
		verticies[(3*i)+1] = data[i]*meshScale;
	}
	geometry.attributes.position.needsUpdate = true;
	geometry.computeVertexNormals()

	mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {color: 0x917d6a} ));
/*	new THREE.MeshPhongMaterial({
  color: 0xdddddd, 
  wireframe: true
}));*/
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xaaaaee, 1 );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	scene.add( mesh );

	camera.position.y = 50;
}

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
	controls.update( clock.getDelta() )
}