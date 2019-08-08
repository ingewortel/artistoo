/** An array with the grid size in pixels for each dimension.
Each element must be a positive integer.
For example, for GridSize array g, g[0] is the size in x-dimension, g[1] in y, etc.

@typedef {number[]} GridSize
*/

/** Array coordinates to a pixel on the grid.

We generally use two types of coordinates. An ArrayCoordinate contains the 'regular'
[x,y] or [x,y,z] pointer to a position on the grid, which is intuitive to use.

However, for speed, models of class {@link GridBasedModel} often use a different type
of coordinates called {@link IndexCoordinate}. See methods {@link p2i} and {@link i2p}
of the appropriate grid subclass for conversions between the two.

@typedef {number[]} ArrayCoordinate
*/

/** Index coordinate to a pixel on the grid.

We generally use two types of coordinates. An {@link ArrayCoordinate} contains the 'regular'
[x,y] or [x,y,z] pointer to a position on the grid, which is intuitive to use.

However, for speed, models of class {@link GridBasedModel} often use a different type
of coordinates called IndexCoordinate, which is a non-negative integer number. 
See methods {@link p2i} and {@link i2p} of the appropriate grid subclass for 
conversions between the two.

@typedef {number} IndexCoordinate
*/