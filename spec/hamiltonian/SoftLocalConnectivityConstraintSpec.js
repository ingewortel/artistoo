/* 
	TODO
	
*/


describe("SoftLocalConnectivityConstraint", function() {
  let CPM = require('../../build/artistoo-cjs.js');
  let C
  
  beforeEach(function() {
	  C = new CPM.CPM( [100,100], {T:20})
	  C.add( new CPM.SoftLocalConnectivityConstraint( {
		LAMBDA_CONNECTIVITY : [0,1000]
	  }))
   
  });

/* Testing the parameter checker for this constraint*/
  it("should throw an error when LAMBDA_CONNECTIVITY parameter is not specified", function() {
  	expect(function() {
        C.add( new CPM.SoftLocalConnectivityConstraint({}) );
    }).toThrow("Cannot find parameter LAMBDA_CONNECTIVITY in the conf object!");
  });
  it("should throw an error when NBH_TYPE is set incorrectly", function() {
  	expect(function() {
        C.add( new CPM.SoftLocalConnectivityConstraint({ LAMBDA_CONNECTIVITY : [0,1000], NBH_TYPE : "a" }) );
    }).toThrow("In the SoftLocalConnectivityConstraint, NBH_TYPE must be either 'Neumann' or 'Moore'");
    
    expect(function() {
        C.add( new CPM.SoftLocalConnectivityConstraint({ LAMBDA_CONNECTIVITY : [0,1000], NBH_TYPE : 1}) );
    }).toThrow("In the SoftLocalConnectivityConstraint, NBH_TYPE must be either 'Neumann' or 'Moore'");
    
    expect(function() {
        C.add( new CPM.SoftLocalConnectivityConstraint({ LAMBDA_CONNECTIVITY : [0,1000], NBH_TYPE : [1,2] }) );
    }).toThrow("In the SoftLocalConnectivityConstraint, NBH_TYPE must be either 'Neumann' or 'Moore'");
    
  });

/* Testing the connected components method for specific cases */
  describe("when computing connected components", function() {
  
	it("should return only one component in connected case", function() {
		let nbhobj = {}
		for( let x = 0; x < 5; x++ ){
			nbhobj[ C.grid.p2i([x,3]) ] = true
		}
		expect( C.getConstraint("SoftLocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(1);
		
	});
	it("should return multiple components in disconnected case", function() {
		let nbhobj = {}
		for( let x = 0; x < 5; x++ ){
			if( x % 2 == 0 ){
				nbhobj[ C.grid.p2i([x,3]) ] = true
			}
		}
		expect( C.getConstraint("SoftLocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(3);
		
		// diagonal connections don't count as connections
		nbhobj = {}
		for( let x = 0; x < 5; x++ ){
			nbhobj[ C.grid.p2i([x,x]) ] = true
		}
		expect( C.getConstraint("SoftLocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(5);
		
	});
	it("should listen to the neighborhood type property correctly", function(){
		
		// diagonal connections don't count as connections if the Neumann neighborhood is used (default)
		nbhobj = {}
		for( let x = 0; x < 5; x++ ){
			nbhobj[ C.grid.p2i([x,x]) ] = true
		}
		expect( C.getConstraint("SoftLocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(5);
	
	
		// ... but this case is connected when the Moore neighborhood is used
		C.getConstraint("SoftLocalConnectivityConstraint").nbhtype = "Moore"
		expect( C.getConstraint("SoftLocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(1);
		
		// ... and this should be again 5 when we switch back to Neumann
		C.getConstraint("SoftLocalConnectivityConstraint").nbhtype = "Neumann"
		expect( C.getConstraint("SoftLocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(5);
		
		// Or we can start from scratch:
		let C2 = new CPM.CPM( [100,100], {T:20})
		  C2.add( new CPM.SoftLocalConnectivityConstraint( {
			LAMBDA_CONNECTIVITY : [0,1000],
			NBH_TYPE : "Moore"
		  }))
		expect( C2.getConstraint("SoftLocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(1);
		
		
	
	
	});	
	it("should listen to the grid torus property correctly", function() {
		let nbhobj = {}
		
		let pix = C.grid.p2i( [0,0] )
		
		// add pixel and its whole neighborhood
		nbhobj[pix] = true
		for( let n of C.grid.neighi(pix) ){
			nbhobj[n] = true
		}
		expect( C.getConstraint("SoftLocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(1);
		
		// now change torus to false in one or both dimensions while keeping the same nbhobj
		let C_notorus = new CPM.CPM( [100,100], {
			T : 20,
			torus : [false,false]
		  })
		 C_notorus.add( new CPM.SoftLocalConnectivityConstraint( {
			LAMBDA_CONNECTIVITY : [0,1000]
		 }))
		 expect( C_notorus.getConstraint("SoftLocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(4);
		
		let C_ytorus = new CPM.CPM( [100,100], {
			T : 20,
			torus : [false,true]
		  })
		 C_ytorus.add( new CPM.SoftLocalConnectivityConstraint( {
			LAMBDA_CONNECTIVITY : [0,1000]
		 }))
		 expect( C_ytorus.getConstraint("SoftLocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(2);
		 
		 let C_xtorus = new CPM.CPM( [100,100], {
			T : 20,
			torus : [true,false]
		  })
		 C_xtorus.add( new CPM.SoftLocalConnectivityConstraint( {
			LAMBDA_CONNECTIVITY : [0,1000]
		 }))
		 expect( C_xtorus.getConstraint("SoftLocalConnectivityConstraint").connectedComponentsOf(nbhobj).length).toEqual(2);

		
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

	it("#checkConnected should return 1", function() {
    	expect(C.getConstraint("SoftLocalConnectivityConstraint").checkConnected( tgt_i, src_type, tgt_type ) ).toEqual(1);
    })
    
    describe("and when LAMBDA_CONNECTIVITY for the tgt celltype", function() {
    	it("is non-zero, constraint should return positive deltaH", function() {
		  expect(C.getConstraint("SoftLocalConnectivityConstraint").deltaH( src_i, tgt_i, src_type, tgt_type ) > 0 ).toBeTruthy();
		}); 
		it("is zero, constraint should return deltaH zero", function() {
		  C.getConstraint("SoftLocalConnectivityConstraint").conf.LAMBDA_CONNECTIVITY[1]=0
		  expect(C.getConstraint("SoftLocalConnectivityConstraint").deltaH( src_i, tgt_i, src_type, tgt_type ) ).toEqual(0);
		}); 
    })

  });

 
});