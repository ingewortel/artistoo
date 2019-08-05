all : build/cpm.js

build/cpm.js: rollup.config.js app/index.js \
	src/models/CPM.js src/models/GridBasedModel.js src/models/CA.js \
	src/DiceSet.js src/Canvas.js \
	src/grid/Grid.js src/grid/Grid2D.js src/grid/Grid3D.js src/grid/GridManipulator.js src/grid/CoarseGrid.js \
	src/stats/PixelsByCell.js src/stats/CentroidsWithTorusCorrection.js src/stats/Centroids.js \
	src/hamiltonian/VolumeConstraint.js \
	src/hamiltonian/Adhesion.js src/hamiltonian/HardVolumeRangeConstraint.js \
	src/hamiltonian/PerimeterConstraint.js src/hamiltonian/ActivityConstraint.js \
	src/hamiltonian/Constraint.js src/hamiltonian/SoftConstraint.js src/hamiltonian/HardConstraint.js \
	src/hamiltonian/PersistenceConstraint.js src/stats/PostMCSStats.js \
	src/hamiltonian/ChemotaxisConstraint.js src/hamiltonian/BarrierConstraint.js \
	src/hamiltonian/PreferredDirectionConstraint.js src/hamiltonian/AttractionPointConstraint.js \
	src/hamiltonian/AdhesionMultiBackground.js src/hamiltonian/AutoAdderConfig.js \
	src/hamiltonian/ActivityMultiBackground.js \
	src/simulation/Simulation.js
	node_modules/rollup/bin/rollup -c
	
docs/index.html : build/cpm.js
	node_modules/.bin/esdoc

docs : docs/index.html