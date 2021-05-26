BEGIN{
}


/\/\*\*/ {
	injsdoc=1
}

/\*\// {
	if( injsdoc ){
		injsdoc=0
	}
}

match( $0, /@[a-z]+/ ) {
	if( injsdoc ){
		tag=substr( $0, RSTART, RLENGTH )
		if( tag == "@requires" ){
			$0 = " * " substr( $0, RSTART+RLENGTH )
		}
	}
}


{
	if( injsdoc && tag ){
		if( tag == "@requires" ){
			if( match( $0, /\*/ ) ){
				newstr = substr( $0, RSTART+RLENGTH )
			} else {
				newstr = $0
			}
			print newstr
			
		}
	}
}
