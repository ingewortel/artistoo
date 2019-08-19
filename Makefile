.SECONDARY:

all : build/cpm.js


# Dependencies are now kept up to date automatically from the file app/include-list.txt
MODULE_FILES := $(cat app/include-list.txt | awk '$$1 ~ /^module/{printf "%s ", $$3}' )

build/cpm.js: rollup.config.js app/index.js uptodate
	node_modules/rollup/bin/rollup -c && touch build.make

uptodate : build.make
	$(MAKE) -f $<
	
build.make: build-makeout.bash app/include-list.txt
	bash $^ > $@

# The app/index.js file is now generated automatically.
app/index.js : app/automatic-index.bash app/include-list.txt
	bash $^ > $@
	
docs/index.html : build/cpm.js
	node_modules/.bin/esdoc

docs : docs/index.html
