/**
 * Implements the chemotaxis constraint of Potts models.
 * At the moment, this only works for 2d-CPMs modeled as a torus
 */

// conf_example = {
//   // should always be C.grid.field_size.x
//   FIELD_SIZE: C.grid.field_size.x,
//   // should me the math variable created by mathjs import
//   MATHOBJ: math,
//   // diffusion coefficient in mm^2/second
//   D: 6.2 * Math.pow(10, -5),
//   // how many mm is a pixel wide/high
//   MM_PER_PIXEL: .38/600,
//   // how many seconds are modeled by a MCS
//   SECOND_PER_MCS: 1,
//   // how many diffusion steps are performed per MCS
//   DIFFUSION_PER_MCS: 10,
//   // how coarse should the diffusion grid be
//   // setting this to 10 will result in a 60x60 diffusion grid if the main grid has a resolution of 600x600
//   RESOLUTION_DECREASE: 10,
//   // which cell type should secrete the chemokine
//   SECRETOR: 2,
//   // how much chemokine should each secreting pixel secrete
//   SECRETION: 100,
//   // what percentage of the chemokine should decay after a MCS
//   // setting this variable to 0 will disable decay, setting it to 1 will remove all chemokine after every MCS
//   DECAY: .1,
//   // how sensitive should all cell types be to the chemokine
//   // use positive values for attraction, and negative values for repulsion
//   LAMBDA_CHEMOTAXIS: [0,500,0,0,0]
// }


import SoftConstraint from "./SoftConstraint.js"

class ChemotaxisConstraint extends SoftConstraint {

  nmod(x, N) {
  	return ((x % N) + N) % N
  }

  t21(x,y,N){
  	return this.nmod(y,N)*N+this.nmod(x,N)
  }

	constructor( conf ){
    super(conf)
    this.conf = conf
		this.size = conf["FIELD_SIZE"]
    this.math = conf["MATHOBJ"]
		this.resolutionDecrease = conf["RESOLUTION_DECREASE"]
		this.newSize = this.size/this.resolutionDecrease
    this.DPerMCS = conf["DIFFUSION_PER_MCS"]
    this.D = conf["D"]
		this.D /= this.DPerMCS
		this.dx = conf["MM_PER_PIXEL"] * this.resolutionDecrease
		this.dt = conf["SECOND_PER_MCS"] / 60
		this.secretion = conf["SECRETION"]
		this.decay = conf["DECAY"]

		// prepare laplacian matrix
		this.L = this.math.multiply( this.math.identity( (this.newSize)*(this.newSize), (this.newSize)*(this.newSize), "sparse" ), -4 )
		for( let x = 0 ; x < (this.newSize) ; x ++ ){
			for( let y = 0 ; y < (this.newSize); y ++ ){
				let i = this.t21(x,y,(this.newSize))
				this.L.set([i,this.t21(this.nmod(x-1,(this.newSize)),y,(this.newSize))],1)
				this.L.set([i,this.t21(this.nmod(x+1,(this.newSize)),y,(this.newSize))],1)
				this.L.set([i,this.t21(x,this.nmod(y-1,(this.newSize)),(this.newSize))],1)
				this.L.set([i,this.t21(x,this.nmod(y+1,(this.newSize)),(this.newSize))],1)
			}
		}

    // scale matrix to diffusion coefficient & spatiotemporal step
		this.A = this.math.multiply( this.L, this.D * this.dt / this.dx / this.dx )
		this.chemokinelevel = this.math.zeros((this.newSize)*(this.newSize),1)
		this.chemokinereal = this.math.zeros(this.size*this.size,1)

		// create list for faster interpolation
		this.interpolatelist = [[]]
		for (var x = 0; x < this.size; x++) {
			this.interpolatelist.push([])
	    for (var y = 0; y < this.size; y++) {
				let xplus = x/this.resolutionDecrease + 0.001
				let yplus = y/this.resolutionDecrease + 0.001
				let p1 = Math.abs((x/this.resolutionDecrease - this.math.floor(xplus)) * (y/this.resolutionDecrease - this.math.floor(yplus)))
				let p2 = Math.abs((x/this.resolutionDecrease - this.math.floor(xplus)) * (this.math.ceil(yplus) - y/this.resolutionDecrease))
				let p3 = Math.abs((this.math.ceil(xplus) - x/this.resolutionDecrease) * (y/this.resolutionDecrease - this.math.floor(yplus)))
				let p4 = Math.abs((this.math.ceil(xplus) - x/this.resolutionDecrease) * (this.math.ceil(yplus) - y/this.resolutionDecrease))
				this.interpolatelist[x].push([p1, p2, p3, p4])
			}
		}
	}

  // at every pixel occupied by an infected cell, secrete (secretion rate/(resolutionDecrease^2)) chemokine
	produceChemokine () {
		for (var x = 0; x < this.size; x++) {
	    for (var y = 0; y < this.size; y++) {
				if (this.C.t2k[this.C.pixti(this.C.grid.p2i([x,y]))] == this.conf["SECRETOR"]) {
					let index = [this.t21(this.math.floor(x/this.resolutionDecrease),this.math.floor(y/this.resolutionDecrease),(this.newSize)),0]
          this.chemokinelevel.set(index, this.chemokinelevel.get(index) + (this.secretion/(this.resolutionDecrease*this.resolutionDecrease)) * this.dt)
        }
			}
		}
	}

	// perform diffusion
	updateValues () {
		this.chemokinelevel = this.math.add( this.math.multiply( this.A, this.chemokinelevel ), this.chemokinelevel )
	}

	// interpolate between the grid points in the diffusion grid to obtain a more accurate chemokine value for the main grid
	interpolate(x, y, c) {
		let xplus = x + 0.001
		let yplus = y + 0.001
		let cx = this.nmod(((xplus) << 0)+1,this.newSize)
		let fx = this.nmod((xplus) << 0,this.newSize)
		let cy = this.nmod(((yplus) << 0)+1,this.newSize)
		let fy = this.nmod((yplus) << 0,this.newSize)
		let p1 = c.get([cx, cy]) * this.interpolatelist[x*this.resolutionDecrease][y*this.resolutionDecrease][0]
		let p2 = c.get([cx, fy]) * this.interpolatelist[x*this.resolutionDecrease][y*this.resolutionDecrease][1]
		let p3 = c.get([fx, cy]) * this.interpolatelist[x*this.resolutionDecrease][y*this.resolutionDecrease][2]
		let p4 = c.get([fx, fy]) * this.interpolatelist[x*this.resolutionDecrease][y*this.resolutionDecrease][3]
		return (p1+p2+p3+p4)
	}

	// updates the main grid with interpolated values of the chemokine grid
	updateGrid () {
    // reshapes the lists in matrice for easy matrix interpolation
		let chemokineMatrix = this.math.reshape(this.chemokinelevel, [(this.newSize), (this.newSize)])
		this.chemokinereal = this.math.reshape(this.chemokinereal, [this.size, this.size])

    // update chemokinereal by interpolating chemokinelevel
		for (var x = 0; x < this.size; x++) {
	    for (var y = 0; y < this.size; y++) {
				let scalex = x/this.resolutionDecrease
				let scaley = y/this.resolutionDecrease
				let value = this.interpolate(scalex, scaley, chemokineMatrix)
				this.chemokinereal.set([x,y], value)
			}
		}

    // reshapes the matrices back into lists
		this.chemokinereal = this.math.reshape(this.chemokinereal, [this.size*this.size, 1])
		this.chemokinelevel = this.math.reshape(this.chemokinelevel, [(this.newSize)*(this.newSize), 1])
	}

	// removes a percentage of the chemokine
	removeChemokine () {
		this.chemokinelevel = this.math.multiply(this.chemokinelevel, 1 - this.decay * this.dt)
	}

  postMCSListener(){
    // Chemokine is produced by all chemokine grid lattice sites
		this.produceChemokine()
		// Every MCS, the chemokine diffuses 10 times
		for(let i = 0; i < this.DPerMCS; i++) {
			this.updateValues()
		}
		// Updates the main grid with interpolated values of the chemokine grid
		this.updateGrid()
		// Chemokine decays
		this.removeChemokine()
  }

  /* To bias a copy attempt p1 -> p2 in the direction of vector 'dir'.
	This implements a linear gradient rather than a radial one as with pointAttractor. */
	linAttractor ( p1, p2, dir ){
		let r = 0., norm1 = 0, norm2 = 0, d1 = 0., d2 = 0.
		// loops over the coordinates x,y,(z)
		for( let i = 0; i < p1.length ; i++ ){
			// direction of the copy attempt on this coordinate is from p1 to p2
			d1 = p2[i] - p1[i]
			// direction of the gradient
			d2 = dir[i]
			r += d1 * d2
			norm1 += d1*d1
			norm2 += d2*d2
		}
		if ( norm2 == 0 ) { return 0 }
		return r/Math.sqrt(norm1)/Math.sqrt(norm2)
	}

	// computes the chemokine gradient at lattice site source
	computeGradient ( source, chemokinelevel ) {
		let gradient = [0, 0]
		for ( let i = -1; i < 2; i++ ) {
			for ( let j = -1; j < 2; j++ ) {
				//gradient is - for all dimensions - the sum of the directions*chemokine_level of all neighbors
				gradient[0] += i * (chemokinelevel.get([this.t21((source[0]+i)%(this.size-1)+1, (source[1]+j)%(this.size-1)+1,this.size),0]) - chemokinelevel.get([this.t21(source[0], source[1],this.size),0]))
				gradient[1] += j * (chemokinelevel.get([this.t21((source[0]+i)%(this.size-1)+1, (source[1]+j)%(this.size -1)+1,this.size),0]) - chemokinelevel.get([this.t21(source[0], source[1],this.size),0]))
			}
		}
		return gradient
	}

	deltaH( sourcei, targeti, src_type, tgt_type ){
		let gradientvec2 = this.computeGradient( this.C.grid.i2p(sourcei), this.chemokinereal )
		let bias = this.linAttractor( this.C.grid.i2p(sourcei), this.C.grid.i2p(targeti), gradientvec2 )
    let lambdachem
		if( src_type != 0 ){
			lambdachem = this.conf["LAMBDA_CHEMOTAXIS"][this.C.t2k[src_type]]
		} else {
			lambdachem = this.conf["LAMBDA_CHEMOTAXIS"][this.C.t2k[tgt_type]]
		}
		return -bias*lambdachem
	}
}

export default ChemotaxisConstraint
