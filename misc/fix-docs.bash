# ESDOC by default does not display codeblocks with horizontal scroll bar if
# they are overflowing. This is ugly when the window is small.
# Fix this by copying a manually edited css file to the docs file after docs
# generation:
cp misc/style.css docs/css/style.css

# ESDOC does not recognize the HTML <iframe></iframe> tags, so displays this
# as text instead of an iframe. Fix this:

manualFiles=$(ls docs/manual/*.html)
tmpfile=docs/manual/tmp.txt

for f in $manualFiles; do
  echo -n > $tmpfile
  iFrame=0
  codeBlock=0
  while read line; do

    # check for the <iframe tag
    starttag=$( echo $line | grep "&lt;iframe" | wc -l )

    # if found, set the iFrame variable to 1
    if [ $starttag -gt 0 ] ; then
      iFrame=1
    fi

    # check for the <code> tag
    starttag=$( echo $line | grep "<code" | wc -l )

    # if found, set the codeBlock variable to 1
    if [ $starttag -gt 0 ] ; then
      codeBlock=1
      tabs=0
    fi

    # if the iFrame variable is 1, replace text to parse the iframe tag.
    if [ $iFrame -eq 1 ] ; then

      # check if the iframe ends on this line, and if so, reset iFrame=0.
      endtag=$( echo $line | grep "/iframe&gt;" | wc -l )
      if [ $endtag -gt 0 ] ; then
        iFrame=0
      fi

      # replace the text to get the proper iframe code back
      echo $line | sed 's/&lt;/</g' | sed 's/&quot;/"/g' | sed 's/&gt;/>/g' >> $tmpfile

    # if the codeBlock variable is 1, replace text to add tabs
    elif [ $codeBlock -eq 1 ] ; then

      # check if the codeblock ends on this line, and if so, reset codeBlock=0.
      endtag=$( echo $line | grep "</code>" | wc -l )
      if [ $endtag -gt 0 ] ; then
        codeBlock=0
      fi

      # Check if tabs need to be removed (if line starts with a closing brace)
      closeBraces=$( echo $line | sed -n '/^\s*}/p'  | wc -l )
      tabs=$( echo $tabs - $closeBraces | bc )

      # print line with the proper number of tabs
      if [ $tabs -gt 0 ] ; then
        for i in $( seq 1 $tabs ); do
          echo -e -n "\t" >> $tmpfile
        done
      fi
      echo $line >> $tmpfile

      # check if tabs needed to be added for the next line (if this line ends with "{")
      openBraces=$( echo $line | sed -n '/{\s*$/p' | wc -l )
      tabs=$( echo $tabs + $openBraces | bc )

    # otherwise print the line as it is
    else
      echo $line >> $tmpfile
    fi

  done < $f

  # when finished reading the file, copy tmp file back to original
  cp $tmpfile $f

done

#
#for f in $manualFiles; do
#  echo -n > $tmpfile
#  codeBlock=0
#  while read line; do
#
#    # check for the <code> tag
#    starttag=$( echo $line | grep "<code" | wc -l )
#
#    # if found, set the codeBlock variable to 1
#    if [ $starttag -gt 0 ] ; then
#      codeBlock=1
#      tabs=0
#    fi
#
#
#
#
#    # otherwise print the line as it is
#    else
#      echo $line >> $tmpfile
#    fi
#
#  done < $f
#
#  # when finished reading the file, copy tmp file back to original
#  cp $tmpfile $f
#
#done
