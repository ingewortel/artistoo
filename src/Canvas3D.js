
"use strict"

import GridBasedModel from "./models/GridBasedModel.js"
import Grid3D from "./grid/Grid3D.js"
import * as THREE from "three"
import TrackballControls from "three-trackballcontrols"
//import PixelsByCell from "./stats/PixelsByCell.js"
import BorderPixelsByCell from "./stats/BorderPixelsByCell.js"
import ActivityConstraint from "./hamiltonian/ActivityConstraint.js"
import ActivityMultiBackground from "./hamiltonian/ActivityMultiBackground.js"


class Canvas3D {
	
	constructor( C, options ){
		if( C instanceof GridBasedModel ){
			/**
			 * The underlying model that is drawn on the canvas.
			 * @type {GridBasedModel|CPM|CA}
			 */
			this.C = C
			this.grid = this.C.grid
			if( !( this.grid instanceof Grid3D ) ){
				throw("Canvas3D only works with 3D models with grid of class Grid3D!")
			}
			
			
			
			/** Grid size in each dimension, taken from the CPM or grid object to draw.
			@type {GridSize} each element is the grid size in that dimension in pixels */
			this.extents = C.extents
		} 
		
		this.step = options.step || 10 
		this.zoom =  options.zoom || 1
		this.drawgrid = options.drawgrid || true
		this.gridColor = options.gridColor || "AAAAAA"
		this.gridColor = this.getCol( this.gridColor )
		

		if( typeof document !== "undefined" ){
			/** @ignore */
			
			this.container = document.getElementById("stage")
			
		} else {
			throw("Canvas3D is currently only supported in the browser.")
		}
		
		this.scene = new THREE.Scene()
		this.drawvoxels = {}
		this.material = new THREE.MeshLambertMaterial( { color: this.getCol("000000"), transparent: true, opacity : 0.2 } )
		
		
		this.setupCamera()
		this.controls = new TrackballControls( this.camera, this.container )
		this.setup()

		
	}
	
	getCol( col ){
		col = "#" + col
		return new THREE.Color( col ).getHex()
	}
	
	setupCamera(){
	
		
		let camera = new THREE.PerspectiveCamera( 45, 1, 1, this.C.extents[2]*100 )
		
		// Place the camera at the x,y coordinates of the midpoint, and z coordinate slightly above the grid.
		let zpos = Math.floor( this.C.extents[2]*3)
		//camera.position = { x : this.C.extents[0]/2, y: this.C.extents[1]/2, z: zpos}
		camera.position.set( this.C.extents[0]/2, this.C.extents[1]/2,zpos  )
		//camera.up.set( -1, 0, 0 )
		
		// Viewing direction of the camera
		let gridMidpoint = [ this.C.extents[0]/2, this.C.extents[1]/2, this.C.extents[2]/2 ]
		camera.lookAt( new THREE.Vector3( gridMidpoint[0], gridMidpoint[1], gridMidpoint[2] ) )
		
		this.camera = camera
	
	}
	
	setupControls(){
	
		
		
		this.controls.rotateSpeed = 1.0
		this.controls.zoomSpeed = 1.2
		this.controls.panSpeed = 0.8

		this.controls.noZoom = false
		this.controls.noPan = false

		this.controls.staticMoving = true
		this.controls.dynamicDampingFactor = 0.3

		this.controls.target.set( this.C.midpoint[0], this.C.midpoint[1], this.C.midpoint[2] )

		this.controls.keys = [ 65, 83, 68 ]
		
	
	}
	
	
	drawGrid(){
		if( this.drawgrid ){
			
			let material = new THREE.LineBasicMaterial( { color: this.gridColor , opacity: 0.4, transparent: true } )
			
			// plane z = 0
			let geometry = new THREE.Geometry()
			for ( let x = 0; x <= this.C.extents[0]; x += this.step ) {
				geometry.vertices.push( new THREE.Vector3( x, 0, 0 ) )
				geometry.vertices.push( new THREE.Vector3( x, 0, this.C.extents[2] ) )
			}
			for( let z = 0; z <= this.C.extents[2]; z += this.step ){
				geometry.vertices.push( new THREE.Vector3( 0, 0, z ) )
				geometry.vertices.push( new THREE.Vector3( this.C.extents[0], 0, z ) )
			}
			let line = new THREE.LineSegments( geometry, material )
			this.scene.add( line )
			
			// plane x = 0 
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
			
			// plane y = 0 
			geometry = new THREE.Geometry()
			for ( let x = 0; x <= this.C.extents[1]; x += this.step ) {
				geometry.vertices.push( new THREE.Vector3( x, 0, 0 ) )
				geometry.vertices.push( new THREE.Vector3( x, 0, this.C.extents[2] ) )
			}
			for( let z = 0; z <= this.C.extents[2]; z += this.step ){
				geometry.vertices.push( new THREE.Vector3( 0, 0, z ) )
				geometry.vertices.push( new THREE.Vector3( this.C.extents[0], 0, z ) )
			}
			line = new THREE.LineSegments( geometry, material )
			this.scene.add( line )
		}

	}
	
	setupLights(){
		let ambientLight = new THREE.AmbientLight( 0x606060 )
		this.scene.add( ambientLight )

		let directionalLight = new THREE.DirectionalLight( 0xffffff )
		directionalLight.position.set( .5, .5, 1 ).normalize()
		this.scene.add( directionalLight )
	}
	
	setupRenderer(){
		this.renderer = new THREE.WebGLRenderer( { antialias: true } )
		this.renderer.setClearColor( 0xFFFFFF )
		//this.renderer.setPixelRatio( window.devicePixelRatio )
		let w =  this.C.extents[0]*this.zoom/2
		let h = this.C.extents[1]*this.zoom/2
		this.renderer.setSize( w, h )
		this.container.appendChild( this.renderer.domElement )
	}
	
	// Initialize a movie frame
	setup(){	
	
	
		//this.setupCamera()
		this.setupControls()
		this.drawGrid()
		this.setupLights()
		this.controls.update()
		this.setupRenderer()		
	}

	
	/* DRAWING FUNCTIONS ---------------------- */

	clear(){
		for( let i of Object.keys( this.drawvoxels ) ){
			this.drawvoxels[i].visible = false
		}
	}

	setVoxel( pos, color ){
		let i = this.C.grid.p2i( pos )
		if( !( i in this.drawvoxels ) ){
			let material = new THREE.MeshLambertMaterial( { color: this.getCol("000000"), transparent: true, opacity : 0.2 } )
			let cube = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ),material )
			cube.position.x = pos[0]
			cube.position.y = pos[1]
			cube.position.z = pos[2]
			this.scene.add(cube)
			this.drawvoxels[i] = cube
		}
		this.drawvoxels[i].visible = true
		this.drawvoxels[i].material.color.setHex( color )
		//this.drawvoxels[i].material.opacity=.2
		
	}

	drawCells( kind, col ){
		if( ! col ){
			col = "#000000"
		}
		let color
		if( typeof col == "string" ){
			color = this.getCol( col )
		}
		
		// We color only the borderpixels of 3D cells
		let cellborderpixelsbyid = this.C.getStat( BorderPixelsByCell )

		for( let cid of Object.keys( cellborderpixelsbyid ) ){
			if( kind < 0 || this.C.cellKind(cid) == kind ){
				if( typeof col == "function" ){
					color = this.getCol( col(cid) )
				}
				for( let cp of cellborderpixelsbyid[cid] ){
					this.setVoxel( cp, color )
				}
			}
		}
	}
	
	drawActivityValues( kind, A ){
		if( !A ){
			for( let c of this.C.soft_constraints ){
				if( c instanceof ActivityConstraint | c instanceof ActivityMultiBackground ){
					A = c; break
				}
			}
		}
		if( !A ){
			throw("Cannot find activity values to draw!")
		}
		// cst contains the pixel ids of all non-background/non-stroma cells in
		// the grid. 
		let pos, cellid, a
		// loop over all pixels belonging to non-background, non-stroma
		let color = {r:1,g:1,b:0}
		
		for( let x of this.C.cellPixels() ){
			pos = x[0]
			cellid = x[1]

			// For all pixels that belong to the current kind, compute
			// color based on activity values, convert to hex, and draw.
			if( this.C.cellKind(cellid) == kind ){
				a = A.pxact( this.C.grid.p2i( pos ) )/A.conf["MAX_ACT"][kind]
				if( a > 0 ){
					if( a > 0.5 ){
						color["r"] = 1
						color["g"]= (2-2*a)
					} else {
						color["r"] = (2*a)
						color["g"] = 1
					}
					
					let hexcolor = new THREE.Color( color.r, color.g, color.b ).getHex()
					this.setVoxel( pos, hexcolor )
				}
			}
		}
		
	}
	
	render(){
		this.renderer.render( this.scene, this.camera )
	}
}

export default Canvas3D

