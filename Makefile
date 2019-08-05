all : build/cpm.js


# Dependencies are now kept up to date automatically from the file app/include-list.txt
MODULE_FILES := $(cat app/include-list.txt | awk '$$1 ~ /^module/{printf "%s ", $$3}' )

build/cpm.js: rollup.config.js app/index.js $(MODULE_FILES)
	node_modules/rollup/bin/rollup -c

# The app/index.js file is now generated automatically.
app/index.js : app/automatic-index.bash app/include-list.txt
	bash $^ > $@
	
docs/index.html : build/cpm.js
	node_modules/.bin/esdoc

docs : docs/index.html
