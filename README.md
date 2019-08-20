# cpm
Cellular Potts Model implementation

Implements a simple Cellular Potts Model in javascript. Code includes the extension for cell migration published in 

Ioana Niculescu, Johannes Textor, Rob J. de Boer:
__Crawling and Gliding: A Computational Model for Shape-Driven Cell Migration__
PLoS Computational Biology 11(10): e1004280
http://dx.doi.org/10.1371/journal.pcbi.1004280

# How it works

This code has been ported over from our older "cpm" repository. This is now an ES6 module, which is compiled trough "rollup" for use in the browser. See the Makefile.

## Browser examples

We have the following examples for web-browser CPMs:

* [A simple Ising model](../simulation-examples/html/IsingModel.html)
* [A simple 2D CPM cell](../simulation-examples/html/SingleCell.html)
* [The classic CPM cell sorting example](../simulation-examples/html/Cellsorting.html)
* [Dividing CPM cells](../simulation-examples/html/CellDivision.html)
* [A cell moving through active cell migration](../simulation-examples/html/Actmodel.html)
* [Migrating cell in a microchannel](../simulation-examples/html/Microchannel.html)
* [Migrating cells on adhesive patterns](../simulation-examples/html/ActOnMicroPattern.html)
* [Simulating plain diffusion](../simulation-examples/html/Diffusion.html)

We also have a few examples of plain cellular automata (CAs):

* [Conway's Game of Life](../simulation-examples/html/GameOfLife.html)
* [SIR model of a spreading infection](../simulation-examples/html/SIR.html)

## Node examples

TBD
