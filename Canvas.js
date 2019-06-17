/** Class for taking a CPM grid and displaying it in either browser or with nodejs. */

"use strict"

class Canvas {
	/* The Canvas constructor accepts a CPM object C or a Grid2D object */
	constructor( C, options ){
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


	/* Several internal helper functions (used by drawing functions below) : */
	pxf( p ){
		this.ctx.fillRect( this.zoom*p[0], this.zoom*p[1], this.zoom, this.zoom )
	}

	pxfi( p ){
		const dy = this.zoom*this.width
		const off = (this.zoom*p[1]*dy + this.zoom*p[0])*4
		for( let i = 0 ; i < this.zoom*4 ; i += 4 ){
			for( let j = 0 ; j < this.zoom*dy*4 ; j += dy*4 ){
				this.px[i+j+off] = this.col_r
				this.px[i+j+off + 1] = this.col_g
				this.px[i+j+off + 2] = this.col_b
				this.px[i+j+off + 3] = 255
			}
		}
	}

	pxfir( p ){
		const dy = this.zoom*this.width
		const off = (p[1]*dy + p[0])*4
		this.px[off] = this.col_r
		this.px[off + 1] = this.col_g
		this.px[off + 2] = this.col_b
		this.px[off + 3] = 255
	}

	getImageData(){
		this.image_data = this.ctx.getImageData(0, 0, this.width*this.zoom, this.height*this.zoom)
		this.px = this.image_data.data
	}

	putImageData(){
		this.ctx.putImageData(this.image_data, 0, 0)
	}

	pxfnozoom( p ){
		this.ctx.fillRect( this.zoom*p[0], this.zoom*p[1], 1, 1 )
	}

	/* draw a line left (l), right (r), down (d), or up (u) of pixel p */
	pxdrawl( p ){
		for( let i = this.zoom*p[1] ; i < this.zoom*(p[1]+1) ; i ++ ){
			this.pxfir( [this.zoom*p[0],i] )
		}
	}

	pxdrawr( p ){
		for( let i = this.zoom*p[1] ; i < this.zoom*(p[1]+1) ; i ++ ){
			this.pxfir( [this.zoom*(p[0]+1),i] )
		}
	}

	pxdrawd( p ){
		for( let i = this.zoom*p[0] ; i < this.zoom*(p[0]+1) ; i ++ ){
			this.pxfir( [i,this.zoom*(p[1]+1)] )
		}
	}

	pxdrawu( p ){
		for( let i = this.zoom*p[0] ; i < this.zoom*(p[0]+1) ; i ++ ){
			this.pxfir( [i,this.zoom*p[1]] )
		}
	}

	/* For easier color naming */
	col( hex ){
		this.ctx.fillStyle="#"+hex
		this.col_r = parseInt( hex.substr(0,2), 16 )
		this.col_g = parseInt( hex.substr(2,2), 16 )
		this.col_b = parseInt( hex.substr(4,2), 16 )
	}

	/* Color the whole grid in color [col] */
	clear( col ){
		col = col || "000000"
		this.ctx.fillStyle="#"+col
		this.ctx.fillRect( 0,0, this.el.width, this.el.height )
	}

	context(){
		return this.ctx
	}

	p2pdraw( p ){
		var dim
		for( dim = 0; dim < p.length; dim++ ){
			if( this.wrap[dim] != 0 ){
				p[dim] = p[dim] % this.wrap[dim]
			}
		}
		return p
	}

	/* DRAWING FUNCTIONS ---------------------- */

	drawChemokine( cc ){
		let dy = this.zoom*this.width
		this.getImageData()
		for( let i = 0 ; i < cc.chemoGrid.extents[0] ; i ++ ){
			for( let j = 0 ; j < cc.chemoGrid.extents[1] ; j ++ ){
				const off = (j*dy + i)*4
				this.px[off] = 255
				this.px[off + 1] = 0
				this.px[off + 2] = 0
				this.px[off + 3] = 255*(cc.chemoGrid.pixt( [i,j] )/cc.maxChemokineValue)
			}
		}
		this.putImageData()
	}

	/* Use to draw the border of each cell on the grid in the color specified in "col"
	(hex format). This function draws a line around the cell (rather than coloring the
	outer pixels). If [kind] is negative, simply draw all borders. */
	drawCellBorders( kind, col ){
		col = col || "000000"
		let pc, pu, pd, pl, pr, pdraw
		this.col( col )
		this.getImageData()
		// cst contains indices of pixels at the border of cells
		for( let x of this.C.cellBorderPixels() ){
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
		this.putImageData()
	}

	/* Use to show activity values of the act model using a color gradient, for
	cells in the grid of cellkind "kind". */
	drawActivityValues( kind, A ){
		// cst contains the pixel ids of all non-background/non-stroma cells in
		// the grid. 
		let ii, sigma, a
		// loop over all pixels belonging to non-background, non-stroma
		this.col("FF0000")
		this.getImageData()
		this.col_b = 0
		//this.col_g = 0
		for( let x of this.C.cellPixels() ){
			ii = x[0]
			sigma = x[1]

			// For all pixels that belong to the current kind, compute
			// color based on activity values, convert to hex, and draw.
			if( this.C.cellKind(sigma) == kind ){
				a = A.pxact( this.C.grid.p2i( ii ) )/A.conf["MAX_ACT"][kind]
				if( a > 0 ){
					if( a > 0.5 ){
						this.col_r = 255
						this.col_g = (2-2*a)*255
					} else {
						this.col_r = (2*a)*255
						this.col_g = 255
					}
					this.pxfi( ii )
				}
			}
		}
		this.putImageData()
	}

	/* colors outer pixels of each cell */
	drawOnCellBorders( col ){
		col = col || "000000"
		this.getImageData()
		this.col( col )
		for( let i of this.C.cellBorderPixels() ){
			this.pxfi( i[0] )
		}
		this.putImageData()
	}

	/* Draw all cells of cellkind "kind" in color col (hex). col can also be a function that
	 * returns a hex value for a cell id. */
	drawCells( kind, col ){
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
		this.getImageData()
		for( let cid of Object.keys( cellpixelsbyid ) ){
			if( typeof col == "function" ){
				this.col( col(cid) )
			}
			for( let cp of cellpixelsbyid[cid] ){
				this.pxfi( cp )
			}
		}
		this.putImageData()
	}

	/* Draw grid to the png file "fname". */
	writePNG( fname ){
		this.fs.writeFileSync(fname, this.el.toBuffer())
	}
}

export default Canvas

