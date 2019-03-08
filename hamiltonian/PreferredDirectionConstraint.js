/**
 * Implements the preferred direction constraint.
 */

import SoftConstraint from "./SoftConstraint.js"

class PreferredDirectionConstraint extends SoftConstraint {

	// locationsList is a list with locations of each cell

	// at every MCS
	let cpi = Cs.cellpixelsi()
	// get locations for actual direction
	locationsList.unshift(getLocations(cpi))
	C.monteCarloStep()
	let locationsNew = getLocations(cpi)
	// calculate movement vecto between x steps ago and now
	if ( locationsList.length >= 16 ) {
		let move = movementDirection(locationsList.pop(), locationsNew)
		let moveNorm = move[1]
		move = move[0]

		// Change dir to previous movement and add noise
		C.updateDir(Object.keys( cpi ), moveNorm, "LAMBDA_FORCEDDIR")
		C.updateDir(Object.keys( cpi ), C.randDir(Object(moveNorm).length), "LAMBDA_RANDDIR")
	}

	// get locations
	function getLocations (cpi) {
		let locations = []
		let ids = Object.keys( cpi )
		for ( let i = 0; i < ids.length; i ++ ) {
			locations.push(Cs.getCentroidOf(ids[i], cpi[ids[i]]))
		}
		return locations
	}

	// calculate movement direction
	function movementDirection(locations, locationsNew) {
		let differences = []
		let differencesNorm = []
		for ( let i = 0; i < locations.length; i ++ ) {
			let difference = []
			for ( let j = 0; j < locations[0].length; j ++ ) {
				difference.push(locationsNew[i][j] - locations[i][j])
			}
			differences.push(difference)
			let length_correction = 1/(Math.sqrt(Math.pow(difference[0],2)+Math.pow(difference[1],2)))
			differencesNorm.push([difference[0]*length_correction,difference[1]*length_correction])
		}
		return [differences, differencesNorm]
	}

	// updates the preferred direction based on another direction and parameter strength
	updateDir (id, otherDirs, parameter) {
		let strength = this.par(parameter,1)
		for ( let i = 0; i < id.length; i ++ ) {
			let otherDir = otherDirs[i]
			// X
			let x = (this.prefdir[id[i]][0] * (1000 - strength) + otherDir[0] * strength) / 1000
			// Y
			let y = (this.prefdir[id[i]][1] * (1000 - strength) + otherDir[1] * strength) / 1000
			// Z
			let z, length_correction
			if( this.ndim == 3 ) {
				z = (this.prefdir[id[i]][2] * (1000 - strength) + otherDir[2] * strength) / 1000
				// normalisefactor
				length_correction = 1/(Math.sqrt(Math.pow(x,2)+Math.pow(y,2)+Math.pow(z,2)))
			} else {
				// normalisefactor
				length_correction = 1/(Math.sqrt(Math.pow(x,2)+Math.pow(y,2)))
			}
			//assign new values
			this.prefdir[id[i]][0] = x*length_correction
			this.prefdir[id[i]][1] = y*length_correction
			if( this.ndim == 3 ) {
				this.prefdir[id[i]][2] = z*length_correction
			}
		}
	}

	deltaHdir ( sourcei, targeti, src_type, tgt_type ) {
    let deltaH = 0, lambdadir
    // use parameters for the source cell, unless that is the background.
    // In that case, use parameters of the target cell.
    if( src_type != 0 ){
      lambdadir = this.par("LAMBDA_DIR",src_type)
    } else {
      // special case: punishment for a copy attempt from background into
      // an active cell. This effectively means that the active cell retracts,
      // which is different from one cell pushing into another (active) cell.
      lambdadir = this.par("LAMBDA_DIR",tgt_type)
    }
		let celnr = this.cellpixelstype[sourcei] //  dir = this.prefdir[celnr]
    let p1 = this.i2p(sourcei), p2 = this.i2p(targeti), dir = [0,0,0], r = 0., norm1 = 0, norm2 = 0, d1 = 0., d2 = 0.
		if( src_type != 0 ){
      dir = this.prefdir[celnr]
    }
		// loops over the coordinates x,y,(z)
		for( let i = 0; i < p1.length ; i++ ){
			// direction of the copy attempt on this coordinate is from p1 to p2
			d1 = p2[i] - p1[i]
			if(d1 > 1) {
				d1 = -1
			} else if(d1 < -1) {
				d1 = 1
			}
			// direction of the gradient
			d2 = dir[i]
			r += d1 * d2
			norm1 += d1*d1
			norm2 += d2*d2
		}
		let ang =  r/Math.sqrt(norm1)/Math.sqrt(norm2)
		deltaH = -lambdadir * ang
		if ( isNaN(deltaH)) {
			deltaH = 0
		}
    return deltaH
	}

}

export default PreferredDirectionConstraint
