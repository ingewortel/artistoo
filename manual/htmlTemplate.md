# An HTML Template

This tutorial will take you through the HTML simulation template 
step by step so you know which parts you may have to adapt when 
you are building your own simulations.

### An HTML template

We will build the following template:

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

We will now go through this step by step.

### Step 1 : Create a basic HTML page

A very simple HTML page looks like this:

```$xslt
<!DOCTYPE html>
<html>
<head> </head>
<body> </body>
</html>
```

The `<html>` tag shows where the page starts, and `</html>` shows where it ends.
The page consists of a *header*, which starts at `<head>` and ends at `</head>`,
and a *body*, starting at `<body>` and ending at `</body>`. (In general,
anything you place in your HTML file starts with `<something>` and ends with
`</something>`).

### Step 2 : Configure the header

The header of the HTML page is the place that contains some meta-information
about that page, and will also contain the simulation code.

First, we will expand the header code above (between the `<head></head>` tags):

```$xslt
<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>PageTitle</title>
</head>
```

The additional code in the first line just includes some document settings into 
the header that you will rarely need to change. The only thing you may want to 
change is the second line, where you set the title that will be displayed
in the open tab in your web browser when you open the page.

### Step 3 : Add JavaScript

We will now add some JavaScript code to the header part of the page (again,
between the `<head></head>` tags):

```$xslt
<head><meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
<title>PageTitle</title>
<script src="path/to/artistoo/build/artistoo.js"></script>
<script>
"use strict"
// Simulation code will go here:

</script>
</head>
```

The first script just loads the Artistoo package for HTML, which is stored in
`artistoo/build/artistoo.js`. Please ensure that the path supplied here is the correct
path from the folder where you stored `MyFirstSimulation.html` to the file
`artistoo/build/artistoo.js`. If you have stored your simulation in `artistoo/examples/html`,
you can use the path `../../build/artistoo.js`


The second script is where your actual simulation code
will go when you are [Writing your simulation](quickstart.html#writing-your-simulation).
For now, we'll leave it empty.

### Step 4: Write the body

Finally, we make some changes to the body of the page (between the `<body></body>` tags):

```$xslt
<body onload="initialize()">
<h1>Your Page Title</h1>
<p>
Description of your page.
</p>
</body>
```

In the first line, we tell the HTML page to run the JavaScript function 
`intitialize()`, which we will define later in 
[Writing your simulation](quickstart.html#writing-your-simulation) (between the 
`<script></script>` tags of the page header we just set up).

The rest of the code just adds a title and a description to the web page.
The simulation will then be placed below (as in the example shown
at the top of this page).

### Step 5 (optional): Add CSS

The code we have now added is sufficient to make the page work once we have
[added a simulation](quickstart.html#writing-your-simulation), but to make it look better we
may want to add some CSS styling code to the header of the page. The header now
becomes:

```$xslt

<head><meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
<title>PageTitle</title>

<style type="text/css"> 
body{
font-family: "HelveticaNeue-Light", sans-serif; padding : 15px;
}
</style>

<script src="path/to/artistoo/build/artistoo.js"></script>
<script>
"use strict"
// Simulation code will go here:

</script>
</head>
```

To see the final result, have a look again at the complete
 [template](#an-html-template). You can now proceed with
 [adding your simulation](quickstart.html#writing-your-simulation) to this file.