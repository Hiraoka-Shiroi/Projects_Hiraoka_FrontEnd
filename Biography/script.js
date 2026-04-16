const menu = document.getElementById('menu');
const openMenu = document.getElementById('openMenu');
const closeMenu = document.getElementById('closeMenu');

const openBio = document.getElementById('openBio');
const bioWindow = document.getElementById('bioWindow');
const closeBio = document.getElementById('closeBio');

// открыть меню
openMenu.onclick = () => {
    menu.classList.add('active');
};

// закрыть меню
closeMenu.onclick = () => {
    menu.classList.remove('active');
};

// открыть биографию
openBio.onclick = () => {
    bioWindow.style.display = 'block';
};

// закрыть биографию
closeBio.onclick = () => {
    bioWindow.style.display = 'none';
};
