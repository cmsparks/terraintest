//quick erosion test


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