all : build/cpm.js

build/cpm.js: rollup.config.js app/index.js \
	models/CPM.js models/GridBasedModel.js models/CA.js \
	DiceSet.js Canvas.js \
	grid/Grid.js grid/Grid2D.js grid/Grid3D.js grid/GridManipulator.js grid/CoarseGrid.js \
	stats/PixelsByCell.js stats/CentroidsWithTorusCorrection.js stats/Centroids.js \
	hamiltonian/VolumeConstraint.js \
	hamiltonian/Adhesion.js hamiltonian/HardVolumeRangeConstraint.js \
	hamiltonian/PerimeterConstraint.js hamiltonian/ActivityConstraint.js \
	hamiltonian/Constraint.js hamiltonian/SoftConstraint.js hamiltonian/HardConstraint.js \
	hamiltonian/PersistenceConstraint.js stats/PostMCSStats.js \
	hamiltonian/ChemotaxisConstraint.js hamiltonian/BarrierConstraint.js \
	hamiltonian/PreferredDirectionConstraint.js hamiltonian/AttractionPointConstraint.js \
	hamiltonian/AutoAdderConfig.js \
	simulation/Simulation.js
	node_modules/rollup/bin/rollup -c
