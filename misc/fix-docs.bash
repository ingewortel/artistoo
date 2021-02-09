
# ESDOC by default does not display codeblocks with horizontal scroll bar if
# they are overflowing. This is ugly when the window is small.
# Fix this by copying a manually edited css file to the docs file after docs
# generation:
cp misc/*.css docs/css/

# ESDOC does not recognize the HTML <iframe></iframe> tags, so displays this
# as text instead of an iframe. Fix this:

manualFiles=$(ls docs/manual/*.html)
tmpfile=docs/manual/tmp.txt

for f in $manualFiles; do
	echo $f
  cat $f > $tmpfile
  cat $tmpfile | sed $'s:<p>:\\\n<p>:' | sed $'s:</p>:\\\n</p>:' > $f
	
  echo -n > $tmpfile
  
  # Get the line with "</head>"
  headLine=$(cat $f | grep -n "</head>" | awk -F ":" '{print $1}')
  
  # Print everything up til this line
  cat $f | awk -v i=$headLine 'NR < i{print}' >> $tmpfile
  
  # Add the mathjax script here
  bash misc/add-mathjax.bash >> $tmpfile
  
  # Now print the </head> tag line
  cat $f | awk -v i=$headLine 'NR==i' >> $tmpfile
  
  # We start printing again at the next line
  nextline=$( echo "$headLine" + 1 | bc )  
  
  # Find the lines where something should be inserted:
  lines=$(grep -n "INSERTFROMFILE" $f | awk -F ":" '{print $1}')
  
  for line in $lines ; do
  
  	# Find the file to insert
  	number=$( cat $f | awk -v j=$line 'NR==j{print}' | sed 's/[^0-9]*//g' )
  	echo $number
  
  	# Print all lines from nextline to (but not including) this one:
  	cat $f | awk -v i=$nextline -v j=$line 'NR >= i && NR < j{print}' >> $tmpfile
  	
  	# Insert the file to insert
  	cat manual/inserts/ins$number.txt >> $tmpfile
  	
  	# Update nextline
  	nextline=$( echo "$line + 1" | bc )
  
  done
  
  # Finally print the remainder of the file
  cat $f | awk -v i=$nextline 'NR>=i{print}' >> $tmpfile
  
  
  
  
  #mathAdded=0
  #while read line; do
  
  #	# Check for the end of the head, so the </head> tag. 
  #	# Before printing this, print the lines to add the mathjax scripts:
  #	if [ $mathAdded -eq 0 ]; then
  #		headend=$( echo $line | grep "</head>" | wc -l )
  #		if [ $headend -gt 0 ] ; then
#			bash misc/add-mathjax.bash >> $tmpfile
#			mathAdded=1
#		fi
#	fi

    
  #  insert=$(echo $line | grep "INSERTFROMFILE" | wc -l)
    	
  #  if [ $insert -eq 0 ] ; then
  #  	echo $line | sed 's/&lt;/</g' | sed 's:&gt;:>:g' >> $tmpfile
  #  else
  #    insnum=$(echo $line | sed 's/[^0-9]*//g')
  #    echo "" >> $tmpfile
  #    insfile=manual/inserts/ins$insnum.txt
  #    echo $insfile
  #    cat $insfile >> $tmpfile
  #    echo "" >> $tmpfile
  #  fi

  #done < $f

  # when finished reading the file, copy tmp file back to original
  cp $tmpfile $f

done

# Copy custom html pages
cp misc/examples.html docs/examples.html

# ESDOC by default does not display codeblocks with horizontal scroll bar if
# they are overflowing. This is ugly when the window is small.
# Fix this by copying a manually edited css file to the docs file after docs
# generation:
cp misc/*.css docs/css/