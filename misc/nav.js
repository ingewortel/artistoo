function openNav() {
  document.getElementById("mySidepanel").style.width = "250px";
  document.getElementById("mainContent").style["margin-left"] = "250px";
  document.getElementById("openbtn").style.display = "none";
}

/* Set the width of the sidebar to 0 (hide it) */
function closeNav() {
  document.getElementById("mySidepanel").style.width = "0";
  document.getElementById("mainContent").style["margin-left"] = "0";
  document.getElementById("mySidepanel").style.display = "none";
}