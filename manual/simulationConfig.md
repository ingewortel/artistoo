# Configuring Simulations (1)

Once you have written a [fist simulation](quickstart.html), you can make
it more complex by adding different CPM energy constraints, 
or you can increase the number of cells in your simulation and examine 
interactions between different cell types. 

The [Simulation class](../class/src/simulation/Simulation.js~Simulation.html)
allows you to make many of those changes by simply modifying the its
[configation object](quickstart.html), which will be the topic of this tutorial. 
The next tutorial will show you how you can make even more advanced simulations 
by writing custom functions - but for now we will focus on changes you can make
through configuration only. 

We will start from this very simple simulation from the 
[previous tutorial](quickstart.html):

<div>
<iframe src="./manual/asset/SingleCell.html" width="350px" height="400px"> </iframe>
</div>

This tutorial assumes you have completed the previous tutorial, and we will 
examine the `config` object of the simulation you generated there in more detail:

```$xslt
let config = {

	// Grid settings
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

We will now see how changes to this object can alter the simulation. 

## Configuring the CPM itself

First, let's see how we can control the [CPM model class](
../class/src/models/CPM.js~CPM.html) itself. For this lesson,
we recommend starting from the HTML version of the simulation in the 
[previous tutorial](quickstart.html). This HTML version will allow you to
see the effect of your changes more quickly than running a node script would.


### Changing CPM constraints

As we've seen before, the `config` object has three parts: the `field_size`, 
the `conf`, and the `simsettings`. We will now look at the `conf` part, which
controls the CPM model itself.


```$xslt
	// CPM parameters and configuration
	conf : {
		T : 20,								// CPM temperature
				
		// Adhesion parameters:
		J: [[0,20], [20,100]] ,
		
		// VolumeConstraint parameters
		LAMBDA_V : [0,50],				// VolumeConstraint importance per cellkind
		V : [0,500]						// Target volume of each cellkind
	},
```

Remember that CPMs work by defining a "global energy" in the form of an equation
called the *Hamiltonian*. Whether or not a pixel changes in the CPM then depends
on how this would change the global energy: if the pixel change *decreases* the
global energy (=energetically favourable), the pixel change will happen. If it
would *increase* the global energy, 


### Configuring the grid

#### **Field size**

Open your file `MyFirstSimulation.html` from the previous tutorial in the web
browser. You should see a black cell floating inside a square gray area, which
is the field or "grid" the simulation runs in. 

The size of this grid is controlled by `field_size` in the `config` object.
The entry 

```$xslt
	// Grid settings
	field_size : [100,100],
```
ensures that the simulation is performed on a 100 x 100 pixel (2D) grid. We
can change the size of this grid by changing the numbers `x` and `y` between
the square brackets: `[x,y]`, where `x` controls the grid's width and 
`y` controls its height. For example, changing this setting to:

```$xslt
	// Grid settings
	field_size : [150,100],
```

makes the grid slightly broader, but equally high as before.

**Exercise** : 

*How would you make a grid with a width of 100 pixels and a
height of 200 pixels? Open your file* `MyFirstSimulation.html` *in your 
favourite text editor, change the* `field_size` *in the appropriate manner, and
save the file. Now open* `MyFirstSimulation.html` *in your web browser (or just
refresh the page if you had already done so). Did it work?*

#### **Grid boundaries**




### Setting a seed



## Configuring the Simulation object

### Controlling the simulation

### Controlling the visualization

### Controlling outputs
