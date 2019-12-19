.SECONDARY:

all : build/cpm.js examples/html/cpm.js


# Dependencies are now kept up to date automatically from the file app/include-list.txt

examples/html/cpm.js : build/cpm.js
	cp $< $@

build/cpm.js: rollup.config.js app/index.js uptodate
	node_modules/rollup/bin/rollup -c && touch build.make

uptodate : build.make
	$(MAKE) -f $<
	
build.make: build-makeout.bash app/include-list.txt
	bash $^ > $@

# The app/index.js file is now generated automatically.
app/index.js : app/automatic-index.bash app/include-list.txt
	bash $^ > $@
	
docs/index.html : build/cpm.js README.md
	node_modules/.bin/esdoc

docs-examples : examples/html | docs/examples
	cp $</* docs/examples/
	
docs/examples :
	mkdir -p $@

docs : docs/index.html docs-examples

#cat $< | sed 's:./examples:../examples:g' | sed 's:./docs:../docs:g' > docs/index2.html && \
#mv docs/index2.html docs/index.html


# testing:

test-all :
	node node_modules/jasmine/bin/jasmine.js
	