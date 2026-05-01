const grid = document.getElementById('afisha');
const contactBtn = document.getElementById('contactBtn');

// КНОПКА СВЯЗЬ (простой скролл как раньше)
if (contactBtn) {
  contactBtn.addEventListener('click', () => {
    const contact = document.getElementById('contact');
    if (contact) {
      contact.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// ЗАГРУЗКА АФИШИ ИЗ JSON (как задумано)
async function loadAfisha() {
  try {
    const res = await fetch('afisha.json');
    const data = await res.json();

    if (!grid) return;

    grid.innerHTML = '';

    data.forEach((item) => {
      const a = document.createElement('a');
      a.className = 'card';
      a.href = item.link;
      a.target = '_blank';

      const img = document.createElement('img');
      img.src = item.image;

      const title = document.createElement('div');
      title.className = 'info';
      title.textContent = item.title;

      const desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = item.description;

      a.appendChild(img);
      a.appendChild(title);
      a.appendChild(desc);

      grid.appendChild(a);
    });

  } catch (err) {
    console.error('AFISHA LOAD ERROR:', err);
    if (grid) {
      grid.innerHTML = '<p style="opacity:0.6">Афиша не загрузилась (проверь afisha.json)</p>';
    }
  }
}

loadAfisha();

// Блок правой кнопки мыши (ПК)
document.addEventListener("contextmenu", function (e) {
  e.preventDefault();
  return false;
});

// Блок выделения текста (чтобы не было синего)
document.addEventListener("selectstart", function (e) {
  e.preventDefault();
  return false;
});

// Блок копирования
document.addEventListener("copy", function (e) {
  e.preventDefault();
  return false;
});

// Блок перетаскивания (drag)
document.addEventListener("dragstart", function (e) {
  e.preventDefault();
  return false;
});
