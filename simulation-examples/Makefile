all : node-examples html-examples

EXAMPLES=Cellsorting Actmodel Microchannel

html :
	mkdir -p $@
	
node :
	mkdir -p $@

node-examples : $(foreach e, $(EXAMPLES), node/run-$(e).js )
html-examples : $(foreach e, $(EXAMPLES), html/$(e).html )

html/%.html : write-example-html.bash | html
	bash $< $* > $@

node/run-%.js : write-example-node.bash | node
	bash $< $* > $@
	
