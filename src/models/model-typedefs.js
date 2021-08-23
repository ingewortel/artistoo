/** 
A semi-unique identifier number of a cell on the grid. In classic CPM language, this is often
referred to as 'type', but we use cellid to prevent confusion with the biological meaning
of 'celltype' (which we call {@link CellKind} to prevent confusion).

The cellid must be a positive integer. The number 0 is reserved for the background. 
The cellid cannot exceed 2^16; once this is reached, a search is done for available (deleted) cellids.
@typedef {number} CellId
*/

/** 
Index specifying the 'kind' of cell we are dealing with. This corresponds to the biological
idea of a 'celltype'; so the CPM parameters used depend on the cellkind. Convention is that
we store CPM parameters in number arrays param = number[], where param[i] is the parameter
value for cellkind i. 

This way, we can have multiple cells (each with their own {@link CellId}) of the same "cellkind", that
get the same parameters (e.g. the same target volume). But we can also have multiple
cellkinds on the grid, e.g. a small and a large cellkind.

The cellkind must be a positive integer. The number 0 is reserved for the background.
@typedef {number} CellKind
*/
