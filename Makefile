all : build/cpm.js

build/cpm.js: app/index.js CPM.js DiceSet.js CPMChemotaxis.js Stats.js GridManipulator.js Canvas.js \
	rollup.config.js Grid.js Grid2D.js Grid3D.js GridInitializer.js \
	hamiltonian/Adhesion.js hamiltonian/HardVolumeRangeConstraint.js \
	hamiltonian/PerimeterConstraint.js hamiltonian/ActivityConstraint.js \
	hamiltonian/PreferredDirectionConstraint.js
	node_modules/rollup/bin/rollup -c
