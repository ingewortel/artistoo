.SECONDARY:


all : node-examples html-examples

EXAMPLES=ActOnMicroPattern GameOfLife Chemotaxis Diffusion DirectedMotionTargetPoint DirectedMotionLinear CellDivision SingleCell RandomWalk ManyCellsPrefDir IsingModel EpidermisWithTCells Epidermis CellSorting ActModel Microchannel

html :
	mkdir -p $@
	
node :
	mkdir -p $@

node/output/img/% :
	mkdir -p $@

node-examples : $(foreach e, $(EXAMPLES), node/run-$(e).js )
html-examples : $(foreach e, $(EXAMPLES), html/$(e).html )

html/%.html : write-html.bash simulation-files/%.js | html
	bash $< $* > $@

node/run-%.js : write-node.bash simulation-files/%.js | node/output/img/%
	bash $< $* > $@


test-node-examples : $(foreach e, $(EXAMPLES), test-node-$(e) )
test-node-% : node/run-%.js
	@cd node && node run-$*.js >> tmpout-$*.txt && rm tmpout-$*.txt && \
	echo $* "  : OK "
	
	
