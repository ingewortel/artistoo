describe("Grid", function() {
  var CPM = require('../../build/cpm-cjs.js');
  var grid2d, grid3d;

  beforeEach(function() {
    grid2d = new CPM.Grid2D( [100,100] );
    grid3d = new CPM.Grid3D( [100,100,100 ] );
  });

/* Checking errors thrown by the constructor*/
  it("should throw an error when torus is specified for an incorrect number of dimensions", function() {
  	expect(function() {
        let grid = new CPM.Grid2D( [100,100], [true] );
    }).toThrow("Torus should be specified for each dimension, or not at all!");
    expect(function() {
        let grid = new CPM.Grid2D( [100,100], true );
    }).toThrow("Torus should be specified for each dimension, or not at all!");
    expect(function() {
        let grid = new CPM.Grid2D( [100,100], [true,true,true] );
    }).toThrow("Torus should be specified for each dimension, or not at all!");
    expect(function() {
        let grid = new CPM.Grid3D( [100,100,100], [true,true] );
    }).toThrow("Torus should be specified for each dimension, or not at all!");
  });

/* Checking properties set by the constructor*/
  it("should have a specified size in each dimension", function() {
    expect(grid2d.ndim).toEqual(grid2d.extents.length);
    expect(grid3d.ndim).toEqual(grid3d.extents.length);
  });
  
  it("should have a specified torus in each dimension", function() {
    expect(grid2d.ndim).toEqual(grid2d.torus.length);
    expect(grid3d.ndim).toEqual(grid3d.torus.length);
  });
  
  it("should by default have torus = true in each dimension", function(){
  	for( let i = 0; i < grid2d.ndim; i++ ){
  		expect( grid2d.torus[i] = true )
  	}
  	for( let i = 0; i < grid3d.ndim; i++ ){
  		expect( grid3d.torus[i] = true )
  	}
  });
  
  it("should be able to have different torus settings for each dimension", function(){
  	let grid = new CPM.Grid2D( [100,100], torus = [true,false] )
  	expect( grid.torus[0]).toBe(true);
  	expect( grid.torus[1]).toBe(false);
  })
  
  it("should be able to have a different size in each dimension", function(){
  	let grid = new CPM.Grid2D( [100,300] )
  	expect( grid.extents[0]).not.toEqual(grid.extents[1]);
  })
  
  it("should have a midpoint at the correct position", function(){
  	expect( grid2d.midpoint.length).toEqual(2);
  	expect( grid3d.midpoint.length).toEqual(3);
  	
  	grid2d = new CPM.Grid2D( [101,101] );
	expect( ( grid2d.midpoint[0] - grid2d.extents[0]/2 ) <= 1 ).toBe(true);
	expect( ( grid2d.midpoint[1] - grid2d.extents[1]/2 ) <= 1 ).toBe(true);
  	expect( ( grid3d.midpoint[2] - grid3d.extents[2]/2 ) <= 1 ).toBe(true);
  });

 
});
