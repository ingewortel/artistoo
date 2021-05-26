.SECONDARY:
.DELETE_ON_ERROR:

all : public/index.html


# we also need to have the 'sources' folder; but no re-building required with mustache
# if the source files change.
dependencies=data/site.json $(wildcard templates/*.mustache) $(wildcard partials/**/* partials/*)


public/manual: 
	mkdir -p $@
	
public/explorables: 
	mkdir -p $@ 
	
#cp -r sources/* $@/

public/index.html : index.js $(dependencies) | public/manual public/explorables
	node $<

	