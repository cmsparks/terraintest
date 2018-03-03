//script.js
//uses three.js and perlin.js
let scene, camera, renderer;

let geometry, material, cube;
let data;
let meshWidth = 500;
let meshLength = 500;
let meshScale = 20;
let mesh
let key = null;
//window.addEventListener('keyup',this.getKeyup,false)
//window.addEventListener('keypress', this.getKeypress, false)


let getKeydown = function(e) {
	if(e === undefined) {
		key = null;
	}
	else if(e.keyCode) {
		key = e.keyCode;
	}
}
window.addEventListener('keydown',getKeydown,false);
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
	lights[ 0 ] = new THREE.PointLight( 0xbbbbbb, 1, 0 );
	lights[ 1 ] = new THREE.PointLight( 0xbbbbbb, 1, 0 );
	lights[ 2 ] = new THREE.PointLight( 0xbbbbbb, 1, 0 );
	lights[ 0 ].position.set( 0, 200, 0 );
	lights[ 1 ].position.set( 100, 200, 100 );
	lights[ 2 ].position.set( - 100, - 200, - 100 );
	scene.add( lights[ 0 ] );
	scene.add( lights[ 1 ] );
	scene.add( lights[ 2 ] );


	data = createHeightmap(meshWidth, meshLength, 0.005, 4, .5, 0,1);

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

	mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {color: 0x77ff77, side: THREE.DoubleSide} ));
/*	new THREE.MeshPhongMaterial({
  color: 0xdddddd, 
  wireframe: true
}));*/
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xaaaaee, 1 );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	scene.add( mesh );

	camera.position.y = 15;
}

function animate() {
	requestAnimationFrame( animate );
	handleInput();
	renderer.render( scene, camera );

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

			//heightmap[hpIndex] = heightmap[hpIndex] * (top-bot)/2 + (top+bot)/2;
			hpIndex++;
			/*
			let n1 = noise.simplex2(i*scale,j*scale)
			let n2 = noise.simplex2(i*scale*2,j*scale*2)
			let n3 = noise.simplex2(i*scale*16,j*scale*16)
			heightmap.push((n1+n2/2));
			//heightmap.push(n1)
			*/
		}
	}
	return heightmap;
}



function handleInput() {
	//w
	if(key === 87) {
		camera.position.x +=1;
	}
	//s
	else if(key === 83) {
		camera.position.x -=1;
	}
	//d
	if(key === 68) {
		camera.position.z +=1;
	}
	if(key === 65) {
		camera.position.z -=1;
	}
		//up down
	if(key === 32) {
		camera.position.y +=1;
	}
	if(key === 16) {
		camera.position.y -=1;
	}
}

