.SECONDARY:

all : build/artistoo.js examples/html/artistoo.js


# Dependencies are now kept up to date automatically from the file app/include-list.txt

examples/html/artistoo.js : build/artistoo.js
	@cp $< $@

build/artistoo.js: rollup.config.js app/index.js misc/uptodate
	@echo '		...Building package using node_modules/rollup/bin/rollup...' &&\
	node_modules/rollup/dist/bin/rollup -c && touch misc/build.make

misc/uptodate : misc/build.make
	@$(MAKE) -f $<
	
misc/build.make: misc/build-makeout.bash app/include-list.txt
	@bash $^ > $@

# The app/index.js file is now generated automatically.
app/index.js : app/automatic-index.bash app/include-list.txt
	@bash $^ > $@

# Esdoc documentation is used for, but not the sole basis of, the website;
# See the Makefile in the 'docs' folder to build the entire website
esdocs/index.html : build/artistoo.js README.md $(shell find manual -type f) $(wildcard esdoc-template-artistoo/**/*.html) $(wildcard esdoc-template-artistoo/*.html) $(wildcard spec/**/* )
	@echo  '		...Writing documentation with ESDOC, please wait...' &&\
	rm -rf esdocs && \
	mkdir -p esdocs && \
	node_modules/.bin/esdoc2 > esdocs/log.txt 
#cp build/artistoo.js manual/asset/ &&\

esdocs : esdocs/index.html


# testing:
test-jasmine :
	@echo "		...Running automated method tests using jasmine..." &&\
	bash misc/run-tests.bash

test-examples :
	@echo "		...Testing if the examples still work..." &&\
	cd examples/build-examples && $(MAKE) -f Makefile test-node-examples

test-all :
	@echo "		...Running automated tests..." &&\
	$(MAKE) -j 1 test-jasmine &&\
	$(MAKE) test-examples
