/* 
	TODO
	- implement some checks for a 3D CPM
	- further test paramChecker
	- implement a stress test (somewhere else?): run a simulation at parameters where the cell has risk of
	breaking, and test at several times whether the connectedness remains intact.

*/

/** @test {LocalConnectivityConstraint} */
describe("LocalConnectivityConstraint", function () {
	let CPM = require("../../build/artistoo-cjs.js")
	let C, conn

	let fakeNeighi = function(i){
		//console.log( i + " " + testGrid.neighi( i ) )
		if( i === 3 ){ return [12674,12675,12676,2,4,130,131,132]}
		if( i === 259 ){ return [130,131,132,258,260,386,387,388]}
		if( i === 515 ){ return [386,387,388,514,516,642,643,644]}
		if( i === 131 ){ return [2,3,4,130,132,258,259,260]}
		if( i === 387 ){ return [258,259,260,386,388,514,515,516]}
		if( i === 0 ){ return [12771,12672,12673,99,1,227,128,129]}
		if( i === 129 ){ return [0,1,2,128,130,256,257,258]}
		if( i === 258 ){ return [129,130,131,257,259,385,386,387]}
		if( i === 516 ){ return [258,259,260,386,388,514,515,516]}
	}

	beforeEach(function () {
		C = new CPM.CPM([100, 100], {T: 20})
		conn = new CPM.LocalConnectivityConstraint({
			CONNECTED: [false, true]
		})
		C.add( conn )

	})

	describe( "[ Unit tests ]", function() {
		/* Testing the connected components method for specific cases */
		/** @test {LocalConnectivityConstraint#connectedComponentsOf} */
		describe("method [ connectedComponentsOf ]", function () {

			beforeEach(function () {
				// Replace the .grid.p2i function with mock code for real unit tests.
				C = jasmine.createSpyObj("C", [ "pixti","getConstraint" ])
				C.grid = jasmine.createSpyObj( "C.grid", ["p2i","i2p","neighi","pixti"] )
				C.grid.p2i.and.callFake( function(p) {
					let x = p[0], y = p[1]
					// hard code the required values.
					if( x === 2 && y === 2 ){ return 258 }
					if( x === 3 && y === 3 ){ return 387 }
					if( x === 4 && y === 4 ){ return 516 }
					if( x === 2 && y === 3 ){ return 259 }
					if( x === 0 && y === 3 ){ return 3 }
					if( x === 4 && y === 3 ){ return 515 }
					if( x === 0 && y === 0 ){ return 0 }
					if( x === 1 && y === 3 ){ return 131 }
					if( x === 1 && y === 1 ){ return 129 }

					// This should not happen.
					return NaN
				})
				// hard code the neighborhoods returned:
				C.grid.neighi.and.callFake( function(i){
					//console.log( i + " " + testGrid.neighi( i ) )
					return fakeNeighi(i)
				})

				// i2p always returns the same array, this shouldn't matter because
				// only the length of the connected components is tested here.
				C.grid.i2p.and.returnValue( [0,0] )

				conn = new CPM.LocalConnectivityConstraint({
					CONNECTED: [false, true]
				})
				conn.C = C
				C.getConstraint.and.callFake( function(){
					return conn
				})

				// pixti doesn't have to work, assume the whole neighborhood is
				// the same type and just look at whether a pixel is in the
				// object or not.
				C.pixti.and.returnValue( 1 )
				C.grid.pixti.and.returnValue( 1 )
			})

			it("should return only one component in connected case", function () {
				let nbhObj = {}
				for (let x = 0; x < 5; x++) {
					nbhObj[C.grid.p2i([x, 3])] = true
				}
				expect(C.getConstraint("LocalConnectivityConstraint").connectedComponentsOf(nbhObj).length).toEqual(1)

				nbhObj = {}
				for (let x = 0; x < 5; x++) {
					nbhObj[C.grid.p2i([x, x])] = true
				}
				expect(C.getConstraint("LocalConnectivityConstraint").connectedComponentsOf(nbhObj).length).toEqual(1)
			})
			it("should return multiple components in disconnected case", function () {
				let nbhObj = {}
				for (let x = 0; x < 5; x++) {
					if (x % 2 === 0) {
						nbhObj[C.grid.p2i([x, 3])] = true
					}
				}
				expect(C.getConstraint("LocalConnectivityConstraint").connectedComponentsOf(nbhObj).length).toEqual(3)

			})

		})
	})



	/* Testing if the overall constraint works, specific case*/


	describe( "[ Integration tests ]", function() {

		/* Integration test: Testing the parameter checker for this constraint*/
		/** @test {LocalConnectivityConstraint#confChecker} */
		describe("integration with ParameterChecker", function () {
			it("should throw an error when CONNECTED parameter is unspecified", function () {
				expect(function () {
					//noinspection JSCheckFunctionSignatures
					C.add(new CPM.LocalConnectivityConstraint({}))
				}).toThrow("Cannot find parameter CONNECTED in the conf object!")
			})
		})
		/* Integration test: constraint as a whole but with a mock CPM*/
		describe("when copy attempt would disrupt local connectivity", function () {
			let src_i, tgt_i, src_type, tgt_type

			beforeEach(function () {
				C = jasmine.createSpyObj("C", [ "pixti","getConstraint","cellKind" ])
				C.grid = jasmine.createSpyObj( "C.grid", ["neighi","pixti","i2p","p2i"] )
				conn = new CPM.LocalConnectivityConstraint({
					CONNECTED: [false, true]
				})
				conn.CPM = C
				C.getConstraint.and.callFake( function() {return conn})
				C.pixti.and.callFake(function(i){
					if( i === 0 || i === 1 || i === 2 ){
						return 1
					}
					return 0
					//if( i === 258 || i === 387 || i === 516  ){ return 1 }

				})
				C.grid.pixti.and.callFake( function(i) {
					if( i === 0 || i === 1 || i === 2 ){
						return 1
					}
					return 0
				})
				C.grid.neighi.and.callFake( function(i){
					return [ i - 1, i + 1 ]
				})
				C.grid.i2p.and.callFake( function(i){
					return [0,i]
				})
				C.grid.p2i.and.callFake( function(p){
					return p[1]
				})
				C.cellKind.and.callFake( function(t){
					if( t === 1 ){return 1 }
					return 0
				})
				src_i = 102 //259 //C.grid.p2i([2, 3])
				tgt_i = 1 //387 //C.grid.p2i([3, 3])
				src_type = C.pixti(src_i)
				tgt_type = C.pixti(tgt_i)
			})

			/** @test {LocalConnectivityConstraint#checkConnected} */
			it("#checkConnected should return false", function () {
				expect(C.getConstraint("LocalConnectivityConstraint").checkConnected(tgt_i, src_type, tgt_type)).toBeFalsy()
			})

			/** @test {LocalConnectivityConstraint#fulfilled} */
			describe("and when CONNECTED for the tgt cellKind", function () {
				it("is true, constraint should not be fulfilled", function () {
					expect(C.getConstraint("LocalConnectivityConstraint").fulfilled(src_i, tgt_i, src_type, tgt_type)).toBeFalsy()
				})
				it("is false, constraint should be fulfilled", function () {
					C.getConstraint("LocalConnectivityConstraint").conf.CONNECTED[1] = false
					expect(C.getConstraint("LocalConnectivityConstraint").fulfilled(src_i, tgt_i, src_type, tgt_type)).toBeTruthy()
				})
			})

		})


		/* Integration test: method connectedComponentsOf should listen to the torus property*/
		describe( "method [ connectedComponentsOf ]" , function () {

			it("should listen to the grid torus property correctly", function () {
				let nbhObj = {}
				let pix = C.grid.p2i([0, 0])

				// add pixel and its whole neighborhood
				nbhObj[pix] = true
				for (let n of C.grid.neighi(pix)) {
					nbhObj[n] = true
				}
				expect(C.getConstraint("LocalConnectivityConstraint").connectedComponentsOf(nbhObj).length).toEqual(1)

				// now change torus to false in one or both dimensions while keeping the same nbhObj
				let C_noTorus = new CPM.CPM([100, 100], {
					T: 20,
					torus: [false, false]
				})
				C_noTorus.add(new CPM.LocalConnectivityConstraint({
					CONNECTED: [false, true]
				}))
				expect(C_noTorus.getConstraint("LocalConnectivityConstraint").connectedComponentsOf(nbhObj).length).toEqual(4)

				let C_yTorus = new CPM.CPM([100, 100], {
					T: 20,
					torus: [false, true]
				})
				C_yTorus.add(new CPM.LocalConnectivityConstraint({
					CONNECTED: [false, true]
				}))
				expect(C_yTorus.getConstraint("LocalConnectivityConstraint").connectedComponentsOf(nbhObj).length).toEqual(2)

				let C_xTorus = new CPM.CPM([100, 100], {
					T: 20,
					torus: [true, false]
				})
				C_xTorus.add(new CPM.LocalConnectivityConstraint({
					CONNECTED: [false, true]
				}))
				expect(C_xTorus.getConstraint("LocalConnectivityConstraint").connectedComponentsOf(nbhObj).length).toEqual(2)
			})
		})
	})
})