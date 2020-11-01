// Full Name: Adrian Iorga
// Student #: 124180191
// Seneca Email: aiorga - at - myseneca.ca
// Class: WEB322 NAA
// Assignment - Meal Kit Website
// ********************************


//detect how far the user has scrolled down the page
//https://stackoverflow.com/questions/11373741/detecting-by-how-much-user-has-scrolled
var scrollTop = () => (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

//change color of sticky header when scrolling past set amount
const scrollThreshold = 80;
var menuOpened = false;
let header = document.getElementById("header");
let logo = document.getElementById("logo");
var stickyHeader = () => {
    if(scrollTop()>scrollThreshold){
        header.style.backgroundColor = "#242424e8";
        header.style.padding = "5px 15px 5px 15px";
        //header.style.scale = "0.9";
        
    }
    else {
        if(!menuOpened) // dont make header transparent if menu still opened
            header.style.backgroundColor = "initial";
            header.style.padding = "15px";
            //header.style.scale = initial;
    }
}
stickyHeader();

//call stickyHeader function when scroll event happens
window.onscroll = () => {
    stickyHeader();
}

//for mobile/tablet devices, make dropdown appear when menu button clicked
var show_menu = document.getElementsByClassName("menu-button")[0];
show_menu.onclick = function() {
    let mobile_menu = document.getElementsByClassName("show-menu")[0];
    if(mobile_menu.style.display === "none"){
        mobile_menu.style.display = "block";
        header.style.backgroundColor = "#242424";
        menuOpened = true;
    }
    else{
        mobile_menu.style.display = "none";
        menuOpened = false;
        stickyHeader();
    }
}


//modal settings
const login = document.getElementById("login");
const register = document.getElementById("register");

const loginModal = () => {
    let loginClick = document.querySelectorAll(".login");
    for(let i = 0;i<loginClick.length;i++){
        loginClick[i].addEventListener("click", function(e){
            e.preventDefault();
            login.style.display = "block";
            register.style.display = "none";
        });
    }
}
const showLoginModal = () => {
    login.style.display = "block";
}
loginModal();

const registerModal = () => {
    let registerClick = document.querySelectorAll(".register");
    for(let i = 0;i<registerClick.length;i++){
        registerClick[i].addEventListener("click", function(e){
            e.preventDefault();
            register.style.display = "block";
            login.style.display = "none";
        });
    }
}
const showRegisterModal = () => {
    register.style.display = "block";
}
registerModal();


// Closing the modal windows
// login
let close_login = document.getElementsByClassName("close")[0];
close_login.onclick = function() {
    login.style.display = "none";
}
// register
let close_register = document.getElementsByClassName("close")[1];
close_register.onclick = function() {
    register.style.display = "none";
}
// clicking outside the modal should close modal also
window.onclick = function(event) {
  if (event.target == login || event.target == register) {
    login.style.display = "none";
    register.style.display = "none";
  }
}