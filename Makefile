all : build/cpm.js

build/cpm.js: app/index.js models/CPM.js DiceSet.js CPMChemotaxis.js Stats.js GridManipulator.js Canvas.js \
	rollup.config.js grid/Grid.js grid/Grid2D.js grid/Grid3D.js grid/GridInitializer.js \
	hamiltonian/Adhesion.js hamiltonian/HardVolumeRangeConstraint.js \
	hamiltonian/PerimeterConstraint.js hamiltonian/ActivityConstraint.js \
	hamiltonian/PreferredDirectionConstraint.js stats/PostMCSStats.js \
	hamiltonian/ChemotaxisConstraint.js hamiltonian/BarrierConstraint.js 
	node_modules/rollup/bin/rollup -c
