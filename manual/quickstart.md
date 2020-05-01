# Your First Simulation

This tutorial will show you how to build a simple simulation in the web browser
or in a nodejs script. Choose either
[Set up a simulation in the web browser](#set-up-a-simulation-in-the-web-browser)
or [Set up a simulation in nodejs](#set-up-a-simulation-in-nodejs) to get the
required template code, and then see
[Writing your simulation](#writing-your-simulation) to start using Artistoo in the
environment of your choice.

The simulation we will build is a simple CPM cell:

INSERTFROMFILE 1001

## Set up a simulation in the web browser

One way to use Artistoo is to build a simulation in HTML, to open directly in
your favourite web browser (as long as that favourite web browser is not
Internet Explorer). The advantage of this method is that it allows you to
visualize the simulation immediately, and that you can easily explore the
effect of changing parameters in this manner. However, if you wish to run a
simulation and store output to your computer, a simulation using nodejs may be
more appropriate – see [Set up a simulation in nodejs](#set-up-a-simulation-in-nodejs)
for details.


### An HTML template page
Unfortunately, writing an HTML page requires quite some boilerplate code. You
can mostly just copy-paste this for every simulation you build. For now,
we will just copy-paste the following template so you can continue with
[building your simulation](#writing-your-simulation). If you are unfamiliar with
HTML, you may want to check out [this tutorial](htmlTemplate.html) later --
it will guide you through the template 
step by step so you know which parts you may have to adapt. 

```$xslt
<!-- Page setup and title -->
<!DOCTYPE html>
<html lang="en">
<head><meta http-equiv="Content-Type" content="text/html;
charset=UTF-8">
<title>PageTitle</title>
<style type="text/css"> 
body{
    font-family: "HelveticaNeue-Light", sans-serif; padding : 15px;
}
</style>

<!-- Sourcing the cpm build -->
<script src="../../build/artistoo.js"></script>
<script>
"use strict"

            // Simulation code here.


</script>
</head>
<body onload="initialize()">
<h1>Your Page Title</h1>
<p>
Description of your page.
</p>
</body>
</html>
```

Copy the above code into a file called `MyFirstSimulation.html`, which you can
save in the `artistoo/examples/html/` folder for now. 


> ! *Important*: If you wish to save the file elsewhere, please read 
>[these instructions](installation.html#additional-notes) 
>first, and ensure that you include the correct path to the cpm build in
>the part `<script src="../../build/artistoo.js"></script>`.


You can now proceed with
 [adding your simulation](#writing-your-simulation) to this file.


## Set up a simulation in nodejs

Another way to use Artistoo – besides using HTML – is to use nodejs from the 
console. This method of running Artistoo allows you to print statistics to the 
console and store them in external files, as well as to save images of the 
simulation to create a movie later. To set up a more interactive version 
of your simulation with a live animation, an HTML version may be more 
appropriate – see 
[Set up a simulation in the web browser](#set-up-a-simulation-in-the-web-browser)

In contrast to a browser simulation, a node simulation requires almost no 
boilerplate code. 

To set up your first node simulation, just create a file `MyFirstSimulation.js`
in the folder `artistoo/examples/node/` 
(or see [these instructions](installation.html#additional-notes) to create it 
elsewhere). Then add the following line of code to the (still empty) script to
source the package:

```$xslt
/* Source the CPM module (cpm-cjs version because this is a node script).*/
let CPM = require("../../build/artistoo-cjs.js")
```

Make sure that the path supplied to `require()` is the correct path from the
location of `MyFirstSimulation.js` to `artistoo/build/artistoo-cjs.js`.

You can now proceed with [adding your simulation](#writing-your-simulation).

## Writing your simulation

We are now ready to add some simulation code. The following code goes either
in between the `<script></script>` tags of your HTML page (see the comment
`// Simulation code here`), or at the bottom of your node script.

The easiest way to build a simulation in Artistoo is to use the 
[Simulation class](../class/src/simulation/Simulation.js~Simulation.html).
This class provides some default methods for running the simulation and 
producing outputs, so we won't have to worry about this yet. 

### Step 1 : Configure the CPM & Simulation

The first thing we need to do is supply a `config` object with all the required
parameters and settings for the simulation. A configuration object for a simulation 
should look something like this:

```$xslt
let config = {

	ndim : 2,
	field_size : [50,50],
	conf : {

	},
	simsettings : {
	
	}
}
```


Here, `ndim` is the number of dimensions of the grid, `field_size` is the 
number of pixels in each dimension (in this case: 50 x 50 pixels), `conf` is 
the configuration object parsed to the 
[CPM class](../class/src/models/CPM.js~CPM.html), and `simsettings`
contains configuration options used directly by the simulation class.

First, we configure the CPM by setting values in the `conf` object:

```$xslt
conf : {
		T : 20,						// CPM temperature
				
		// Adhesion parameters:
		J: [[0,20], [20,100]] ,
		
		// VolumeConstraint parameters
		LAMBDA_V : [0,50],			// VolumeConstraint importance per cellkind
		V : [0,500]					// Target volume of each cellkind
		
	}
```

The `T` parameter is the CPM temperature, which determines how strongly the 
model "listens" to the energy constraints given in the CPM. We then add 
an [adhesion](../class/src/hamiltonian/Adhesion.js~Adhesion.html) and 
[volume constraint](../class/src/hamiltonian/VolumeConstraint.js~VolumeConstraint.html) 
by supplying their parameters. In this case, we will have only one type of cell
and the background, so parameters are arrays of length 2 (or a 2 by 2 matrix 
for the adhesion parameters).

Finally, we need to supply some settings for the simulation class itself in
`simsettings`:

```$xslt
simsettings : {
	NRCELLS : [1],
    RUNTIME : 500,
	CANVASCOLOR : "eaecef",
	zoom : 4
}
```

This ensures that one cell is seeded on the grid before the simulation, the
simulation runs for 500 MCS (in node; in the browser it will just keep running),
the background of the grid is colored gray, and the grid is drawn at 4x zoom.

The full `config` object becomes:

```$xslt
let config = {

	// Grid settings
	ndim : 2,
	field_size : [100,100],
	
	// CPM parameters and configuration
	conf : {
		T : 20,								// CPM temperature
				
		// Adhesion parameters:
		J: [[0,20], [20,100]] ,
		
		// VolumeConstraint parameters
		LAMBDA_V : [0,50],				// VolumeConstraint importance per cellkind
		V : [0,500]						// Target volume of each cellkind
	},
	
	// Simulation setup and configuration
	simsettings : {
		// Cells on the grid
		NRCELLS : [1],					// Number of cells to seed for all
										// non-background cellkinds.

        RUNTIME : 500,                  // Only used in node

		CANVASCOLOR : "eaecef",
		zoom : 4						// zoom in on canvas with this factor.
	}
}
```

### Step 2: Create a simulation object

Once we have the configuration object, we can use it to construct a simulation.

#### In nodejs
In nodejs, simply construct the simulation as follows:

```$xslt
let sim = new CPM.Simulation( config )
```

#### In HTML

If you are writing an HTML page, you have to define an `initialize()` function -
as this is the function that will be run when the page is loaded (see 
[this section](htmlTemplate.html#step-4-write-the-body)):


```$xslt
let sim
function initialize(){
    sim = new CPM.Simulation( config )
}
```


### Step 3 : Tell the simulation to run

We are now almost ready; the only thing still missing is a command in the script
that tells the simulation to start running. This works slightly differently in
the browser- and nodejs versions.

#### In nodejs

In nodejs, getting the simulation to run is easy: just call the `run()` method
of the simulation class after creating the simulation object. We get:

```$xslt
let config = {
    ...
}
let sim = new CPM.Simulation( config )
sim.run()
```

You are now ready to run your simulation. From your console, run the script with
node:

```$xslt
node path/to/MyFirstSimulation.js
```

#### In HTML

In HTML, we create a function that runs a single step, and then make sure that
this function is called from the `initialize()` function:

```$xslt
let config = {
    ...
}
let sim
function initialize(){
    sim = new CPM.Simulation( config )
    step()
}
function step(){
    sim.step()
    requestAnimationFrame( step )
}
```

To see your simulation, open your file MyFirstSimulation.html in the web 
browser (any except Internet Explorer; but we recommend Chrome because it is fast).