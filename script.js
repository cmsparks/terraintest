//script.js
//uses three.js and perlin.js
let scene, camera, renderer;
let controls;
let geometry, material, cube;
let data;
let meshWidth = 100;
let meshLength = 100;
let meshScale = 35;
let mesh
let key = null;
let clock = new THREE.Clock();
//window.addEventListener('keyup',this.getKeyup,false)
//window.addEventListener('keypress', this.getKeypress, false)
/*function getKeyup(e) {
	return e.keyCode;
}

function getKeypress(e) {
	return e.keyCode;
}*/
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

	data = createHeightmap(meshWidth, meshLength, 0.0004, 8, .25, 0,1);

	let geometry = new THREE.PlaneBufferGeometry( 500, 500, meshWidth-1, meshLength-1);
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

	mesh = new THREE.Mesh( geometry, //new THREE.MeshLambertMaterial( {color: 0x77ff77, side: THREE.DoubleSide} ));
	new THREE.MeshPhongMaterial({
  color: 0xdddddd, 
  wireframe: true
}));
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xaaaaee, 1 );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	scene.add( mesh );

	camera.position.y = 15;
}

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
	controls.update( clock.getDelta() )
}

function createHeightmap(w,l,scale,octaves,persistence,bot,top) {
	//let heightmap = [...Array(w)].map(i => Array(l));
	let heightmap = [];
	let hpIndex = 0;
	noise.seed(Math.random());
	for(let i = 0; i < w; i++){
		for(let j = 0; j < l; j++) {
			let maxAmp = 0
			let amp = 1
			let freq = scale
			heightmap[hpIndex] = 0
			for(let k = 0; k < octaves; k++){
				heightmap[hpIndex] += noise.simplex2(i*freq,j*freq);
				maxAmp += amp;
				amp *= persistence;
				freq *= 2
			}
			heightmap[hpIndex] /= maxAmp;

			hpIndex++;
		}
	}
	return heightmap;
}

