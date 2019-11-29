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

* [A simple Ising model](examples/ising-model.html)
* [A single moving cell](examples/single-cell.html)
* [A 2D random walk](examples/randomwalk.html)
* [A 3D random walk](examples/randomwalk3d.html)
* [A clump of two celltypes sorting via differential adhesion](examples/cellsorting.html)
* [A simulation of an epidermis packed with keratinocytes](examples/epidermis.html)

## Node examples

TBD
