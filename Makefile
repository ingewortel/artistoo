all : build/cpm.js

build/cpm.js: app/index.js CPM.js DiceSet.js CPMChemotaxis.js rollup.config.js
	rollup -c
