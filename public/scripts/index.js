//import { uiManager } from "./uiManager";
(function () {
  //Variaáveis de autenticação
  const params = getHashParams();
  let access_token = params.access_token,
    refresh_token = params.refresh_token,
    error = params.error;

  //Funções utilitárias
  function getHashParams() {
    var hashParams = {};
    var e,
      r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);

    while ((e = r.exec(q))) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  async function getData(apiType, extra) {
    let url;
    switch (apiType) {
      case "meta-data":
        url = "https://api.spotify.com/v1/me";
        break;
      case "personalization":
        url = "https://api.spotify.com/v1/me/top/" + extra;
        break 
        case 'player-data': url = "https://api.spotify.com/v1/me/player/" + extra;
    }

    const rawData = await fetch(url, {
      headers: {
        Authorization: "Bearer " + access_token,
      },
    });
    const data = await rawData.json();
    
    return data;
  }

  function implementTemplate(type, element, position) {
    if (type === "artist") {
      const artist = element;
      return `
          <div class="artist">
            <span class="position-number">${position || ""}</span>
            <img class="image-in-container" src='${artist.images[0]}'>
            <h3>${artist.name}</h3>
          </div>
          `;
    } else if (type === "track") {
      const track = element;
      return `
          <div class="artist">
            <span class="position-number">${position}</span>
            <img class="image-in-container" src='${track.album.images[2].url}'>
            <div>
              <h3>${track.name.split("-")[0]}</h3>
              <p>${track.artists[0].name}</p>
            </div>
          </div>
        `;
    } else if(type === 'recent_played') {
      const track = element.track
      const date = getFormatedDate()

      function getFormatedDate() {
        const played_at = element.played_at.split('T')[0].split('-')
        const currentDate = new Date().toISOString().split("T")[0].split("-");
        const playedThisMonth = currentDate[0] === played_at[0] && currentDate[1] === played_at[1]
        const playedToday = playedThisMonth && (currentDate[2] === played_at[2] )
        const playedYesterday = playedThisMonth && currentDate[2] - played_at[2] === 1

        let dateString;

        if(playedToday) dateString = 'hoje'
        else if(playedYesterday) dateString = 'ontem'
        else dateString = played_at.join('-')

        return dateString
      }

      return `
      <div class="recent-played-track">
        <h4>${track.name} <span>(${track.artists[0].name})</span></h4>
        <h5>${date}</h5>
      </div>
      `;
    }
  }


  // manipulação da UI
  const uiManager = {
    metaData: getData("meta-data"),
    topArtistsData: getData("personalization", "artists"),
    topTraksData: getData("personalization", "tracks"),
    //currentPlayingData: getData("player-data", "currently-playing"),
    recentPlayedData: getData("player-data", "recently-played"),
    uiIsLoading: true,

    async renderUserMetadata() {
      const userInfo = await this.metaData;

      const userInfoContainer = document.querySelector("#user-info-container");

      const imageElement = document.createElement("img");
      const usernameElement = document.createElement("h2");

      console.log(userInfo)

      imageElement.setAttribute("src", userInfo.images.length ? userInfo.images[0].url : '../assets/user-default-image.png');
      usernameElement.textContent = userInfo.display_name;

      //put in the DOMd
      userInfoContainer.append(imageElement);
      userInfoContainer.append(usernameElement);
    },

    async renderList(data, template, containerId) {
      const dataElements = await data;
      const elements = dataElements.items;
      const container = document.querySelector("#" + containerId);
      let position = 0;

      container.innerHTML = "";

      elements.forEach((element) => {
        position++;
        container.innerHTML += implementTemplate(template, element, position);
      });
    },

    async renderCurrentPlaying() {
      const currentPlaying = await this.currentPlayingData;
    },

    async renderRecentlyPlayed() {
      const recent = await this.recentPlayedData
    },

    renderInitialData() {
      this.renderList(this.topArtistsData, "artist", "artists-place");
      this.renderList(this.topTraksData, "track", "tracks-place");
      //this.renderCurrentPlaying();
      this.renderList(
        this.recentPlayedData,
        "recent_played",
        "history-place"
      );
      this.renderUserMetadata().then(() => {
        uiManager.uiIsLoading = false;
        uiManager.handleLoading();
      });
    },

    handleLoading() {
      const loadingContainer = document.querySelector("#loading-container");
      const wrapper = document.querySelector("#wrapper");
      if (!this.uiIsLoading) {
        loadingContainer.classList.add("hidden");
        wrapper.classList.remove("hidden");
      }
    },

    async handleFilter(type, option) {
      const data = await getData(
        "personalization",
        type + "/" + "?time_range=" + option
      );
      const template = type.slice(0, -1);
      this.renderList(data, template, type + "-place");
    },
  };

  //inicialização
  function init() {
    uiManager.renderInitialData();

    //Colocar hash no session storage
    sessionStorage.setItem('hash', location.hash)

    document.querySelectorAll("select").forEach((select) => {
      select.addEventListener("change", (e) => {
        const type = e.target.name.split('time_range_')[1]
        uiManager.handleFilter(type, e.target.value);
      });
    });
  }
  init();
})();
