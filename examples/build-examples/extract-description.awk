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
		if( tag == "@file" ){
			$0 = " * " substr( $0, RSTART+RLENGTH )
		}
	}
}


{
	if( injsdoc && tag ){
		if( tag == "@file" ){
			if( match( $0, /\*/ ) ){
				print substr( $0, RSTART+RLENGTH )
			} else {
				print
			} 
		}
	}
}
