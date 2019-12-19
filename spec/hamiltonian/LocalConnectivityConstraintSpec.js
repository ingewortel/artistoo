/* 
	TODO
	- implement some checks for a 3D CPM
	- implement a stress test (somewhere else?): run a simulation at parameters where the cell has risk of
	breaking, and test at several times whether the connectedness remains intact.

*/


describe("LocalConnectivityConstraint", function() {
  let CPM = require('../../build/cpm-cjs.js');
  let C = 
  
  beforeEach(function() {
    C = new CPM.CPM( [100,100], {
		T : 20,
		J : [[0,20],[20,10]],
		V : [0,200],
		LAMBDA_V : [0,5]
	  })
	  C.add( new CPM.LocalConnectivityConstraint( {
		CONNECTED : [false,true]
	  }))
   
  });

/* Testing the parameter checker for this constraint*/
  it("should throw an error when CONNECTED parameter is not specified", function() {
  	expect(function() {
        C.add( new CPM.LocalConnectivityConstraint({}) );
    }).toThrow("Cannot find parameter CONNECTED in the conf object!");
  });

/* Testing the connected components method for specific cases */
  describe("when computing connected components", function() {
	it("should return only one component in connected case", function() {
		let nbhobj = {}
		for( let x = 0; x < 5; x++ ){
			nbhobj[ C.grid.p2i([x,3]) ] = true
		}
		expect( C.getConstraint("LocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(1);
		
		nbhobj = {}
		for( let x = 0; x < 5; x++ ){
			nbhobj[ C.grid.p2i([x,x]) ] = true
		}
		expect( C.getConstraint("LocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(1);
	});
	it("should return multiple components in disconnected case", function() {
		let nbhobj = {}
		for( let x = 0; x < 5; x++ ){
			if( x % 2 == 0 ){
				nbhobj[ C.grid.p2i([x,3]) ] = true
			}
		}
		expect( C.getConstraint("LocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(3);
		
	});
	it("should listen to the grid torus property correctly", function() {
		let nbhobj = {}
		
		let pix = C.grid.p2i( [0,0] )
		
		// add pixel and its whole neighborhood
		nbhobj[pix] = true
		for( let n of C.grid.neighi(pix) ){
			nbhobj[n] = true
		}
		expect( C.getConstraint("LocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(1);
		
		// now change torus to false in one or both dimensions while keeping the same nbhobj
		let C_notorus = new CPM.CPM( [100,100], {
			T : 20,
			torus : [false,false],
			J : [[0,20],[20,10]],
			V : [0,200],
			LAMBDA_V : [0,5]
		  })
		 C_notorus.add( new CPM.LocalConnectivityConstraint( {
			CONNECTED : [false,true]
		 }))
		 expect( C_notorus.getConstraint("LocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(4);
		
		let C_ytorus = new CPM.CPM( [100,100], {
			T : 20,
			torus : [false,true],
			J : [[0,20],[20,10]],
			V : [0,200],
			LAMBDA_V : [0,5]
		  })
		 C_ytorus.add( new CPM.LocalConnectivityConstraint( {
			CONNECTED : [false,true]
		 }))
		 expect( C_ytorus.getConstraint("LocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(2);
		 
		 let C_xtorus = new CPM.CPM( [100,100], {
			T : 20,
			torus : [true,false],
			J : [[0,20],[20,10]],
			V : [0,200],
			LAMBDA_V : [0,5]
		  })
		 C_xtorus.add( new CPM.LocalConnectivityConstraint( {
			CONNECTED : [false,true]
		 }))
		 expect( C_xtorus.getConstraint("LocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(2);

		
	});
  });

/* Testing if the overall constraint works, specific case*/
  describe("when copy attempt would disrupt local connectivity", function() {
  	let src_i, tgt_i, src_type, tgt_type 
  
    beforeEach(function() {
      let cid = C.makeNewCellID(1)
    
      C.setpix( [2,2], cid )
      C.setpix( [3,3], cid )
      C.setpix( [4,4], cid )
      src_i = C.grid.p2i( [2,3] )
      tgt_i = C.grid.p2i( [3,3] )
      src_type = C.pixti( src_i )
      tgt_type = C.pixti( tgt_i )
    });

	it("#checkConnected should return false", function() {
    	expect(C.getConstraint("LocalConnectivityConstraint").checkConnected( tgt_i, src_type, tgt_type ) ).toBeFalsy();
    })
    
    describe("and when CONNECTED for the tgt celltype", function() {
    	it("is true, constraint should not be fulfilled", function() {
		  expect(C.getConstraint("LocalConnectivityConstraint").fulfilled( src_i, tgt_i, src_type, tgt_type ) ).toBeFalsy();
		}); 
		it("is false, constraint should be fulfilled", function() {
		  C.getConstraint("LocalConnectivityConstraint").conf.CONNECTED[1]=false
		  expect(C.getConstraint("LocalConnectivityConstraint").fulfilled( src_i, tgt_i, src_type, tgt_type ) ).toBeTruthy();
		}); 
    })

  });

 
});