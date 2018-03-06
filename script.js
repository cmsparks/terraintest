//script.js
//uses three.js and perlin.js
let scene, camera, renderer;
let controls;
let geometry, material, cube;
let data;
let meshWidth = 500;
let meshLength = 500;
let meshScale = 50;
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

	data = createHeightmap(meshWidth, meshLength, 0.0007, 5, .25, 0,255);
	let test = bufferTo2d(data,meshLength)
	let hydraulicData = hydraulicErosion(test, 500, 1, .005, 1, .75)
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

function bufferTo2d(arr, size) {
	  res = []; 
      for(var i=0;i < arr.length;i = i+size){
        res.push(arr.slice(i,i+size));
    }
    return res;
}

function bufferFrom2d(arr) {
	let retDat = [];
	for(let i = 0; i < arr.length; i++) {
		for(let j = 0; j < arr[0].length; j++) {
			retDat.push(arr[i][j]);
		}
	}
	return retDat;
}

function convertBounds(arr, top) {
	let largest = arr[0][0];
	let smallest = arr[0][0];
	for(let i = 0; i < arr.length; i++){
		for(let j = 0; j < arr[0].length; j++) {
			if(arr[i][j] > largest){
				largest = arr[i][j];
			}
			if(arr[i][j] < smallest){
				smallest = arr[i][j];
			}
		}
	}
	for(let i = 0; i < arr.length; i++){
		for(let j = 0; j < arr[0].length; j++) {
			arr[i][j] = ((arr[i][j] - smallest)/(largest - smallest))*top
		}
	}
	return arr;
}

function hydraulicErosion(arr, iterations, rain_amount, erosion_weight, evaporation, capacity) {
	let data_in = arr;
	let water_table = Array(data_in.length).fill().map(() => Array(data_in[0].length).fill(0));
	let sediment_table = Array(data_in.length).fill().map(() => Array(data_in[0].length).fill(0));
	for (let i = 0; i < iterations; i++) {
		console.log(i)
		//populate water table
		for(let j = 0; j < data_in.length; j++ ){
			for(let k = 0; k < data_in[0].length; k++ ) {
				water_table[j][k] += 1;
			}
		}
		//move solubility*water[pixel] into sediment table
		for(let j = 0; j < data_in.length; j++ ){
			for(let k = 0; k < data_in[0].length; k++ ) {
				let moved_sediment = data_in[j][k] * erosion_weight * water_table[j][k]
				data_in[j][k] -= moved_sediment;
				sediment_table[j][k] += moved_sediment;
			}
		}
		//move water downhill
		let changed_water = Array(data_in.length).fill().map(() => Array(data_in[0].length).fill(0));
		let changed_sediment = Array(data_in.length).fill().map(() => Array(data_in[0].length).fill(0));
		for(let j = 0; j < data_in.length; j++) {
			for(let k = 0; k < data_in[0].length; k++) {
				let current_level = data_in[j][k]
				let up = (j-1 > 0) ? data_in[j-1][k] : Number.MAX_SAFE_INTEGER;
				let left = (k-1 > 0) ? data_in[j][k-1] : Number.MAX_SAFE_INTEGER;
				let down = (j+1 < data_in.length) ? data_in[j+1][k] : Number.MAX_SAFE_INTEGER;
				let right = (k+1 < data_in[0].length) ? data_in[j][k+1] : Number.MAX_SAFE_INTEGER;
				let locArray = [current_level, up, down, left, right]
				let index = 0;
				let val = locArray[0];
				for(var l = 1; l < locArray.length; l++) {
					if(locArray[l] < val) {
						val = locArray[l];
						index = l;
					}
				}
				if(index === current_level) {
					changed_water[j][k] = water_table[j][k]
					changed_sediment[j][k] = sediment_table[j][k]
				}
				else if(index === 1) {
					changed_water[j-1][k] += water_table[j][k]
					changed_sediment[j-1][k] += sediment_table[j][k]
				}
				else if(index === 2) {
					changed_water[j+1][k] += water_table[j][k]
					changed_sediment[j+1][k] += sediment_table[j][k]
				}
				else if(index === 3) {
					changed_water[j][k-1] += water_table[j][k]
					changed_sediment[j][k-1] += sediment_table[j][k]
				}
				else if(index === 4) {
					changed_water[j][k+1] += water_table[j][k]
					changed_sediment[j][k+1] += sediment_table[j][k]
				}
			}
		}
		sediment_table = changed_sediment;
		water_table = changed_water;
		//evaporation and deposition
		for(let j = 0; j < data_in.length; j++) {
			for(let k = 0; k < data_in[0].length; k++) {
				water_table[j][k] -= water_table[j][k]* evaporation
				if (sediment_table[j][k] > capacity*water_table[j][k]) {
					data_in[j][k] += sediment_table[j][k]+capacity*water_table[j][k]
					sediment_table[j][k] = capacity*water_table[j][k]
				}
			}
		}

	}

	return data_in;
}
