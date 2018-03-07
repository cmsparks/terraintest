<!--quick erosion test
TERRIBLY SLOW ATM - It takes a good 30s-1m to actually erode terrain.
I am going to convert this erosion stuff to a GLSL compute shader.
-->
<script src="js/perlin.js"></script>
<canvas id="canvas" width="500px" height="500px"></canvas>
<script>
let c = document.getElementById('canvas');
let ctx = c.getContext('2d');
let res;
let data = createHeightmap(500, 500, 0.003, 8, 0.5, 0,255)
let test = bufferTo2d(data,500)
let hydraulicData = hydraulicErosion(test, 500, 1, .1, 1, 0.5)
console.log(JSON.parse(JSON.stringify(hydraulicData)))
hydraulicData = convertBounds(hydraulicData, 255)
data = bufferFrom2d(hydraulicData)


let imgData = ctx.createImageData(500,500)
let img = imgData.data;

for(let i = 0; i < img.length/4; i++) {
	img[4*i] = data[i];
	img[4*i+1] = data[i];
	img[4*i+2] = data[i];
	img[4*i+3] = 255;
}
ctx.putImageData(imgData, 0, 0)

function convertBounds(data_in, top) {
	let largest = data_in[0][0];
	let smallest = data_in[0][0];
	for(let i = 0; i < data_in.length; i++){
		for(let j = 0; j < data_in[0].length; j++) {
			if(data_in[i][j] > largest){
				largest = data_in[i][j];
			}
			if(data_in[i][j] < smallest){
				smallest = data_in[i][j];
			}
		}
	}
	console.log(largest+" "+smallest)
	for(let i = 0; i < data_in.length; i++){
		for(let j = 0; j < data_in[0].length; j++) {
			data_in[i][j] = ((data_in[i][j] - smallest)/(largest - smallest))*top
		}
	}
	console.log(JSON.parse(JSON.stringify(data_in)))
	return data_in;
}

function createHeightmap(w,l,scale,octaves,persistence,bot,top) {
	//let heightmap = [...Array(w)].map(i => Array(l));
	let heightmap = [];
	let hpIndex = 0;
	noise.seed(23);
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
			heightmap[hpIndex] = heightmap[hpIndex] * (top - bot) / 2 + (top + bot) / 2
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

	/*let retDat = Array(width).fill().map(() => Array(height).fill(0));
	for(let i = 0; i < width; i++) {
		for(let j = 0; j < height; j++) {
			retDat[i][j] += data_in[(j*height)+i]
		}
	}
	return retDat;*/
}
function bufferFrom2d(data_in) {
	let retDat = [];
	for(let i = 0; i < data_in.length; i++) {
		for(let j = 0; j < data_in[0].length; j++) {
			retDat.push(data_in[i][j]);
		}
	}
	return retDat;
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
				water_table[j][k] -= water_table[j][k] * evaporation
				if (sediment_table[j][k] > capacity*water_table[j][k]) {
					data_in[j][k] += sediment_table[j][k]+capacity*water_table[j][k]
					sediment_table[j][k] = capacity*water_table[j][k]
				}
			}
		}


	}

	return data_in;
}

function getSimplex(x,y,octaves,scale,persistence, seed) {
	let out_noise = 0;
	let maxAmp = 0;
	let amp = 1
	let freq = scale;
	noise.seed(seed);
	for(let k = 0; k < octaves; k++) {
		out_noise += noise.simplex2(x*freq, y*freq);
		maxAmp += amp;
		amp *= persistence;
		freq *= 2;
	}
	out_noise /= maxAmp;
	return out_noise
}

function createRidged(w, l, freq, lacunarity, octaves, seed) {
	let heightmap = [];
	let hpIndex = 0;
	let seeds = []
	for(let i = 0; i < octaves; i++){
		seeds.push(Math.random());
	}
	//noise.seed(32);
	for(let i = 0; i < w; i++){
		for(let j = 0; j < l; j++) {
			let persistence = 1
			for(let o = 0; o < octaves; o++){
				let simplex = getSimplex(i,j,1,scale,persistence,seed)
				simplex = Math.abs();
				signal = offset
				heightmap[hpIndex]
				hpIndex++;
			}
		}
	}
	return heightmap;
}

</script>