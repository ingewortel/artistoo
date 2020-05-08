/* Experimental class to visualize 3D CPM cells using the Threejs library.
 * Some implementation notes:
 * 	- 	At this point, we render only the cell's border voxels ( voxels = pixels in 3D )
 *  - 	We use a dynamic array called this.drawvoxels, which will contain a cube for 
 * 		each voxel currently rendered on the grid. These voxels are in principle saved 
 * 		for the next rendering step, where we only change their properties (visibility, 
 * 		position, color, and opacity). This is faster than making new voxels every step. 
 * 	- 	Voxels are dynamically added to this array when the cell requires more voxels
 * 		than are currently in the array. 
 *	-	If the array has more voxels than the cell does, we set all the non-used voxels 
 * 		at the end of the array to invisible after having repositioned/re-colored all 
 *		voxels we need (this happens in the this.render() method.)
 *	-	Once a voxel has been assigned to a position on the grid for a rendering step,
 *		the lookup table this.voxellookup will contain an entry  with 
 *		[key = indexcoordinate of position on grid, value = position of the voxel in
 *		this.drawvoxels]. This way, if a voxel has been drawn once in the current step,
 *		it can be overwritten by another drawing method quickly (e.g. when we first draw
 *		a cell in some color and then add its activity values on top. )
 *	-	Before the next step, the this.clear() method must be called to reset the
 *		"this.voxellookup" table and the "this.voxelcounter". 
 */

/* globals THREE */
 /* assumes that THREE refers to a three.js object. We used the version available at:
 * https://cdnjs.cloudflare.com/ajax/libs/three.js/102/three.min.js */
class Canvas3D {
	
	constructor( C, options ){
		// Check that the supplied C is a 3D CPM:
		if( C instanceof CPM.GridBasedModel ){
			/**
			 * The underlying model that is drawn on the canvas.
			 * @type {GridBasedModel|CPM|CA}
			 */
			this.C = C
			this.grid = this.C.grid
			if( !( this.grid instanceof CPM.Grid3D ) ){
				throw("Canvas3D only works with 3D models with grid of class Grid3D!")
			}
		
			/** Grid size in each dimension, taken from the CPM or grid object to draw.
			@type {GridSize} each element is the grid size in that dimension in pixels */
			this.extents = C.extents
		} else {
			throw("Canvas3D currently only supports GridBasedModels with a 3D grid!")
		}
		
		// Append the 'canvas' to the correct div on the HTML page.
		// Canvas3D currently only supports browser mode, so throw an error
		// when this class is called from nodejs.
		if( typeof document !== "undefined" ){
			/** @ignore */
			this.container = document.getElementById("stage")
		} else {
			throw("Canvas3D is currently only supported in the browser.")
		}
		
		// Options for drawing the background grid
		this.step = options.step || 10 
		this.drawgrid = options["drawgrid"] || true // false
		this.gridColor = options.gridColor || "AAAAAA"
		this.gridColor = this.getCol( this.gridColor )
		this.gridComponents = []
		
		// renderer settings
		this.w = 700 // || this.container.offsetWidth
		this.h = this.w
		
		this.canvasColor = options["CANVASCOLOR"] || this.getCol( "FFFFFF" )
		
		
		// Elements tracking the voxels currently rendered on the grid; see the
		// implementation notes on the top of this page for details.
		this.drawvoxels = []
		this.voxellookup = {}
		this.voxelcounter = 0
		
		// The default 'material' used for drawing the voxels.s
		this.material = new THREE.MeshLambertMaterial( { color: this.getCol("000000"), transparent: true } )
		
		// Create a scene, camera, controls, lighting, etc. 
		this.scene = new THREE.Scene()
		this.setupCamera()
		this.controls = new THREE.OrbitControls( this.camera, this.container )
		this.setup()
	}
	
	/* Convert a color string 'col' (wihtout the #) to the hex code used by Three js. */
	getCol( col ){
		col = "#" + col
		return new THREE.Color( col ).getHex()
	}
	
	
	/* Set up a camera in the current stage. */
	setupCamera(){
	
		let camera = new THREE.PerspectiveCamera( 45, 1, 1, 10000 )
		let xmid = this.C.midpoint[0], ymid =this.C.midpoint[1], zmid = this.C.midpoint[2]
		
		// Place the camera at the x,y coordinates of the midpoint, and z coordinate slightly above the grid.
		let zpos = Math.floor( this.C.extents[2]*2.5)
		camera.position.set( xmid, ymid , zpos )
		camera.up.set( -1, 0, 0 )
		
		// Viewing direction of the camera: towards the midpoint by default.
		camera.lookAt( new THREE.Vector3( xmid, ymid, zmid ) )
		this.camera = camera
		
		this.camera.aspect = this.w/this.h	
		this.camera.updateProjectionMatrix()
	}
	
	
	/** Set up the controls for the interactive 3D space (allowing users to rotate, zoom,
	  * etc). For details, see the documentation of threejs :
	  * https://threejs.org/docs/#examples/en/controls/TrackballControls 
	  */
	setupControls( conf = {} ){
	
		this.controls.rotateSpeed = conf.rotateSpeed || 2.0
		this.controls.zoomSpeed = conf.zoomSpeed || 1.2
		this.controls.panSpeed = 0.8 || conf.panSpeed || 0.8
		
		this.controls.staticMoving = true
		this.controls.dynamicDampingFactor=0.2
		
		this.controls.noZoom = false
		this.controls.noPan = false
		this.controls.noRotate = false
		
		const target = conf.target || this.C.midpoint
		this.controls.target.set(target[0], target[1], target[2] )
		this.controls.keys = [ 65, 83, 68 ]
	
	}
	
	/* Draw a background grid indicating the boundaries of the grid. 
	 * this is controlled by this.drawgrid, and is drawn as lines in this.gridColor. */
	drawGrid(){
		if( this.drawgrid ){
			if( this.gridComponents.length == 0 ){
				let material = new THREE.LineBasicMaterial( { 
					color: this.gridColor , opacity: 0.4, transparent: true 
				} )
			
				// Draw the plane at z = 0
				let geometry = new THREE.Geometry()
				for ( let x = 0; x <= this.C.extents[0]; x += this.step ) {
					geometry.vertices.push( new THREE.Vector3( x, 0, 0 ) )
					geometry.vertices.push( new THREE.Vector3( x, this.C.extents[1], 0 ) )
				}
				for( let y = 0; y <= this.C.extents[1]; y += this.step ){
					geometry.vertices.push( new THREE.Vector3( 0, y, 0 ) )
					geometry.vertices.push( new THREE.Vector3( this.C.extents[0], y, 0 ) )
				}
				let line = new THREE.LineSegments( geometry, material )
				this.scene.add( line )
				this.gridComponents.push( line )
			
				// Draw the plane at x = 0 
				geometry = new THREE.Geometry()
				for ( let y = 0; y <= this.C.extents[1]; y += this.step ) {
					geometry.vertices.push( new THREE.Vector3( 0, y, 0 ) )
					geometry.vertices.push( new THREE.Vector3( 0, y, this.C.extents[2] ) )
				}
				for( let z = 0; z <= this.C.extents[2]; z += this.step ){
					geometry.vertices.push( new THREE.Vector3( 0, 0, z ) )
					geometry.vertices.push( new THREE.Vector3( 0, this.C.extents[1], z ) )
				}
				line = new THREE.LineSegments( geometry, material )
				this.scene.add( line )
				this.gridComponents.push( line )
			
				// Draw the plane at y = 0 
				geometry = new THREE.Geometry()
				for ( let x = 0; x <= this.C.extents[0]; x += this.step ) {
					geometry.vertices.push( new THREE.Vector3( x, 0, 0 ) )
					geometry.vertices.push( new THREE.Vector3( x, 0, this.C.extents[2] ) )
				}
				for( let z = 0; z <= this.C.extents[2]; z += this.step ){
					geometry.vertices.push( new THREE.Vector3( 0, 0, z ) )
					geometry.vertices.push( new THREE.Vector3( this.C.extents[0], 0, z ) )
				}
				line = new THREE.LineSegments( geometry, material )
				this.scene.add( line )
				this.gridComponents.push( line )
			} else {
				for( let gc of this.gridComponents ){
					gc.visible = true
				}
			}
		} else {
			for( let gc of this.gridComponents ){
				gc.visible = false
			}
		}
		
		

	}
	
	/* Set up lights for the stage. */
	setupLights(){
		let ambientLight = new THREE.AmbientLight( 0x606060 )
		this.scene.add( ambientLight )

		let directionalLight = new THREE.DirectionalLight( 0xffffff )
		directionalLight.position.set( .5, .5, 1 ).normalize()
		this.scene.add( directionalLight )
	}
	
	/* Set up the renderer */
	setupRenderer(){
		this.renderer = new THREE.WebGLRenderer( { antialias: true } )
		this.renderer.setClearColor( this.canvasColor )
		this.renderer.setPixelRatio( window.devicePixelRatio )
		this.renderer.setSize( this.w, this.h )
		this.container.appendChild( this.renderer.domElement )
	}
	
	// Initialize a movie frame
	setup(){	
		this.setupControls()
		this.drawGrid()
		this.setupLights()
		this.controls.update()
		this.setupRenderer()		
	}

	
	/* DRAWING FUNCTIONS ---------------------- */

	/* Reset the voxel counter and lookup table (see implementation notes at the top
	 * of this page. )
	 */
	clear(){
		this.voxellookup = {}
		this.voxelcounter = 0
	}

	/* Create a new cube voxel and add it to the drawvoxels array. */
	newVoxel(){
		// Create a material and a cube using that material. Position, color, and opacity 
		// will be overwritten when this cube is actually rendered - for now we just 
		// create it and add it to the this.drawvoxels array.
		let material = new THREE.MeshLambertMaterial( { color: this.getCol("000000"), transparent: true } )
		let cube = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), material )
		cube.position.x = 0
		cube.position.y = 0
		cube.position.z = 0
		this.scene.add(cube)
		this.drawvoxels.push( cube )
	}

	/* Ensure the voxel at position [pos] on the grid is rendered with a color and opacity.
	 * This takes one of the cubes which is already present in this.drawvoxels, but not
	 * yet assigned to a position in the current rendering step (the this.voxellookup is
	 * used to determine this). If no unassigned voxels are left in this.drawvoxels, a
	 * new voxel is created.*/
	setVoxel( pos, color, opacity ){
		opacity = opacity || .2
		let i = this.C.grid.p2i( pos )
		if( ! ( i in this.voxellookup ) ){
			if( this.drawvoxels.length < (this.voxelcounter+1) ){ this.newVoxel() }
			this.voxellookup[i] = this.voxelcounter
			this.voxelcounter++
		}
		let voxi = this.voxellookup[i]
		this.drawvoxels[voxi].visible = true
		this.drawvoxels[voxi].material.color.setHex( color )
		this.drawvoxels[voxi].material.opacity=opacity
		this.drawvoxels[voxi].position.x = pos[0]
		this.drawvoxels[voxi].position.y = pos[1]
		this.drawvoxels[voxi].position.z = pos[2]
	}

	/* Draw all the border voxels of all cells of kind [kind] in color [col] (defaults
	 * to black) and at the given [opacity] (defaults to 0.2). */
	drawCells( kind, col, opacity ){
	
		opacity = opacity || 0.4
		if( ! col ){ col = "000000" }
		let color
		if( typeof col == "string" ){ color = this.getCol( col ) }
		
		// We color only the borderpixels of 3D cells
		let cellborderpixelsbyid = this.C.getStat( CPM.BorderPixelsByCell )

		for( let cid of Object.keys( cellborderpixelsbyid ) ){
			if( kind < 0 || this.C.cellKind(cid) == kind ){
				if( typeof col == "function" ){
					color = this.getCol( col(cid) )
				}
				for( let cp of cellborderpixelsbyid[cid] ){
					this.setVoxel( cp, color, opacity )
				}
			}
		}
	}
	
	/* Draw all the border voxels with non-zero activity of all cells of kind [kind] in 
	 * a color reflecting their current activity level at the given [opacity] 
	 * (defaults to 0.3). */
	drawActivityValues( kind, A, opacity = 0.4 ){
		if( !A ){
			for( let c of this.C.soft_constraints ){
				if( c instanceof CPM.ActivityConstraint | c instanceof CPM.ActivityMultiBackground ){
					A = c; break
				}
			}
		}
		if( !A ){
			throw("Cannot find activity values to draw!")
		}
		
		// loop over all pixels belonging to non-background, non-stroma
		let color = {r:1,g:1,b:0}
		let cellborderpixelsbyid = this.C.getStat( CPM.BorderPixelsByCell )
		for( let cellid of Object.keys( cellborderpixelsbyid ) ){
			if( kind < 0 || this.C.cellKind(cellid) == kind ){
				for( let pos of cellborderpixelsbyid[cellid] ){
				
					const a = A.pxact( this.C.grid.p2i( pos ) )/A.conf["MAX_ACT"][kind]
					if( a > 0 ){
						if( a > 0.5 ){
							color["r"] = 1
							color["g"]= (2-2*a)
						} else {
							color["r"] = (2*a)
							color["g"] = 1
						}
					
						let hexcolor = new THREE.Color( color.r, color.g, color.b ).getHex()
						this.setVoxel( pos, hexcolor, opacity )
					}
				}
			}
		}	
	}
	
	/* Render all voxels currently assigned to a position on the grid. All the 
	 * remaining voxels in this.drawvoxels are first set to invisible. 
	 */
	render(){
		for( ; this.voxelcounter < this.drawvoxels.length ; this.voxelcounter ++ ){
			this.drawvoxels[this.voxelcounter].visible = false
		}
		this.renderer.render( this.scene, this.camera )
	}
}

