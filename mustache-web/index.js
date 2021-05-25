// This file generates the contents from the data in data/site.json
//

const Mustache = require('mustache')
const fs = require('fs')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;


/* ================				INPUTS 				===================== */

/* This function is used below to auto-generate the sidenav of the manual.

Given the DOM extracted from an HTML page string, extracts all h2 and h3 tags.
Returns an array of objects, one object per found tag. Each object contains the
"subtitle" (textual content of the header), "id" (id of the element), and "level"
(0 for h2, 1 for h3). Note that this ignores h1, which is used for the manual title.
*/
function getHeaders( dom ) {
  const hTags = ["h2", "h3"];
  const elements = dom.document.querySelectorAll(hTags.join());
  const headers = [];

  elements.forEach(el => {
    const subtitle = el.innerHTML;
    const id = el.getAttribute("id");

    headers.push({
      id,
      subtitle,
      level: hTags.indexOf(el.tagName.toLowerCase())
    });
  });

  return headers;
}


/*This function is used below to auto-generate the sidenav of the manual.

Given an array of h2/h3 headers (produced by getHeaders() above), builds a nested
tree of the document structure. This assumes that the headers occur in the array in the
order in which they occur on the page (which should be the case).

Returns an array of h2 objects. If there are h3 subheadings under the h2 heads, 
these are added as a child array with key "subsec".
*/
function headerTree( headers ){
	const headertree = []
	for( let h of headers ){
		const lev = h.level
		if( lev === 0 ){
			headertree.push( h )
		} else if ( lev === 1 ){
			const last = headertree.length-1
			if( !headertree[ last ].hasOwnProperty("subsec") ){
				headertree[ last ].subsec = []
			}
			headertree[last].subsec.push(h)
		} else {
			throw("header level not supported in mustache index.js:headerTree()")
		}
		
	}
	return headertree

}


// Load data for the view
const view = JSON.parse(fs.readFileSync("data/site.json"))

// Load the template of the main (index) page.
const template = fs.readFileSync("templates/index.mustache").toString()

// Load all partials. No matter for which page, they all go into 
// the same array
let partials = {}
for( let f of fs.readdirSync("partials") ){
	let fa = f.split(".html")
	if( fa.length == 2 && fa[1] == '' ){
		partials[fa[0]] = fs.readFileSync("partials/"+fa[0]+".html").toString()
	}
}

/*A function to render the templates, converting them to the output html pages in the
public/ folder.*/
function renderPage( name, view ){
	fs.writeFileSync( "public/"+name+".html",
		Mustache.render(fs.readFileSync("templates/"+name+".mustache").toString(), view, partials)
	)
}

/*This function returns an array of objects, one object per separate manual section
(as entered in the site.json file). This is used to construct the "fixed" portion of 
the manual side nav, which contains only a link to the main title of each manual page.

Later, we'll add for each individual manual page also the links to its own subheadings
(but not the subheadings of the pages that we are not looking at).
This means that each manual page will have its own unique nav array, containing only 
the subheadings relevant to it. This means we need a generator function to generate 
these objects (we can't just copy them because all the pointers would still indicate
the same object in JS).
*/
function mainNav(){
	const mnav = []
	for( let p of view.manual ){
		mnav.push({
			title : p.title,
			tag : p.tag,
			nav : [],
			active : false
		})
	}
	return mnav
}




/* ================				RENDERING 				===================== */

// Step 1) Render the index.html page and the examples.html page.
for( let p of ["index","examples","explorables","layout","converter"] ){
	renderPage( p, view )
}


// Step 2) Build the manual
let pageIndex = 0	// tracks the index of the manual page from 0...(n-1).

// Loop over the manual pages as they are defined in site.json:
for( let p of view.manual ){

	// auto-generate the side nav with all the main manual headings, and set the
	// current section to 'active'.
	p.sideNav = mainNav()
	p.sideNav[pageIndex].active = true

	// contents of the manual can be specified in a partial; we'll overwrite this later.
	partials.manual = ""
	
	// the filename of the partial belonging to this manual page
	let mypartial = "partials/manual/"+p.tag+".html"
	
	// typically for a manual this page exists, so this will be executed:
	if( fs.existsSync(mypartial) ){
		partials.manual = fs.readFileSync( mypartial ).toString()
		
		// parse HTML string of the partial page into dom parser to get HTML tags
		const dom = new JSDOM(partials.manual).window;
		
		// use the functions at the top of this script to get a tree of h2/h3 level
		// headings; save them in the view.manual object of the current page so we
		// can access them in the template to create the subheadings in the side nav.
		p.sideNav[pageIndex].nav = headerTree( getHeaders(dom) )
	}
	
	// this is so that each template knows the path to the "root" index.html page of the website.
	p.navprefix="../"
	
	// write the file from the template, using the partials.
	fs.writeFileSync( "public/manual/"+p.tag+".html",
		Mustache.render(fs.readFileSync("templates/manualpage.mustache").toString(), p, partials)
	)
	
	// go to next manual page.
	pageIndex++
}


// Loop over the manual pages as they are defined in site.json:
for( let p of view.explorables ){

	// contents of the manual can be specified in a partial; we'll overwrite this later.
	partials.explorable = ""
	
	// the filename of the partial belonging to this explorable page
	let mypartial = "partials/explorables/"+p.tag+".html"
	
	// typically for a manual this page exists, so this will be executed:
	if( fs.existsSync(mypartial) ){
		partials.explorable = fs.readFileSync( mypartial ).toString()
	}
	
	// this is so that each template knows the path to the "root" index.html page of the website.
	p.navprefix="../"
	
	// write the file from the template, using the partials.
	fs.writeFileSync( "public/explorables/"+p.tag+".html",
		Mustache.render(fs.readFileSync("templates/explorablepage.mustache").toString(), p, partials)
	)

}

