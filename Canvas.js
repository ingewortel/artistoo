/** Class for taking a CPM grid and displaying it in either browser or with nodejs. */

"use strict"

// Constructor takes a CPM object C
function Canvas( C, options ){
	this.C = C
	this.zoom = (options && options.zoom) || 1

	this.wrap = (options && options.wrap) || [0,0,0]
	this.width = this.wrap[0]
	this.height = this.wrap[1]

	if( this.width == 0 || this.C.field_size.x < this.width ){
		this.width = this.C.field_size.x
	}
	if( this.height == 0 || this.C.field_size.y < this.height ){
		this.height = this.C.field_size.y
	}

	if( typeof document !== "undefined" ){
		this.el = document.createElement("canvas")
		this.el.width = this.width*this.zoom
		this.el.height = this.height*this.zoom//C.field_size.y*this.zoom
		var parent_element = (options && options.parentElement) || document.body
		parent_element.appendChild( this.el )
	} else {
		const {createCanvas} = require("canvas")
		this.el = createCanvas( this.width*this.zoom,
			this.height*this.zoom )
		this.fs = require("fs")
	}

	this.ctx = this.el.getContext("2d")
	this.ctx.lineWidth = .2
	this.ctx.lineCap="butt"
}


Canvas.prototype = {


	/* Several internal helper functions (used by drawing functions below) : */
	pxf : function( p ){
		this.ctx.fillRect( this.zoom*p[0], this.zoom*p[1], this.zoom, this.zoom )
	},

	pxfnozoom : function( p ){
		this.ctx.fillRect( this.zoom*p[0], this.zoom*p[1], 1, 1 )
	},
	/* draw a line left (l), right (r), down (d), or up (u) of pixel p */
	pxdrawl : function( p ){
		this.ctx.fillRect( this.zoom*p[0], this.zoom*p[1], 1, this.zoom )
	},
	pxdrawr : function( p ){
		this.ctx.fillRect( this.zoom*(p[0]+1), this.zoom*p[1], 1, this.zoom )
	},
	pxdrawd : function( p ){
		this.ctx.fillRect( this.zoom*p[0], this.zoom*(p[1]+1), this.zoom, 1 )
	},
	pxdrawu : function( p ){
		this.ctx.fillRect( this.zoom*p[0], this.zoom*p[1], this.zoom, 1 )
	},

	/* For easier color naming */
	col : function( hex ){
		this.ctx.fillStyle="#"+hex
	},
	/* Color the whole grid in color [col] */
	clear : function( col ){
		col = col || "000000"
		this.ctx.fillStyle="#"+col
		this.ctx.fillRect( 0,0, this.el.width, this.el.height )
	},

	context : function(){
		return this.ctx
	},

	p2pdraw : function( p ){
		var dim
		for( dim = 0; dim < p.length; dim++ ){
			if( this.wrap[dim] != 0 ){
				p[dim] = p[dim] % this.wrap[dim]
			}
		}
		return p
	},

	/* DRAWING FUNCTIONS ---------------------- */

	/* Use to draw the border of each cell on the grid in the color specified in "col"
	(hex format). This function draws a line around the cell (rather than coloring the
	outer pixels). If [kind] is negative, simply draw all borders. */
	drawCellBorders : function( kind, col ){
		col = col || "000000"
		let pc, pu, pd, pl, pr, pdraw
		this.col( col )
		this.ctx.fillStyle="#"+col

		// cst contains indices of pixels at the border of cells
		for( let x of this.C.cellBorderPixels() ){
			/* eslint-disable */
			let p = x[0]
			if( kind < 0 || this.C.cellKind(x[1]) == kind ){
				pdraw = this.p2pdraw( p )


				pc = this.C.pixt( [p[0],p[1]] )
				pr = this.C.pixt( [p[0]+1,p[1]] )
				pl = this.C.pixt( [p[0]-1,p[1]] )		
				pd = this.C.pixt( [p[0],p[1]+1] )
				pu = this.C.pixt( [p[0],p[1]-1] )

				if( pc != pl  ){
					this.pxdrawl( pdraw )
				}
				if( pc != pr ){
					this.pxdrawr( pdraw )
				}
				if( pc != pd ){
					this.pxdrawd( pdraw )
				}
				if( pc != pu ){
					this.pxdrawu( pdraw )
				}
			}

		}
	},
	/* Use to show activity values of the act model using a color gradient, for
	cells in the grid of cellkind "kind". */
	drawActivityValues : function( kind ){
		// cst contains the pixel ids of all non-background/non-stroma cells in
		// the grid. The function tohex is used to convert computed color gradients
		// to the hex format.
		var cst = Object.keys( this.C.cellpixelstype ), ii, sigma, a,
			tohex = function(a) { a = parseInt(255*a).toString(16) 
				return  ("00".substring(0,2-a.length))+a }, i

		// loop over all pixels belonging to non-background, non-stroma
		for( i = 0 ; i < cst.length ; i ++ ){
			ii = cst[i]
			sigma = this.C.cellpixelstype[ii]

			// For all pixels that belong to the current kind, compute
			// color based on activity values, convert to hex, and draw.
			if( this.C.cellKind(sigma) == kind ){
				a = this.C.pxact( ii )/this.C.par("MAX_ACT",sigma)
				if( a > 0 ){
					if( a > 0.5 ){
						this.col( "FF"+tohex(2-2*a)+"00" )
					} else {
						this.col( tohex(2*a)+"FF00" )
					} 
					this.pxf( this.i2p( ii ) )
				}
			}
		}
	},

	/* colors outer pixels of each cell */
	drawOnCellBorders : function( col ){
		col = col || "000000"
		this.col( col )
		this.ctx.fillStyle="#"+col
		for( let i of this.C.cellBorderPixels() ){
			this.pxf( i[0] )
		}
	},

	/* Draw all cells of cellkind "kind" in color col (hex). col can also be a function that
	 * returns a hex value for a cell id. */
	drawCells : function( kind, col ){
		if( ! col ){
			col = "000000"
		}
		if( typeof col == "string" ){
			this.col(col)
		}
		// Object cst contains pixel index of all pixels belonging to non-background,
		// non-stroma cells.
		let cellpixelsbyid = {}
		for( let x of this.C.cellPixels() ){
			if( kind < 0 || this.C.cellKind(x[1]) == kind ){
				if( !cellpixelsbyid[x[1]] ){
					cellpixelsbyid[x[1]] = []
				}
				cellpixelsbyid[x[1]].push( x[0] )
			}
		}
		for( let cid of Object.keys( cellpixelsbyid ) ){
			if( typeof col == "function" ){
				this.col( col(cid) )
			}
			for( let cp of cellpixelsbyid[cid] ){
				this.pxf( cp )
			}
		}
	},

	/* Draw grid to the png file "fname". */
	writePNG : function( fname ){
		this.fs.writeFileSync(fname, this.el.toBuffer())
	}
}

export default Canvas

