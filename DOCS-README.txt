*****************************************************************************************

							ARTISTOO DOCUMENTATION/WEBSITE

*****************************************************************************************



Quick Start
=========================

Before you start, go to mustache-web and type 'npm install' there; this will install dependencies
that are necessary for the website only.

The website is built from this folder by typing "make". Here's a few things you might
wish to do:

	* Add an example to the example gallery: 
		
		1.	Create a gif or png (square aspect ratio) and put it in 
		   	../mustache-web/sources/images/examples
		2.	Make sure an html page "MySimulation.html" of the example exists in the main 
			artistoo/examples/html folder (it will automatically be copied into the
			'examples' folder of the main website);
		3.	in ../mustache-web/data/site.json, add an item for this example
			to the correct section under "examples". The block looks like this:
				{
					"name": "Funny Title",
					"image": "./image/examples/my-gif-or-png",
					"link": "./examples/MySimulation.html",
					"desc": "Brief description of the example.",
					"learn": [ "keyword 1", "keyword 2", .. ]
				}
		4.	Run make to build the site.

	* Add a section to the manual:
		
		1. 	Write the html page under ../mustache-web/partials/manual/[my-tag].html.
			This should contain the content of the manual but not its h1-title.
			!	Make sure all h2 and h3-level headings have an 'id' which is needed
				for the sidenav.
		2.	Include any sources (e.g. simulations for iframes, screenshots) in 
			the ../mustache-web/sources/manual/asset/ folder.
		3.	Add it to site.json (in the correct position wrt the other sections):
				{
					"title":"Title Shown in h1",
					"tag":"my-tag"
				}
			(the 'tag' must correspond to the name of the file in the partials.)
		4.	Run make to build the site; this will automatically construct the manual
			sidenav.
			
	* Update documentation of a class or method:
	
		1.	Adjust the doc block in the source code (under src/);
		2.	Run make to build the site.
	
	* Adjust CSS styling:

		1.	Adjust files in ../esdoc-template-artistoo/css
		2.	Run make to build the site (or just copy the css directly into ./css/;
			the important thing is that you do not adjust the css directly in this 
			folder because this will be overwritten).


Before updating the website, make sure the version number in site.json is updated;
this prevents problems with browsers caching scripts and stylesheets from previous 
website versions.

To push to the website: from the root of the repository: git push ourserver.

For a detailed overview, read on.



Overview of the process
=========================

The website is generated in different steps. Below follows an outline specifying which
of the website files are generated where:

	1. 	MAIN SITE WITH MUSTACHE
	
		In folder mustache-web, the main website is generated which contains:
		
			- home page;
			- examples page;
			- user manual;
			- converter page; (TODO)
	
		This builds on bootstrap (for layout/css), and mustache (for templating).
		New examples and manual sections can be added using the site.json file
		(see below for details and how-tos). 
		
		In addition, this also builds a "layout.html" file for the esdoc template
		(see below), ensuring that all website pages share the same basic layout
		(e.g. the nav bar at the top).
		
		
	2.	AUTOMATIC DOCS WITH ESDOC
	
		In the folder docs, the automatic documentation is generated with esdoc,
		producing:
		
			- an 'index.html' page based on the repo README. This will *not* end up
			  on the website since we will overwrite it with a mustache-generated index.
			- the 'identifiers.html' page ('docs' in the topnav);
			- the 'class/' folder with web pages for the documentation of each class
			  (auto-generated with esdoc from the code blocks);
			- the 'variable/' folder with web pages for the documentation of each defined
			  variable (auto-generated with esdoc from the code blocks. In our case 
			  this documents the AutoAdderConfig);
			- the 'typedef/' folder with page 'index.html' documenting the manually
			  defined types used for the documentation (such as "cellKind" and "cellID").
			- the 'source.html' page ('src' in the topnav);
			- the 'file/' folder with web pages for the source code of each class
			  (auto-generated with esdoc);
			- the 'test.html' page ('tests' in the topnav);
			- the 'test-file/' folder with web pages for the tests of each class
			  (as specified in the 'spec/' directory);
			- 'coverage.json' tracking how much of the code is documented;
			- 'badge.svg', the badge that shows how much of the code is documented;
		
		Note: *everything* in the docs/ folder is output of esdoc and is overwritten
		when esdoc runs. Do not change files in this folder directly, but instead change
		their sources in the ../esdoc-template-artistoo.
			
		To generate these pages, esdoc uses the template specified in ../.esdoc.json:
		in this case the folder ../esdoc-template-artistoo. Changes to the overall layout
		of the auto-generated pages should be made by modifying files in this folder.
		Several source files of this folder are also directly copied to the main website:
			- 'css/' with all the stylesheet;
			- 'image/' with all the images;
			- 'script/' with some required javascript; these are mostly just copied
			  directly to the 'script/' folder of the final website. The exception is
			  search_index.js, which is produced by esdoc as an index for the search
			  window in the top right.			  		
		Helper files produced in the process:
			- the 'ast/' folder with syntax tree to build the docs from
			  (see: https://en.wikipedia.org/wiki/Abstract_syntax_tree);
			- 'index.json' with an index of the files of the docs. This also stores
			  e.g. the line numbers of certain methods in the source code of their
			  class, which esdoc uses to generate the pointers when you click "source"
			  from the documentation.
			- 'lint.json' if there is a mismatch between the docblock and the actual
			  code (e.g. arguments named differently), some data will end up here so
			  that esdoc can print a warning. Note that this warning ends up in 
			  log.txt (see below);
			- log.txt : anything printed to the console while esdoc is running 
			  (piped to this file to avoid cluttering the console).


	3. MERGE
		
		To merge, first the esdoc output from the doc/ folder is copied here, followed
		by the mustache output from mustache-web/public/. The order has to be like this
		because the mustache "index.html" overwrites the esdoc "index.html".
		
	4. ADD OTHER PAGES
		
		TODO : finish this section.
		
		Several other pages are copied at the end:
		- html pages from artistoo/examples/html (and also additional stuff like
		  the fpsmeter). These all go into "examples/";
		- files from ../mustache-web/sources/manual/asset copied into manual/asset/;
		- newest version of artistoo.js from the build/folder. This goes directly into
		  "examples/" AND into "manual/asset/" (for the iframes);
		- TODO: fix required pages from the converter somehow.
		

Mustache (details)
=========================
TODO


Esdoc (details)
=========================
TODO






Old (no longer applies with this infrastructure) : 
*	To change the headers of the autogenerated page: adjust the layout file 
	in the mytemplate folder. The contents of this file are used to build all auto-
	generated docs and manual files.
	
	(now: layout produced by mustache, adjust partials there).
	
*	When building the manual, even pages written in html get converted by the
	esdoc-publish-html-plugin. Unfortunately, this plugin has limited knowledge
	of HTML tags and escapes too much of the code. This happens in the script
	node_modules/esdoc-publish-html-plugin/out/src/Builder/util.js, in the function
	'markdown'. This function contains a variable availableTags that can be modified
	to add other html tags that should not be escaped. 
	
	(now: manual produced with mustache, directly from html).

