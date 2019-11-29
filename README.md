# CPMjs

Implements a simple Cellular Potts Model in JavaScript. Code includes the extension for cell migration published in 

Ioana Niculescu, Johannes Textor, Rob J. de Boer:
__Crawling and Gliding: A Computational Model for Shape-Driven Cell Migration__
PLoS Computational Biology 11(10): e1004280
http://dx.doi.org/10.1371/journal.pcbi.1004280

# How it works

This code has been ported over from our older "cpm" repository. This is now an ES6 module, which is compiled trough "rollup" for use in the browser. See the Makefile.

## Browser examples

We have the following examples for web-browser CPMs:

* [A simple Ising model](./examples/html/IsingModel.html)
* [A simple 2D CPM cell](./examples/html/SingleCell.html)
* [The classic CPM cell sorting example](./examples/html/Cellsorting.html)
* [Dividing CPM cells](./examples/html/CellDivision.html)
* [A cell moving through active cell migration](./examples/html/Actmodel.html)
* [Migrating cell in a microchannel](./examples/html/Microchannel.html)
* [Migrating cells on adhesive patterns](./examples/html/ActOnMicroPattern.html)
* [Simulating plain diffusion](./examples/html/Diffusion.html)
* [Cells moving up a chemokine gradient](./examples/html/Chemotaxis.html)
* [Multiple cells migrating together, interactive web page](./examples/html/CollectiveMigration.html)
* [Cells moving towards a target point](./examples/html/DirectedMotionTargetPoint.html)
* [Cells moving in the same global direction](./examples/html/DirectedMotionLinear.html)
* [A layer of tightly packed epidermal cells](./examples/html/Epidermis.html)
* [T cells moving in the epidermis](./examples/html/EpidermisWithTCells.html)
* [Cells producing a chemokine with other cells responding to it](./examples/ManyCellsDiffusion.html)
* [Cells moving with a preferred direction](./examples/html/ManyCellsPrefDir.html)
* [Particle following a random walk](./examples/RandomWalk.html)

We also have a few examples of plain cellular automata (CAs):

* [Conway's Game of Life](./examples/html/GameOfLife.html)
* [SIR model of a spreading infection](./examples/html/SIR.html)

## Node examples

TBD
