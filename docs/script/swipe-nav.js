// breakpoint for whether sidebar should default to open or closed:
const sidebarBreakPoint = '(max-width: 768px)'

// This variable will store whether the current screen is 'wide' (sidebar 
// default open) or 'small' (sidebar default closed)
let currentScreen = "wide";

// Functions to close/open the sidebar used below:
function closeSidebar(){
	$('.navigation').addClass('closed');
	$('.content').addClass('closed');
	$('#sidebarToggle').addClass('closed');
	$('#sideButtonIcon').removeClass('fa-chevron-left')
	$('#sideButtonIcon').addClass('fa-chevron-right')
}

function openSidebar(){
	$('.navigation').removeClass('closed');
	$('.content').removeClass('closed');
	$('#sidebarToggle').removeClass('closed');
	$('#sideButtonIcon').addClass('fa-chevron-left')
	$('#sideButtonIcon').removeClass('fa-chevron-right')	
}



// On resize, check if the screen has changed from wide <-> small and the sidebar
// should change:
$(window).resize(function (){

	// small screens: "active" when menu open (so active: chevron-left to close)
	if (window.matchMedia(sidebarBreakPoint).matches)
	{
		if( currentScreen !== "small" ){
			closeSidebar()
			currentScreen = "small"
		}
	} else {
		if( currentScreen !== "wide" ){
			openSidebar()
			currentScreen = "wide"
		}
	}
});


$(document).ready(function () {

	// on load of the document, if small screen, close the sidebar.
	if (window.matchMedia(sidebarBreakPoint).matches)
	{
		closeSidebar()
		currentScreen = "small"; 
	} 
	
	// listener for clicking the button
	$('#sidebarToggle').on('click', function () {
		$('.navigation').toggleClass('closed');
		$('.content').toggleClass('closed');
		$('#sidebarToggle').toggleClass('closed');
		$('#sideButtonIcon').toggleClass('fa-chevron-left fa-chevron-right')
	});
	
	let tooLongCode = document.querySelectorAll( 'table.summary span.code' )
	tooLongCode.forEach( function(x){ camelWrap(x) })
	
	
});

function camelWrap(node) {
  camelWrapUnicode(node);
  node.innerHTML = node.innerHTML.replace(/\u200B/g, "&shy;"); // <wbr>
}
function camelWrapUnicode(node) {
  for (node = node.firstChild; node; node = node.nextSibling) {
	if (node.nodeType==Node.TEXT_NODE) {
	  node.nodeValue = node.nodeValue.replace(/[\w:]{18,}/g, function(str) {
		return str.replace(/([a-z])([A-Z])/g, "$1\u00AD$2"); // 
	  });
	} else {
	  camelWrapUnicode(node);
	}
  }
}
	



// On the div with class swipe-area (see below), swiping can open/close the bar.
$(function() {      
  $(".swipe-area").swipe({
	swipeStatus:function(event, phase, direction, distance, duration, fingers)
		{
			if (phase=="move" && direction =="right" ) {
				openSidebar()
				return false;
			}
			if (phase=="move" && direction =="left" ) {
				closeSidebar()
				return false;
			}
		}
	});
});
