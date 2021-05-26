script -q /dev/null node node_modules/jasmine/bin/jasmine.js | tr -d '\r' | \
  awk -v WIDTH=80 '
  {
      while (length>WIDTH) {
          print substr($0,1,WIDTH);
          $0=substr($0,WIDTH+1);
      }
      print;
  }' | awk '{print "\t", $0}'