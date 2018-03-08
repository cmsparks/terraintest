//TODO: fix glitch where the top right corner of the
// ridged multifractal is consistently higher than
// other parts of the heightmap.

function createHeightmap(w,l,scale,octaves,persistence,bot,top) {
	//let heightmap = [...Array(w)].map(i => Array(l));
	let heightmap = [];
	let hpIndex = 0;
	let seeds = []
	for(let i = 0; i < octaves; i++){
		seeds.push(Math.random());
	}
	//noise.seed(32);
	for(let i = 0; i < w; i++){
		for(let j = 0; j < l; j++) {
			let maxAmp = 0
			let amp = 1
			let freq = scale
			heightmap[hpIndex] = 0
			for(let k = 0; k < octaves; k++){
				noise.seed(seeds[k]);
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

function hydraulicErosion(arr, iterations, end, rain_amount, erosion_weight, evaporation, capacity) {
	let data_in = arr;
	let water_table = Array(data_in.length).fill().map(() => Array(data_in[0].length).fill(0));
	let sediment_table = Array(data_in.length).fill().map(() => Array(data_in[0].length).fill(0));
	for (let i = 0; i < iterations; i++) {
		console.log(i)
		//populate water table
		if(i < end){
			for(let j = 0; j < data_in.length; j++ ){
				for(let k = 0; k < data_in[0].length; k++ ) {
					water_table[j][k] += 1;
				}
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
	let scale = 0.002
	let heightmap = [];
	let hpIndex = 0;
	let seeds = []
	let spectralWeights = []
	for(let i = 0; i < octaves; i++){
		seeds.push(Math.random());
		spectralWeights[i] = Math.pow(freq, -1);
		freq *= lacunarity;
	}
	let offset = 1;
	let gain = 2;
	//noise.seed(32);
	for(let i = 0; i < w; i++){
		for(let j = 0; j < l; j++) {
			let persistence = 1
			let value = 0
			let weight = 1
			let scale = freq;
			for(let o = 0; o < octaves; o++){
				let simplex = getSimplex(i,j,1,scale,persistence,seeds[o])
				scale*=2
				simplex = Math.abs(simplex);
				simplex = offset - simplex
				simplex *= simplex
				simplex *= weight

				weight = simplex * gain

				weight = simplex * gain
				if(weight > 1) {
					weight = 1;
				}
				if(weight < 0) {
					weight = 0
				}
				value += (simplex*spectralWeights[o]);
			}
			heightmap[hpIndex] = (value*1.25) - 1;
			hpIndex++;
		}
	}
	console.log(heightmap)
	return heightmap;
}