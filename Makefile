all : build/cpm.js

build/cpm.js: app/index.js CPM.js DiceSet.js
	rollup $< --file $@ --format iife --name "CPM"
