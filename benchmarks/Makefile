.SECONDARY:
.DELETE_ON_ERROR:



benchmarkScripts=collective-migration epidermis-with-tcells epidermis ising-model-3d ising-model
build-old=../build/artistoo-cjs.js
build-new=./artistoo-evol-cjs.js







out : 
	mkdir -p $@

out/%-time-old.txt : %.js $(build-old) | out
	@echo "...Running benchmark: $* (old build)" &&\
	node $^ | awk -v n=$* 'NR>1{print n "\t" $$0}' > $@ &&\
	node $^ | awk -v n=$* 'NR>1{print n "\t" $$0}' >> $@ &&\
	node $^ | awk -v n=$* 'NR>1{print n "\t" $$0}' >> $@ &&\
	node $^ | awk -v n=$* 'NR>1{print n "\t" $$0}' >> $@ &&\
	node $^ | awk -v n=$* 'NR>1{print n "\t" $$0}' >> $@


out/%-time-new.txt : %.js $(build-new) | out
	@echo "...Running benchmark: $* (new build)" &&\
	node $< "$(build-new)" | awk -v n=$* 'NR>1{print n "\t" $$0}' > $@ &&\
	node $< "$(build-new)" | awk -v n=$* 'NR>1{print n "\t" $$0}' >> $@ &&\
	node $< "$(build-new)" | awk -v n=$* 'NR>1{print n "\t" $$0}' >> $@ &&\
	node $< "$(build-new)" | awk -v n=$* 'NR>1{print n "\t" $$0}' >> $@ &&\
	node $< "$(build-new)" | awk -v n=$* 'NR>1{print n "\t" $$0}' >> $@
	
out/all-benchmarks-old.txt : $(foreach i, $(benchmarkScripts), out/$(i)-time-old.txt)
	cat $^ | awk '{print "old\t" $$0}' > $@
	
out/all-benchmarks-new.txt : $(foreach i, $(benchmarkScripts), out/$(i)-time-new.txt)
	cat $^ | awk '{print "new\t" $$0}' > $@
	
out/all-benchmarks.txt : out/all-benchmarks-old.txt out/all-benchmarks-new.txt
	cat $^ > $@