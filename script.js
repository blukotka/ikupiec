const API_KEY = "951634f66e4f07cb338fd4a1f12e5447";

const btn = document.getElementById('btnWeather');
const cityInput = document.getElementById('city');
const currentSection = document.getElementById('current');
const currentContent = document.getElementById('currentContent');
const forecastSection = document.getElementById('forecast');
const forecastContent = document.getElementById('forecastContent');

function showError(msg){
  currentSection.classList.remove('hidden');
  currentContent.innerHTML = `<div style="color:#b91c1c">${msg}</div>`;
  forecastSection.classList.add('hidden');
}

btn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (!city) { showError('Wpisz miasto.'); return; }
  getCurrentWeather(city);
  getForecast(city);
});

function getCurrentWeather(city){
  if (!API_KEY) {
    showError('Brak klucza API.');
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=pl&appid=${API_KEY}`;

  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        console.log("CURRENT (XMLHttpRequest):", data);
        renderCurrent(data);
      } else {
        showError("Nie znaleziono miasta.");
      }
    }
  };
  xhr.send();
}

function renderCurrent(data){
  currentSection.classList.remove('hidden');

  const name = `${data.name}, ${data.sys.country}`;
  const temp = Math.round(data.main.temp);
  const feels = Math.round(data.main.feels_like);
  const desc = data.weather[0].description;
  const icon = data.weather[0].icon;

  currentContent.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;">
      <div class="current-temp">${temp}°C</div>
      <div>
        <div style="font-weight:700">${name}</div>
        <div class="current-desc">${desc} — odczuwalne: ${feels}°C</div>
      </div>
    </div>
    <div style="margin-left:auto">
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png">
    </div>
  `;
}
async function getForecast(city){
  if (!API_KEY) return;

  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&lang=pl&appid=${API_KEY}`;

  console.log("Wywołuję getForecast dla:", city);
  console.log("URL:", url);

  try {
    const res = await fetch(url);
    console.log("Status fetch:", res.status, res.statusText);
    if (!res.ok) {
      console.error("Nie udało się pobrać forecastu:", res.status, res.statusText);
      showError("Nie udało się pobrać prognozy.");
      return;
    }
    const data = await res.json();
    console.log("FORECAST (fetch):", data);
    renderForecast(data);

  } catch(e){
    console.error("Błąd fetch:", e);
  }
}


function renderForecast(data){
  const list = data.list;
  const grouped = {};

  list.forEach(item => {
    const date = item.dt_txt.split(" ")[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(item);
  });

  const days = Object.keys(grouped).slice(0, 5);
  forecastContent.innerHTML = "";

  days.forEach(day => {
    const items = grouped[day];
    let best = items[0];
    let bestDiff = Infinity;

    items.forEach(i => {
      const hour = new Date(i.dt * 1000).getHours();
      const diff = Math.abs(hour - 12);
      if (diff < bestDiff) { bestDiff = diff; best = i; }
    });

    const temp = Math.round(best.main.temp);
    const desc = best.weather[0].description;
    const icon = best.weather[0].icon;

    const weekday = new Date(best.dt * 1000).toLocaleDateString("pl-PL", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });

    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <div class="day">${weekday}</div>
      <img src="https://openweathermap.org/img/wn/${icon}.png">
      <div class="temp">${temp}°C</div>
      <div style="font-size:13px;color:var(--muted)">${desc}</div>
    `;

    forecastContent.appendChild(card);
  });

  forecastSection.classList.remove('hidden');
}
