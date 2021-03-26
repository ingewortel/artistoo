
"use strict"

import GridBasedModel from "./models/GridBasedModel.js"
import CPM from "./models/CPM.js"
import Grid2D from "./grid/Grid2D.js"
import CoarseGrid from "./grid/CoarseGrid.js"
import PixelsByCell from "./stats/PixelsByCell.js"
import ActivityConstraint from "./hamiltonian/ActivityConstraint.js"
import ActivityMultiBackground from "./hamiltonian/ActivityMultiBackground.js"

/**
 * Class for taking a CPM grid and displaying it in either browser or with
 *  nodejs.
 * Note: when using this class from outside the module, you don't need to import
 *  it separately but can access it from CPM.Canvas. */
class Canvas {
	/** The Canvas constructor accepts a CPM object C or a Grid2D object.
	@param {GridBasedModel|Grid2D|CoarseGrid} C - the object to draw, which must
	 be an object of class {@link GridBasedModel} (or its subclasses {@link CPM}
	 and {@link CA}), or a 2D grid ({@link Grid2D} or {@link CoarseGrid}).
	 Drawing of other grids is currently not supported.
	@param {object} [options = {}] - Configuration settings
	@param {number} [options.zoom = 1]- positive number specifying the zoom
	 level to draw with.
	@param {number[]} [options.wrap = [0,0,0]] - if nonzero: 'wrap' the grid to
	 these dimensions; eg a pixel with x coordinate 201 and wrap[0] = 200 is
	 displayed at x = 1.
	@param {string} [options.parentElement = document.body] - the element on
	 the html page where the canvas will be appended.

	@example <caption>A CPM with Canvas</caption>
	* let CPM = require( "path/to/build" )
	*
	* // Create a CPM, corresponding Canvas and GridManipulator
	* // (Use CPM. prefix from outside the module)
	* let C = new CPM.CPM( [200,200], {
	* 	T : 20,
	* 	J : [[0,20][20,10]],
	* 	V:[0,500],
	* 	LAMBDA_V:[0,5]
	* } )
	* let Cim = new CPM.Canvas( C, {zoom:2} )
	* let gm = new CPM.GridManipulator( C )
	*
	* // Seed a cell at [x=100,y=100] and run 100 MCS.
	* gm.seedCellAt( 1, [100,100] )
	* for( let t = 0; t < 100; t++ ){
	* 	C.timeStep()
	* }
	*
	* // Draw the cell and save an image
	* Cim.drawCells( 1, "FF0000" )			// draw cells of CellKind 1 in red
	* Cim.writePNG( "my-cell-t100.png" )
	*/
	constructor( C, options ){
		if( C instanceof GridBasedModel ){
			/**
			 * The underlying model that is drawn on the canvas.
			 * @type {GridBasedModel|CPM|CA}
			 */
			this.C = C
			/**
			 * The underlying grid that is drawn on the canvas.
			 * @type {Grid2D|CoarseGrid}
			 */
			this.grid = this.C.grid

			/** Grid size in each dimension, taken from the CPM or grid object
			 * to draw.
			 * @type {GridSize} each element is the grid size in that dimension
			 * in pixels */
			this.extents = C.extents
		} else if( C instanceof Grid2D  ||  C instanceof CoarseGrid ){

			this.grid = C
			this.extents = C.extents
		}
		/** Zoom level to draw the canvas with, set to options.zoom or its
		 * default value 1.
		 * @type {number}*/
		this.zoom = (options && options.zoom) || 1
		/** if nonzero: 'wrap' the grid to these dimensions; eg a pixel with x
		 * coordinate 201 and wrap[0] = 200 is displayed at x = 1.
		 * @type {number[]} */
		this.wrap = (options && options.wrap) || [0,0,0]

		/** Width of the canvas in pixels (in its unzoomed state)
		 * @type {number}*/
		this.width = this.wrap[0]
		/** Height of the canvas in pixels (in its unzoomed state)
		 * @type {number}*/
		this.height = this.wrap[1]

		if( this.width === 0 || this.extents[0] < this.width ){
			this.width = this.extents[0]
		}
		if( this.height === 0 || this.extents[1] < this.height ){
			this.height = this.extents[1]
		}

		if( typeof document !== "undefined" ){
			/** @ignore */
			this.el = document.createElement("canvas")
			this.el.width = this.width*this.zoom
			this.el.height = this.height*this.zoom//extents[1]*this.zoom
			let parent_element = (options && options.parentElement) || document.body
			parent_element.appendChild( this.el )
		} else {
			const {createCanvas} = require("canvas")
			/** @ignore */
			this.el = createCanvas( this.width*this.zoom,
				this.height*this.zoom )
			/** @ignore */
			this.fs = require("fs")
		}

		/** @ignore */
		this.ctx = this.el.getContext("2d")
		this.ctx.lineWidth = .2
		this.ctx.lineCap="butt"
	}

	/** Give the canvas element an ID supplied as argument. Useful for building
	 * an HTML page where you want to get this canvas by its ID.
	 * @param {string} idString - the name to give the canvas element.
	 * */
	setCanvasId( idString ){
		this.el.id = idString
	}


	/* Several internal helper functions (used by drawing functions below) : */

	/** @private
	 * @ignore*/
	pxf( p ){
		this.ctx.fillRect( this.zoom*p[0], this.zoom*p[1], this.zoom, this.zoom )
	}

	/** @private
	 * @ignore */
	pxfi( p, alpha=1 ){
		const dy = this.zoom*this.width
		const off = (this.zoom*p[1]*dy + this.zoom*p[0])*4
		for( let i = 0 ; i < this.zoom*4 ; i += 4 ){
			for( let j = 0 ; j < this.zoom*dy*4 ; j += dy*4 ){
				this.px[i+j+off] = this.col_r
				this.px[i+j+off + 1] = this.col_g
				this.px[i+j+off + 2] = this.col_b
				this.px[i+j+off + 3] = alpha*255
			}
		}
	}

	/** @private
	 * @ignore */
	pxfir( p ){
		const dy = this.zoom*this.width
		const off = (p[1]*dy + p[0])*4
		this.px[off] = this.col_r
		this.px[off + 1] = this.col_g
		this.px[off + 2] = this.col_b
		this.px[off + 3] = 255
	}

	/** @private
	 * @ignore*/
	getImageData(){
		/** @ignore */
		this.image_data = this.ctx.getImageData(0, 0, this.width*this.zoom, this.height*this.zoom)
		/** @ignore */
		this.px = this.image_data.data
	}

	/** @private
	 * @ignore*/
	putImageData(){
		this.ctx.putImageData(this.image_data, 0, 0)
	}

	/** @private
	 * @ignore*/
	pxfnozoom( p ){
		this.ctx.fillRect( this.zoom*p[0], this.zoom*p[1], 1, 1 )
	}

	/** draw a line left (l), right (r), down (d), or up (u) of pixel p
	 * @private
	 * @ignore */
	pxdrawl( p ){
		for( let i = this.zoom*p[1] ; i < this.zoom*(p[1]+1) ; i ++ ){
			this.pxfir( [this.zoom*p[0],i] )
		}
	}

	/** @private
	 * @ignore */
	pxdrawr( p ){
		for( let i = this.zoom*p[1] ; i < this.zoom*(p[1]+1) ; i ++ ){
			this.pxfir( [this.zoom*(p[0]+1),i] )
		}
	}
	/** @private
	 * @ignore */
	pxdrawd( p ){
		for( let i = this.zoom*p[0] ; i < this.zoom*(p[0]+1) ; i ++ ){
			this.pxfir( [i,this.zoom*(p[1]+1)] )
		}
	}
	/** @private
	 * @ignore */
	pxdrawu( p ){
		for( let i = this.zoom*p[0] ; i < this.zoom*(p[0]+1) ; i ++ ){
			this.pxfir( [i,this.zoom*p[1]] )
		}
	}

	/** For easier color naming
	 * @private
	 * @ignore */
	col( hex ){
		this.ctx.fillStyle="#"+hex
		/** @ignore */
		this.col_r = parseInt( hex.substr(0,2), 16 )
		/** @ignore */
		this.col_g = parseInt( hex.substr(2,2), 16 )
		/** @ignore */
		this.col_b = parseInt( hex.substr(4,2), 16 )
	}

	/** Hex code string for a color.
	 * @typedef {string} HexColor*/

	/** Color the whole grid in color [col], or in black if no argument is given.
	 * @param {HexColor} [col = "000000"] -hex code for the color to use, defaults to black.
	 */
	clear( col ){
		col = col || "000000"
		this.ctx.fillStyle="#"+col
		this.ctx.fillRect( 0,0, this.el.width, this.el.height )
	}

	/** Rendering context of canvas.
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
	 * @typedef {object} CanvasRenderingContext2D
	 * */

	/** Return the current drawing context.
	 * @return {CanvasRenderingContext2D} current drawing context on the canvas.
	 * */
	context(){
		return this.ctx
	}
	/** @private
	 * @ignore */
	p2pdraw( p ){
		for( let dim = 0; dim < p.length; dim++ ){
			if( this.wrap[dim] !== 0 ){
				p[dim] = p[dim] % this.wrap[dim]
			}
		}
		return p
	}

	/* DRAWING FUNCTIONS ---------------------- */

	/** Use to color a grid according to its values. High values are colored in
	 * a brighter color.
	 * @param {Grid2D|CoarseGrid} [cc] - the grid to draw values for. If left
	 * unspecified, the grid that was originally supplied to the Canvas
	 * constructor is used.
	 * @param {HexColor} [col = "0000FF"] - the color to draw the chemokine in.
	 * */
	drawField( cc, col = "0000FF" ){
		if( !cc ){
			cc = this.grid
		}
		this.col(col)
		let maxval = 0
		for( let i = 0 ; i < cc.extents[0] ; i ++ ){
			for( let j = 0 ; j < cc.extents[1] ; j ++ ){
				let p = Math.log(.1+cc.pixt([i,j]))
				if( maxval < p ){
					maxval = p
				}
			}
		}
		this.getImageData()
		//this.col_g = 0
		//this.col_b = 0
		for( let i = 0 ; i < cc.extents[0] ; i ++ ){
			for( let j = 0 ; j < cc.extents[1] ; j ++ ){
				//let colval = 255*(Math.log(.1+cc.pixt( [i,j] ))/maxval)
				let alpha = (Math.log(.1+cc.pixt( [i,j] ))/maxval)
				//this.col_r = colval
				//this.col_g = colval
				this.pxfi([i,j], alpha)
			}
		}
		this.putImageData()
		this.ctx.globalAlpha = 1
	}
	/** Use to color a grid according to its values. High values are colored in
	 * a brighter color.
	 * @param {Grid2D|CoarseGrid} [cc] - the grid to draw values for. If left
	 * unspecified, the grid that was originally supplied to the Canvas
	 * constructor is used.
	 * @param {number} [nsteps = 10] - the number of contour lines to draw.
	 * Contour lines are evenly spaced between the min and max log10 of the
	 * chemokine.
	 * @param {HexColor} [col = "FFFF00"] - the color to draw contours with.
	 * */
	drawFieldContour( cc, nsteps = 10, col = "FFFF00" ){
		if( !cc ){
			cc = this.grid
		}
		this.col(col)
		let maxval = 0
		let minval = Math.log(0.1)
		for( let i = 0 ; i < cc.extents[0] ; i ++ ){
			for( let j = 0 ; j < cc.extents[1] ; j ++ ){
				let p = Math.log(.1+cc.pixt([i,j]))
				if( maxval < p ){
					maxval = p
				}
				if( minval > p ){
					minval = p
				}
			}
		}


		this.getImageData()
		//this.col_g = 0
		//this.col_b = 0
		//this.col_r = 255

		let step = (maxval-minval)/nsteps
		for( let v = minval; v < maxval; v+= step ){

			for( let i = 0 ; i < cc.extents[0] ; i ++ ){
				for( let j = 0 ; j < cc.extents[1] ; j ++ ){

					let pixelval = Math.log( .1 + cc.pixt( [i,j] ) )
					if( Math.abs( v - pixelval ) < 0.05*maxval ){
						let below = false, above = false
						for( let n of this.grid.neighNeumanni( this.grid.p2i( [i,j] ) ) ){

							let nval = Math.log(0.1 + cc.pixt(this.grid.i2p(n)) )
							if( nval < v ){
								below = true
							}
							if( nval >= v ){
								above = true
							}
							if( above && below ){
								//this.col_r = 150*((v-minval)/(maxval-minval)) + 105
								let alpha = 0.7*((v-minval)/(maxval-minval)) + 0.3
								this.pxfi( [i,j], alpha )
								break
							}
						}
					}



				}
			}

		}





		this.putImageData()
	}



	/** @desc Method for drawing the cell borders for a given cellkind in the
	 * color specified in "col" (hex format). This function draws a line around
	 * the cell (rather than coloring the outer pixels). If [kind] is negative,
	 * simply draw all borders.
	 *
	 * See {@link drawOnCellBorders} to color the outer pixels of the cell.
	 *
	 * @param {CellKind} kind - Integer specifying the cellkind to color.
	 * Should be a positive integer as 0 is reserved for the background.
	 * @param {HexColor}  [col = "000000"] - hex code for the color to use,
	 * defaults to black.
   */
	drawCellBorders( kind, col ){

		let isCPM = ( this.C instanceof CPM ), C = this.C
		let getBorderPixels = function*(){
			for( let p of C.cellBorderPixels() ){
				yield p
			}
		}
		if( !isCPM ){
			// in a non-cpm, simply draw borders of all pixels
			getBorderPixels = function*(){
				for( let p of C.grid.pixels() ){
					yield p
				}
			}
		}



		col = col || "000000"
		let pc, pu, pd, pl, pr, pdraw
		this.col( col )
		this.getImageData()
		// cst contains indices of pixels at the border of cells
		for( let x of getBorderPixels() ){

			let pKind
			if( isCPM ){
				pKind = this.C.cellKind( x[1] )
			} else {
				pKind = x[1]
			}

			let p = x[0]
			if( kind < 0 || pKind === kind ){
				pdraw = this.p2pdraw( p )

				pc = this.C.pixt( [p[0],p[1]] )
				pr = this.C.pixt( [p[0]+1,p[1]] )
				pl = this.C.pixt( [p[0]-1,p[1]] )
				pd = this.C.pixt( [p[0],p[1]+1] )
				pu = this.C.pixt( [p[0],p[1]-1] )

				if( pc !== pl  ){
					this.pxdrawl( pdraw )
				}
				if( pc !== pr ){
					this.pxdrawr( pdraw )
				}
				if( pc !== pd ){
					this.pxdrawd( pdraw )
				}
				if( pc !== pu ){
					this.pxdrawu( pdraw )
				}
			}

		}
		this.putImageData()
	}

	/** Use to show activity values of the act model using a color gradient, for
	 * cells in the grid of cellkind "kind". The constraint holding the activity
	 * values can be supplied as an argument. Otherwise, the current CPM is
	 * searched for the first registered activity constraint and that is then
	 * used.
	 *
	 * @param {CellKind} kind - Integer specifying the cellkind to color.
	 * If negative, draw values for all cellkinds.
	 * @param {ActivityConstraint|ActivityMultiBackground} [A] - the constraint
	 * object to use, which must be of class {@link ActivityConstraint} or
	 * {@link ActivityMultiBackground} If left unspecified, this is the first
	 * instance of an ActivityConstraint or ActivityMultiBackground object found
	 * in the soft_constraints of the attached CPM.
	 * @param {Function} [col] - a function that returns a color for a number
	 * in [0,1] as an array of red/green/blue values, for example, [255,0,0]
	 * would be the color red. If unspecified, a green-to-red heatmap is used.
	 * */
	drawActivityValues( kind, A, col ){
		if( !( this.C instanceof CPM) ){
			throw("You cannot use the drawActivityValues method on a non-CPM model!")
		}
		if( !A ){
			for( let c of this.C.soft_constraints ){
				if( c instanceof ActivityConstraint || c instanceof ActivityMultiBackground ){
					A = c; break
				}
			}
		}
		if( !A ){
			throw("Cannot find activity values to draw!")
		}
		if( !col ){
			col = function(a){
				let r = [0,0,0]
				if( a > 0.5 ){
					r[0] = 255
					r[1] = (2-2*a)*255
				} else {
					r[0] = (2*a)*255
					r[1] = 255
				}
				return r
			}
		}
		// cst contains the pixel ids of all non-background/non-stroma cells in
		// the grid. 
		let ii, sigma, a, k
		// loop over all pixels belonging to non-background, non-stroma
		this.col("FF0000")
		this.getImageData()
		this.col_b = 0
		//this.col_g = 0
		for( let x of this.C.cellPixels() ){
			ii = x[0]
			sigma = x[1]
			k = this.C.cellKind(sigma)

			// For all pixels that belong to the current kind, compute
			// color based on activity values, convert to hex, and draw.
			if( ( kind < 0 && A.conf["MAX_ACT"][k] > 0 ) || k === kind ){
				a = A.pxact( this.C.grid.p2i( ii ) )/A.conf["MAX_ACT"][k]
				if( a > 0 ){
					if( a > 0.5 ){
						this.col_r = 255
						this.col_g = (2-2*a)*255
					} else {
						this.col_r = (2*a)*255
						this.col_g = 255
					}
					let r = col( a )
					this.col_r = r[0]
					this.col_g = r[1]
					this.col_b = r[2]
					this.pxfi( ii )
				}
			}
		}
		this.putImageData()
	}

	/** Color outer pixel of all cells of kind [kind] in col [col].
	 * See {@link drawCellBorders} to actually draw around the cell rather than
	 * coloring the outer pixels. If you're using this model on a CA,
	 * {@link CellKind} is not defined and the parameter "kind" is instead
	 * interpreted as {@link CellId}.
	 *
	 * @param {CellKind} kind - Integer specifying the cellkind to color.
	 * Should be a positive integer as 0 is reserved for the background.
	 * @param {HexColor|function} col - Optional: hex code for the color to use.
	 * If left unspecified, it gets the default value of black ("000000").
	 * col can also be a function that returns a hex value for a cell id. */
	drawOnCellBorders( kind, col ){
		col = col || "000000"

		let isCPM = ( this.C instanceof CPM ), C = this.C
		let getBorderPixels = function*(){
			for( let p of C.cellBorderPixels() ){
				yield p
			}
		}
		if( !isCPM ){
			// in a non-cpm, simply draw borders of all pixels
			getBorderPixels = this.C.pixels
		}

		this.getImageData()
		this.col( col )
		for( let p of getBorderPixels() ){

			let pKind
			if( isCPM ){
				pKind = this.C.cellKind( p[1] )
			} else {
				pKind = p[1]
			}

			if( kind < 0 || pKind === kind ){
				if( typeof col == "function" ){
					this.col( col(p[1]) )
				}
				this.pxfi( p[0] )
			}
		}
		this.putImageData()
	}

	/**
	 * Draw all cells of cellid "id" in color col (hex). Note that this function
	 * also works for CA. However, it has not yet been optimised and is very slow
	 * if called many times. For multicellular CPMs, you are better off using
	 * {@link drawCells} with an appropriate coloring function (see that method's
	 * documentation).
	 *
	 * @param {CellId} id - id of the cell to color.
	 * @param {HexColor} col - Optional: hex code for the color to use.
	 * If left unspecified, it gets the default value of black ("000000").
	 *
	 * */
	drawCellsOfId( id, col ){
		if( !col ){
			col = "000000"
		}
		if( typeof col == "string" ){
			this.col(col)
		}


		// Use the pixels() iterator to get the id of all non-background pixels.
		this.getImageData()
		// this currently just loops over all pixels on the grid, which makes it slow
		// if you repeat this process for many cells. Optimise later.
		for( let x of this.C.pixels() ){
			if( x[1] === id ){

				this.pxfi( x[0] )

			}
		}

		this.putImageData()
	}

	/** Draw all cells of cellkind "kind" in color col (hex). This method is
	 * meant for models of class {@link CPM}, where the {@link CellKind} is
	 * defined. If you apply this method on a {@link CA} model, this method
	 * will internally call {@link drawCellsOfId} by just supplying the
	 * "kind" parameter as {@link CellId}.
	 *
	 * @param {CellKind} kind - Integer specifying the cellkind to color.
	 * Should be a positive integer as 0 is reserved for the background.
	 * @param {HexColor|function} col - Optional: hex code for the color to use.
	 * If left unspecified, it gets the default value of black ("000000").
	 * col can also be a function that returns a hex value for a cell id, but
	 * this is only supported for CPMs.
	 *
	 * @example <caption>Drawing cells by "kind" or "ID"</caption>
	 *
	 * // Draw all cells of kind 1 in red
	 * Cim.drawCells( 1, "FF0000" )
	 *
	 * // To color cells by their ID instead of their kind, we can parse
	 * // a function to 'col' instead of a string. The example function
	 * // below reads the color for each cellID from an object of keys (ids)
	 * // and values (colors):
	 * Cim.colFun = function( cid ){
	 *
	 * 	// First time function is called, attach an empty object 'cellColorMap' to
	 * 	// simulation object; this tracks the color for each cellID on the grid.
	 * 	if( !Cim.hasOwnProperty( "cellColorMap" ) ){
	 * 		Cim.cellColorMap = {}
	 * 	}
	 *
	 * 	// Check if the current cellID already has a color, otherwise put a random
	 * 	// color in the cellColorMap object
	 * 	if( !Cim.cellColorMap.hasOwnProperty(cid) ){
	 * 		// this cell gets a random color
	 * 		Cim.cellColorMap[cid] = Math.floor(Math.random()*16777215).toString(16).toUpperCase()
	 * 	}
	 *
	 * 	// now return the color assigned to this cellID.
	 * 	return Cim.cellColorMap[cid]
	 * }
	 * // Now use this function to draw the cells, colored by their ID
	 * Cim.drawCells( 1, Cim.colFun )
	 */
	drawCells( kind, col ){
		if( !( this.C instanceof CPM ) ){
			if( typeof col != "string" ){
				throw("If you use the drawCells method on a CA, you cannot " +
					"specify the color as function! Please specify a single string.")
			}
			this.drawCellsOfId( kind, col )
		} else {
			if (!col) {
				col = "000000"
			}
			if (typeof col == "string") {
				this.col(col)
			}
			// Object contains all pixels belonging to non-background,
			// non-stroma cells.
			let cellpixelsbyid = this.C.getStat(PixelsByCell)

			this.getImageData()
			for (let cid of Object.keys(cellpixelsbyid)) {
				if (kind < 0 || this.C.cellKind(cid) === kind) {
					if (typeof col == "function") {
						this.col(col(cid))
					}
					for (let cp of cellpixelsbyid[cid]) {
						this.pxfi(cp)
					}
				}
			}
			this.putImageData()
		}
	}

	/** General drawing function to draw all pixels in a supplied set in a given
	 * color.
	 * @param {ArrayCoordinate[]} pixelarray - an array of
	 * {@link ArrayCoordinate}s of pixels to color.
	 * @param {HexColor|function} col - Optional: hex code for the color to use.
	 * If left unspecified, it gets the default value of black ("000000").
	 * col can also be a function that returns a hex value for a cell id.
	 * */
	drawPixelSet( pixelarray, col ){
		if( ! col ){
			col = "000000"
		}
		if( typeof col == "string" ){
			this.col(col)
		}
		this.getImageData()
		for( let p of pixelarray ){
			this.pxfi( p )
		}
		this.putImageData()
	}

	/** Draw grid to the png file "fname".
	 *
	 * @param {string} fname Path to the file to write. Any parent folders in
	 * this path must already exist.*/
	writePNG( fname ){

		try {
			this.fs.writeFileSync(fname, this.el.toBuffer())
		}
		catch (err) {
			if (err.code === "ENOENT") {
				let message = "Canvas.writePNG: cannot write to file " + fname +
					", are you sure the directory exists?"
				throw(message)
			}
		}

	}
}

export default Canvas

