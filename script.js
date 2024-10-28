const apiKey = 'b3113880c20e49ac9b25ef85312f5c0c';
const apiUrl = `https://api.rawg.io/api/games?key=${apiKey}`;

async function fetchGames(searchQuery = '') {
  try {
    const searchUrl = `${apiUrl}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`;
    const response = await fetch(searchUrl);
    if (!response.ok) throw new Error('Erro ao buscar jogos');

    const { results } = await response.json();
    const games = await Promise.all(results.map(async game => ({
      name: game.name,
      image: game.background_image,
      rating: (typeof game.metacritic === 'number' ? game.metacritic : 0).toFixed(1),
      description: await fetchGameDescription(game.id) || "Descrição não disponível.",
      platforms: game.platforms.map(p => p.platform.name).join(", "),
      releaseDate: new Date(game.released).toLocaleDateString('pt-BR')
    })));

    const formattedQuery = formattedInput(searchQuery);
    showListGames(games.filter(game =>
      formattedInput(game.name).includes(formattedQuery) ||
      game.name.toLowerCase().replace(/'/g, '').includes(formattedQuery)
    ));
  } catch (error) {
    console.error('Erro:', error);
  }
}

const formattedInput = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

async function fetchGameDescription(gameId) {
  try {
    const response = await fetch(`https://api.rawg.io/api/games/${gameId}?key=${apiKey}`);
    return (await response.json()).description_raw;
  } catch (error) {
    console.error('Erro ao buscar descrição do jogo:', error);
    return null;
  }
}

function showListGames(games) {
  const gameListElement = document.getElementById('result-container');
  gameListElement.innerHTML = games.length ? '' : '<p class="notification">Jogo não encontrado...</p>';

  games.forEach(game => {
    const hiddenDescription = game.description.length > 150 
      ? `${game.description.substring(0, 550)}...` 
      : game.description;

    const cardList = document.createElement('article');
    cardList.className = 'card-list';
    cardList.innerHTML = `
      <div class="box-content">
        <img src="${game.image}" alt="${game.name}">
        <span>Meta Score: <strong>${game.rating}</strong></span>
      </div>
      <div class="box-content">
        <h2>${game.name}</h2>
        <p data-full-text="${game.description}" data-hidden-text="${hiddenDescription}">
          ${hiddenDescription}
        </p>
        ${game.description.length > 150 ? '<button class="read-more">Leia mais</button>' : ''}
        <span class="date">Release Date: ${game.releaseDate}</span>
        <span>${game.platforms}</span>
      </div>
    `;
    gameListElement.appendChild(cardList);
  });

  document.querySelectorAll('.read-more').forEach(button =>
    button.addEventListener('click', toggleDescription)
  );
}

function toggleDescription(event) {
  const descriptionElement = event.target.previousElementSibling;
  const [fullText, hiddenText] = [descriptionElement.getAttribute('data-full-text'), descriptionElement.getAttribute('data-hidden-text')];
  const isExpanded = event.target.textContent === 'Leia menos';
  
  descriptionElement.textContent = isExpanded ? hiddenText : fullText;
  event.target.textContent = isExpanded ? 'Leia mais' : 'Leia menos';
}

function searchGames() {
  const searchInput = document.getElementById('search-input');
  const searchQuery = searchInput.value;
  fetchGames(searchQuery);

  searchInput.value = '';
}
fetchGames();



