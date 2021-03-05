.SECONDARY:

all : build/artistoo.js examples/html/artistoo.js


# Dependencies are now kept up to date automatically from the file app/include-list.txt

examples/html/artistoo.js : build/artistoo.js
	@cp $< $@

build/artistoo.js: rollup.config.js app/index.js misc/uptodate
	@echo '...Building package using node_modules/rollup/bin/rollup...' &&\
	node_modules/rollup/dist/bin/rollup -c && touch misc/build.make

misc/uptodate : misc/build.make
	@$(MAKE) -f $<
	
misc/build.make: misc/build-makeout.bash app/include-list.txt
	@bash $^ > $@

# The app/index.js file is now generated automatically.
app/index.js : app/automatic-index.bash app/include-list.txt
	@bash $^ > $@

docs/index.html : build/artistoo.js README.md spec $(shell find manual -type f) 
	@echo  '...Writing documentation with ESDOC, please wait...' &&\
	cp build/artistoo.js manual/asset/ &&\
	node_modules/.bin/esdoc > docs/log.txt && bash misc/fix-docs.bash &&\
	cp misc/index2.html docs/index.html

docs-examples : examples/html | docs/examples
	@cp $</* docs/examples/ && \
	cp examples/3D/cpm3d.html docs/examples/ && \
	cp examples/3D/Canvas3D.js docs/examples/ && \
	cp examples/3D/OrbitControls.js docs/examples/
	
docs/converter.html : misc/converter.html
	cp $< $@ && cp -r converter-page docs/converter
	
docs/examples :
	@mkdir -p $@

docs : docs/index.html docs-examples docs/converter.html

#cat $< | sed 's:./examples:../examples:g' | sed 's:./docs:../docs:g' > docs/index2.html && \
#mv docs/index2.html docs/index.html


# testing:
test-jasmine :
	@echo "...Running automated method tests using jasmine..." &&\
	bash misc/run-tests.bash

test-examples :
	@echo "...Testing if the examples still work..." &&\
	cd examples/build-examples && $(MAKE) -f Makefile test-node-examples

test-all :
	@echo "...Running automated tests..." &&\
	$(MAKE) -j 1 test-jasmine &&\
	$(MAKE) test-examples
