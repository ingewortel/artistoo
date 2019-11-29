
var container, camera, scene, renderer, controls;
var plane, cube;
var mouse, raycaster, isShiftDown = false;

var rollOverMesh, rollOverMaterial;
var cubeGeo, cubeMaterial;

var objects = [];

var cellvoxels = [], stromavoxels = [], frcNet

var tcellOnColor = 0xFF0000, tcellOffColor = 0xaaaaaa,
	stromaColor = 0x00aa00, gridColor = 0x8c8c8c,
	cellBasicColor = 0x000000

var frameCaptureSocket

function makevoxel( voxset ){
	if( arguments.length == 0 ) voxset = cellvoxels
	var material = new THREE.MeshLambertMaterial(
		{ color: tcellOffColor, transparent: true, opacity : 0.6 } )
	var cube = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ),
		material );
	cube.position.x = 0;
	cube.position.y = 0;
	cube.position.z = 0;
	scene.add( cube )
	voxset.push( cube )
}

// Initialize a movie frame of w x h pixels
function init3d( w, h, C ){
	var i, j, p, draw_grid = 1, x2 = C.extents[0]/2,
		y2 = C.extents[1], z2 = C.extents[2]/2

	container = document.getElementById( 'stage' )

	camera = new THREE.PerspectiveCamera( 45, 1, 1, 10000 )
	camera.position.set( x2, y2, z2 + C.extents[0]*1.26 )

	camera.up.set( -1, 0, 0 )

	camera.lookAt( new THREE.Vector3( x2, y2, z2 ) )

	controls = new THREE.TrackballControls( camera, container )

	controls.rotateSpeed = 1.0
	controls.zoomSpeed = 1.2
	controls.panSpeed = 0.8

	controls.noZoom = false
	controls.noPan = false

	controls.staticMoving = true
	controls.dynamicDampingFactor = 0.3

	controls.target.set( x2, y2, z2 )

	controls.keys = [ 65, 83, 68 ];

	scene = new THREE.Scene();

	// grid

	if( draw_grid ){
		var size = C.extents[0], step = 10;
		var geometry = new THREE.Geometry();
		for ( i = 0; i <= size; i += step ) {
			geometry.vertices.push( new THREE.Vector3( 0, 0, i ) );
			geometry.vertices.push( new THREE.Vector3( size, 0, i ) );
			geometry.vertices.push( new THREE.Vector3( i, 0, 0 ) );
			geometry.vertices.push( new THREE.Vector3( i, 0, size ) );
		}
		var material = new THREE.LineBasicMaterial( { color: gridColor , opacity: 0.4, transparent: true } );
		var line = new THREE.LineSegments( geometry, material );
		scene.add( line );
		geometry = new THREE.Geometry();
		for ( i = 0; i <= size; i += step ) {
			geometry.vertices.push( new THREE.Vector3( 0, 0, i ) );
			geometry.vertices.push( new THREE.Vector3( 0, size, i ) );
			geometry.vertices.push( new THREE.Vector3( 0, i, 0 ) );
			geometry.vertices.push( new THREE.Vector3( 0, i, size ) );
		}
		material = new THREE.LineBasicMaterial( { color: gridColor, opacity: 0.4, transparent: true } );
		line = new THREE.LineSegments( geometry, material );
		scene.add( line );
		geometry = new THREE.Geometry();
		for ( i = 0; i <= size; i += step ) {
			geometry.vertices.push( new THREE.Vector3( 0, i, 0 ) );
			geometry.vertices.push( new THREE.Vector3( size, i, 0  ) );
			geometry.vertices.push( new THREE.Vector3( i, 0, 0 ) );
			geometry.vertices.push( new THREE.Vector3( i, size, 0 ) );
		}
		material = new THREE.LineBasicMaterial( { color: gridColor, opacity: 0.4, transparent: true } );
		line = new THREE.LineSegments( geometry, material );
		scene.add( line );
	}


	// Lights
	var ambientLight = new THREE.AmbientLight( 0x606060 );
	scene.add( ambientLight );

	var directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.set( .5, .5, 1 ).normalize();
	scene.add( directionalLight );

	controls && controls.update()

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	//renderer.setClearColor( 0x000000 );
	renderer.setClearColor( 0xFFFFFF );
	renderer.setPixelRatio( window.devicePixelRatio );
	//renderer.setSize( container.offsetWidth, container.offsetWidth );
	w = w|| container.offsetWidth
	h = h|| w
	renderer.setSize( w, h );
	camera.aspect = w / h;
	camera.updateProjectionMatrix();
	//renderer.setSize( 640, 640 );
	container.appendChild( renderer.domElement );
}

function render3d( max_cells ) {
	var i = 0, t, k
	if( arguments.length == 0 ) max_cells = Infinity

	var cp = C.cellBorderPixels()
	// var con = Cs.cellsOnNetwork()

	/*while( cellvoxels.length < cp.length  ){
		makevoxel()
	}*/

	for( let p of C.cellBorderPixels() ){
		// t = C.cellpixelstype[cp[i]]; k = C.cellKind(t)
		// if( t < max_cells ){
			p = p[0]
			
			if( cellvoxels.length < (i+1) ){ makevoxel() }
			cellvoxels[i].visible = true
			cellvoxels[i].position.x = p[0]
			cellvoxels[i].position.y = p[1]
			cellvoxels[i].position.z = p[2]
		// } else {
		// 	cellvoxels[i].visible = false
		// }
		if( k == 2 ){
			cellvoxels[i].material.color.setHex( 0x000000 )
			cellvoxels[i].material.opacity=1

		} else {
			cellvoxels[i].material.color.setHex( 0xFF0000 )
			cellvoxels[i].material.opacity=.2
		}

		cellvoxels[i].material.color.setHex( cellBasicColor )
		cellvoxels[i].material.opacity=0.15
		i++
	}

	//i=0
	
	for( ; i < cellvoxels.length ; i ++ ){
		cellvoxels[i].visible = false
	}

	renderer.render( scene, camera )
}

var ctx, canvas
