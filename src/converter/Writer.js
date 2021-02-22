
class Writer {

	constructor( model, config ){
		this.model = model

		this.conversionWarnings = {
			grid : [],
			time : [],
			constraints : [],
			init : [],
			analysis: []
		}

		this.target = config.target || undefined
		this.warningBox = config.warningBox || "console"
		this.lineW = config.lineW || 80

		this.logString = "Unknown converter.."
	}

	write(){

	}

	writeLog(){

		let log = this.logString + this.stringWrap(this.model.generalWarning
			, this.lineW, 2 ) + "Notes on the conversion process: \n\n"

		const read = Object.keys( this.model.conversionWarnings )
		const write = Object.keys( this.conversionWarnings )
		const warnTitles = [...new Set([...read ,...write])]

		for( let ch of warnTitles ){
			log += "\t" + ch.toUpperCase() + " :\n\t\t"
			// Reader warnings
			if( this.model.conversionWarnings.hasOwnProperty( ch ) ){
				if( this.model.conversionWarnings[ch].length > 0 ){
					let warnArray = [...new Set([...this.model.conversionWarnings[ch]]) ]
					log += "* Reading: " +
						this.stringWrap(warnArray.join(
							"\n"+"* ") + "\n", this.lineW, 2 )
				} else {
					log += "* Reading: No warnings; success.\n\t\t"
				}
			}

			// Writer warnings
			if( this.conversionWarnings.hasOwnProperty( ch ) ){
				const warnings = this.conversionWarnings[ch]
				if( warnings.length === 0 ){
					log += "* Writing: No changes; success.\n\n"
				} else {
					log += "* Writing: " + this.stringWrap(
						this.conversionWarnings[ch].join( "\n"+"* ") + "\n\n",
						this.lineW, 2 )
				}
			} else {
				log += "* Writing: No changes; success.\n\n"
			}

		}

		/*for( let ch of Object.keys( this.conversionWarnings ) ){
			log += "\t" + ch.toUpperCase() + " :\n\t\t"

			const warnings = this.conversionWarnings[ch]
			if( warnings.length === 0 ){
				log += "No changes; success!\n\n"
			} else {
				log += "* " + this.stringWrap(
					this.conversionWarnings[ch].join( "\n"+"* ") + "\n\n",
					this.lineW, 2 )
			}
		}

		log += "\n\nThere were also some properties I could not include: \n\n"

		for( let ch of Object.keys( this.model ) ){
			if( this.model[ch].hasOwnProperty( "warnings" ) && this.model[ch].warnings.length > 0 ){
				log += "\t" + ch.toUpperCase() + " :\n\t\t" +
					"* " +
					this.stringWrap(this.model[ch].warnings.join(
						"\n"+"* ") + "\n\n", this.lineW, 2 )
			}
		}*/


		if( this.warningBox === "console" ){
			//eslint-disable-next-line no-console
			console.log(log)
		} else {
			this.warningBox.innerHTML = log
		}

	}

	htmlNewLine( string ){
		let re = /\n/gi
		string = string.replace( re, "<br>\n")
		return string
	}

	recursiveArrayStringFix( obj ){
		for ( let k of Object.keys( obj ) )
		{

			if ( typeof obj[k] == "object" && obj[k] !== null && !Array.isArray( obj[k] ) )
				this.recursiveArrayStringFix(obj[k])
			else
			if( Array.isArray( obj[k] ) ){
				obj[k] = JSON.stringify( obj[k])
			}
		}

		return(obj)
	}

	objToString( obj, indent = 0 ){

		let indentStr = "\n"
		for( let i = 0; i < indent; i++ ){
			indentStr += "\t"
		}

		// Trick to print object nicely: we'll use JSON.stringify with option '\t'
		// to insert whitespace between entries, but this function is a little too
		// enthusiastic when it comes to arrays ( each element printed on a new line ).
		// So we first convert arrays [...] in the config object to strings "[...]",
		// which JSON.stringify sees as a single element and therefore prints on one line.
		// After this step, we remove the quotes again using string.replace() with a regexp
		// so that the stringified arrays once again become actual arrays.
		let obj2 = this.recursiveArrayStringFix( obj )
		let objString = JSON.stringify( obj2, null, "\t" )
		let re = /"\[/gi
		objString = objString.replace( re, "[" )
		re = /]"/gi
		objString = objString.replace( re, "]" )
		re = /\n/gi
		objString = objString.replace( re, indentStr )
		re = /\\"/gi
		objString = objString.replace( re, "\"" )
		objString = objString.replace( /null/gi, "NaN" )
		return objString
	}

	stringWrap( string, width = 60, indent = 1 ){

		let indentString = ""
		for( let i = 0; i < indent; i++ ){
			indentString += "\t"
		}

		// Dynamic Width (Build Regex)
		const wrap = (s, w) => s.replace(
			new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, "g"), "$1\n" + indentString
		)
		return wrap( string, width )
	}

}

export default Writer