# Artistoo (Artificial Tissue Toolbox)

Artistoo (formerly called CPMjs) is a JavaScript library for building Cellular Potts Model (CPM) simulations that can be shared and explored in the web browser, without requiring installed software. Full documentation is available on [artistoo.net](https://artistoo.net).

Artistoo is an open-source library, freely available under the terms of the MIT license. When using Artistoo for a publication please cite:

Wortel & Textor. *Artistoo, a Library to Build, Share, and Explore Simulations of Cells and Tissues in the Web Browser.* eLife 2021;10:e61288. DOI: [10.7554/eLife.61288](https://doi.org/10.7554/eLife.61288)


## About

Artistoo implements a simple Cellular Potts Model in JavaScript. The code includes several extensions, including the extension for cell migration published in 

Ioana Niculescu, Johannes Textor, Rob J. de Boer:
__Crawling and Gliding: A Computational Model for Shape-Driven Cell Migration__
PLoS Computational Biology 11(10): e1004280
http://dx.doi.org/10.1371/journal.pcbi.1004280

Custom extensions can be plugged in where needed; please refer to [artistoo.net](https://artistoo.net) or use the Discussions section of this repository if you need help.


## Documentation [![Inline docs](https://inch-ci.org/github/ingewortel/artistoo.svg?branch=master)](https://inch-ci.org/github/ingewortel/artistoo)

You can find full documentation of available methods 
[here](https://artistoo.net/identifiers.html), or have a look at
the [manual](https://artistoo.net/manual/index.html) for tutorials 
to get started. Alternatively, see below for a brief description and a list of examples.

## How it works

This code has been ported over from our older "cpm" repository. This is now an ES6 module, 
which is compiled trough "rollup" for use in the browser. Users who wish to use this version
of Artistoo can use the compiled code in the `build/` folder as it is; there is no
need to compile anything. See below for examples and how to use them, or visit 
[artistoo.net](https://artistoo.net) for more extensive documentation.

Developers can extend the code with their own modules; documentation will follow later
(see the Makefile).

### Browser examples

Artistoo can be used to create interactive simulations in the webbrowser. We have implemented
several examples showing various processes that can be simulated with a CPM; see 
[artistoo.net/examples.html](https://artistoo.net/examples.html). 
(Please note that these examples may not work properly in Internet Explorer). 
The page also contains a few examples of plain cellular automata (CA).

### Node examples

Simulations can also be run from the command line using Node.js. The first time you do this,
you have to install several dependencies. Go to the base folder of this package and run

```
npm install
```

which will automatically install the dependencies as supplied in the `package.json` file.

Here's an example of how to run the node script:

```
cd examples/node
node run-ActModel.js
```

This may give an error the first time, because the script is trying to store images of
the simulation to a file `output/img/ActModel` which does not exist. Create this directory
and try again:

``` 
mkdir -p output/img/ActModel
node run-ActModel.js
```

This will print some output to the console; typically the centroid of each 
cell at each timepoint. See the node script and the 
[Simulation class](https://artistoo.net/class/src/simulation/Simulation.js~Simulation.html)
for details.


To create a movie, run:
```
mkdir -p output/mp4
ffmpeg -r 60 -f image2 -i output/img/ActModel/ActModel-t%d.png -vcodec libx264 -crf 25 -pix_fmt yuv420p output/mp4/ActModel.mp4
```
