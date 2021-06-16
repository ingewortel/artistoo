.SECONDARY:


all : node-examples html-examples

EXAMPLES=SuperCells StochasticCorrector DiffusionLimitedAggregation ActModelCustomStat NoTorusDemo CancerInvasion ManyCellsDiffusion CollectiveMigration SIR ActOnMicroPattern GameOfLife Chemotaxis Diffusion DirectedMotionTargetPoint DirectedMotionLinear CellDivision SingleCell RandomWalk ManyCellsPrefDir IsingModel EpidermisWithTCells Epidermis Cellsorting ActModel Microchannel EpithelialSheet


../node/output/img/% :
	mkdir -p $@

../node-tests :
	mkdir -p $@


node-examples : $(foreach e, $(EXAMPLES), ../node/run-$(e).js )
html-examples : $(foreach e, $(EXAMPLES), ../html/$(e).html )
testscripts-examples :  $(foreach e, $(EXAMPLES), ../node-tests/test-$(e).js )


../html/%.html : write-html.bash simulation-files/%.js 
	bash $< $* > $@

../node/run-%.js : write-node.bash simulation-files/%.js | ../node/output/img/%
	bash $< $* > $@

../node-tests/test-%.js : ../node/run-%.js | ../node-tests
	cat $< | sed -E 's/RUNTIME([\s ]*):([\s ]*)([0-9]+)/RUNTIME : 100/g' |\
	sed -E 's/BURNIN([\s ]*):([\s ]*)([0-9]+)/BURNIN : 10/g' |\
	sed -E 's/SAVEIMG([\s ]*):([\s ]*)true/SAVEIMG : false/g' |\
	sed -E 's/LOGRATE([\s ]*):([\s ]*)([0-9]+)/LOGRATE : 200/g' > $@

run-node-examples : $(foreach e, $(EXAMPLES), run-node-$(e) )
run-node-% : ../node/run-%.js | ../node/output/img/%
	@cd ../node && node run-$*.js >> tmpout-$*.txt && rm tmpout-$*.txt && \
	echo $* "  : OK "

test-node-examples : $(foreach e, $(EXAMPLES), test-node-$(e) )
test-node-% : ../node-tests/test-%.js
	@cd ../node-tests && node test-$*.js >> tmpout-test-$*.txt && rm tmpout-test-$*.txt && \
	echo "\t"$* "  : OK "
	
	
