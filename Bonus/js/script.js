//  BONUS -- IDEE
// - grafica con modale a tutta pagina per le info del film  OK QUASI
// - select sort by per riordinare i film OK
// - select per scegliere lingua inglese o italiano
// - bottoni avanti indietro per cambiare pagina se ci sono più di 20 risultati OK
// - ricerca di partenza con film di tendenza (API discover di TMDB) e tasto home  OK
// - genre select che mostra solo generi effettivamente presenti OK


// TO-DO LIST
// si scoprì che i generi per film e serie tv hanno due api diverse e alcuni generi si sovrappongono altri no. Idea soluzione è fare una mega funzione che stampa tutti i generi film sia in ita che in inglese. poi stampare i generi serie tv in ita e inglese ma soltanto controllando prima di stampare se $("option [conID].eClasselingua") esiste già, non stampo. se no stampo. Altro metodo potrebbe essere stampare tutto e poi eliminare eventuali duplicati basandoti sul testo. l'idea sarebbe:
// - variabile array ok e variabile array da eliminare. -ciclo su tutte le option. - se $(this).text() non esiste negli array ok la matto negli array ok se esiste già metto $(this) cioè l'intera option nell'array da eliminare (che sarà quindi un array di "indirizzi") poi ciclo con each su array da eliminare e uso .remove()


// AGGIUNGI SORT DOPO LA STAMPA CHE SE UNO LASCIA SELEZIONATO RIORDINA
$(document).ready(init);

function init() {
  printGenresSelect("movie", "it-IT");
  printGenresSelect("movie", "en-EN");
  printGenresSelect("tv", "it-IT");
  printGenresSelect("tv", "en-EN");
  addSearchListeners();
  addFilterGenresListener();
  showInfo();
  // al caricamento della pagina faccio partire due send request in modo che la home siano i film più popolari
  sendRequest("ajaxdiscover", "movie", "1");
  sendRequest("ajaxdiscover", "tv", "1");
  addHomeButtonListener();
  addSortBySelectListener();
  addPageButtonsListener();
}

// FUNZIONE CHE CHIEDE ALL'API I GENERI DISPONIBILI E STAMPA LA SELECT
function printGenresSelect(type, lng){



  $.ajax({
    url: "https://api.themoviedb.org/3/genre/" + type + "/list",
    method: "GET",
    data: {
      "api_key": "db8b1c040d8d94836ca1164e898cff48", // la mia personale chiave api che utilizzano dal server per riconoscere quale utente sta facendo la ricerca
      "language": lng // scelgo la lingua italiana
    },
    success: function (data){
      var genres = data["genres"];
      var target = $("#genre-select");

      for (var i = 0; i < genres.length; i++) {

        if(!$(`#genre-select option[value="${genres[i]["id"]}"].${lng}`).length){ // se l'option con quell'id e quella lingua esistono già nell'html $(option[conID].classelingua).length == maggiore di uno a seconda di quanti ne trova. se non ci sono elementi corrispondenti a quella selezione la length è 0. quindi se non ci sono elementi la length 0 darebe falso, ci metto il ! not davanti e stampo la option solo se non c'è già. In questo modo evito sovrapposizioni tra i risultati della lista dei generi dei film e delle serietv

          optionHTML = `<option value="${genres[i]["id"]}" class="${lng}" >${genres[i]["name"]}</option>`;
          target.append(optionHTML);
        }

      }


    },
    error: function(err){
      console.log("err", err);
    }
  });

}


// ------------  FUNZIONI DI RICERCA E STAMPA IN PAGINA DELLE CARD

// LISTENER SU EVENTI CHE FANNO PARTIRE LA FUNZIONE CON L'AJAX
function addSearchListeners() {

 var buttonTarget = $("#btn-searchbar");

 buttonTarget.click(function(){// al click sul bottone "cerca" lancio la funzione sendRequest

   var input = $("#searchbar").val(); // prendo la stringa nell'input scritta dall'utente

   $("#searchbar").val(""); // svuoto l'input. la stringa resta comunque salvata nella variabile input

   if (input != "") {
     sendRequest(input, "movie", "1"); // faccio partire la funzione con lo stesso input prima per i film  poi per le serie tv
     sendRequest(input,"tv", "1");
   }

 });

 var keyupTarget = $("#searchbar");

 keyupTarget.keyup(function(event){ // listener del keyup sull'input "searchbar". Ascolta la pressione dei tasti sulla tastiera quando il focus è sulla barra di ricerca (la barra di ricerca è "selezionata")

   var input = $("#searchbar").val();


   if(event.which == 13 && input){ // se si preme invio e input esiste (input != "") lancio la funzione send request

     $("#searchbar").val(""); // svuoto l'input. la stringa resta comunque salvata nella variabile input

     sendRequest(input,"movie"); // faccio partire la funzione con lo stesso input prima per i film  poi per le serie tv
     sendRequest(input,"tv");
   }

 });

}

// FUNZIONE CHE MANDA UNA RICHIESTA ALL'API
function sendRequest(input, type, page) {

  var target = $(`#${type}-search-results`); // il target è dove andrò ad appendere l'html compilato da handlebars. Sono due target diversi per film e serie tv. uno è #films-search-results, l'altro tv-search-results.

  target.text(""); // prima svuoto il target dalle ricerche precedenti

  target.data("query", input); // salvo l'input in un data in modo da poterlo recuperare quando occorre. per esempio per passare alla pagina successiva

  var url = getUrl(input, type);

  var lng = $("#language-select").val(); // prendo la lingua dalla select


  $.ajax({
    url: url,
    method: "GET",
    data: {
      "api_key": "db8b1c040d8d94836ca1164e898cff48", // la mia percsonale chiave api che utilizzano dal server per riconoscere quale utente sta facendo la ricerca
      "query": input, // la query è la stringa su cui si farà la ricerca. gli passo quello che ha scritto l'utente nell'input. se è "ajaxdiscover" lascio input vuoto e verrà ignorato
      "language": lng, // gli passo la lingua dalla select
      "page": page
    },
    success: function (data, success) {
      var arrayResults = data["results"];

      pagesHandler(data, input, type); // questa funzione stampa in pagina il numero di pagine e attiva/disattiva i bottoni pagina avanti e pagina indietro

      if (arrayResults.length == 0){ // se sono nel success ma l'array di risultati è vuoto significa che ho cercato ma non ho trovato niente. stampo un messaggio per l'utente

        $(`#${type}-search-results`).html(`<h3>Non ci sono risultati per questa categoria.</h3>`);

      } else{

        $("#genre-select option").not(`option[value="all"].${lng}`).hide(); // nascondo tutte le option della select dei generi tranne all. Con la funzione showGenreSelectOption mostrerò soltanto quelli effettivamente presenti nei film in pagina

        for (var i = 0; i < arrayResults.length; i++) {

          printSearchResults(arrayResults[i], type); // la funzione con handlebars stampa tutte le card dei film risultanti dalla ricerca

          printCast(arrayResults[i], type); // la funzione cast ha bisogno di un ajax specifico sui credits del film. Dopo aver stampato in pagina il film e tutto lancio la chiamata identificando successivamente dove andare a stampare il cast attraverso l'id del film


          showGenreSelectOption(arrayResults[i], lng); // questa funzione mostra nelle select dei generi solo i generi presenti nei risultati della ricerca
        }

        printGenreNames(arrayResults, type)


        missingImages(); // questa funzione corregge eventuali errori per immagini mancanti sostituendo con altre immagini o avvisi appositi.

        sortCard(); // finito di stampare riordino anche le card in base alla selezione della select sort-by

        var selectedGenre = $("#genre-select").val();

        filterGenres(selectedGenre);

      }


    },
    error: function (err) {
      // a prescindere dall'errore se qualcosa non va lo segnalo all'utente
      $(`#${type}-search-results`).html(`<h3>Ops! Qualcosa è andato storto. Riprova</h3>`);
    }
  });

}


// FUNZIONE CHE RESTITUISCE L'URL PER L'AJAX A SECONDA DELL'INPUT E DEL TYPE
function getUrl(input, type) {
  if (input == "ajaxdiscover"){ // l'input discover è quello della pagina iniziale con i film più popolari. lo integro nella send request in modo da avere un unica funzione che gestisce tutte le ricerche. c'è da dire che l'utente non può cercare un film o una serie che si chiama ajaxdiscover. pace

    if(type == "movie"){ // cambio l'url a seconda se devo mandare una richiesta per cercare film o serie tv.
      var url = "https://api.themoviedb.org/3/discover/movie"; // url dell'API di TMDB per film
    } else {
      var url = "https://api.themoviedb.org/3/discover/tv"; // url dell'API di TMDB  serietv
    }

    input = ""; // la discover basta un url non è necessaria una stringa da ricercare. se comunque nell'ajax passo la chiave query con stringa vuota viene ignorata

  } else {

    if(type == "movie"){ // cambio l'url a seconda se devo mandare una richiesta per cercare film o serie tv.
      var url = "https://api.themoviedb.org/3/search/movie"; // url dell'API di TMDB per ricerca nei film
    } else {
      var url = "https://api.themoviedb.org/3/search/tv"; // url dell'API di TMDB per ricerca nelle serietv
    }
  }

  return url
}


// FUNZIONE CHE CON I DATI DEL FILM MANDA RICHIESTA DI UN API PER SAPERE I NOMI DEGLI ATTORI
function printCast(obj, type){
  // gli id sono univoci per categoria: film o serietv. servono due chiamate diverse.


  $.ajax({
    url:`https://api.themoviedb.org/3/${type}/${obj["id"]}/credits`,
    method: "GET",
    data: {
      "api_key": "db8b1c040d8d94836ca1164e898cff48", // la mia percsonale chiave api che utilizzano dal server per riconoscere quale utente sta facendo la ricerca
    },
    success: function (data) {

      var cast = data["cast"];
      var actors = [];
      var target = $(`#${type}-search-results li[data-id="${obj["id"]}"]`);

      if(cast.length == 0 || cast == undefined){ // ATTENZIONE: per mettere nelle condizioni array vuoto conviene usare array.length perchè un array vuoto in booleano è true. (non come le stringhe che in booleano danno false)
        actors = "nessun dato sul cast";

      } else{

        for (var i = 0; i < 5 && i < cast.length; i++) {
          actors.push(" " + cast[i]["name"]);
        }

      }

      target.find(".actors .actor-list").text(actors);

    },
    error: function (err) {
    // Spesso il cast non c'è in archivio. avendo comunque i dati del film faccio partire la funzione che stampa inizializzando l'array che contiene i nomi del cast ad undefined.
      var target = $(`#${type}-search-results li[data-id="${obj["id"]}"]`);
      target.find(".actors").html("<strong>Attori: </strong> nessun dato sul cast");
    }
  });

}

// FUNZIONE CHE STAMPA I RISULTATI DELLA RICERCA IN PAGINA
function printSearchResults(objResult, type) {

  var template = $("#result-template").html(); // salvo il template per handlebars in una variabile

  var compiled = Handlebars.compile(template); // nella variabile compiled ci sarà un funzione di handlebars che compila il template sostituendo le chiavi con i valori corrispondenti

  var target = $(`#${type}-search-results`); // il target è dove andrò ad appendere l'html compilato da handlebars. Sono due target diversi per film e serie tv. uno è #films-search-results, l'altro tv-search-results.

  var objToPrint = getObjToPrint(objResult, type) // a questa funzione passo tutti i dati ricevuti dalle due api. manipola i vari oggetti array e dati e mi restituisce un oggetto pronto per compilare il template di HANDLEBARS

  var objHTML = compiled(objToPrint); // compilo

  target.append(objHTML); // stampo nell'HTML

}

// FUNZIONE CHE CREA L'OGGETTO DA STAMPARE
function getObjToPrint(obj, type){

  // ----------     POSTER


  var poster = `https://image.tmdb.org/t/p/w342/${obj["poster_path"]}` // creo l'url del poster. è composto da url del database immagini (https://image.tmdb.org/t/p/) + dimensione dell'immagine richiesta (w185/) + ultima parte per identificare il film/serie tv fornita dall'api nell'oggetto alla chiave "poster_path"

  obj["poster"] = poster; // creo un apposita chiave nell'oggetto currentObj che avrà una corrispondenza nel template di Handlebars


  // ----------  BACKDROP POSTER

  var backdropPoster = `https://image.tmdb.org/t/p/w500/${obj["backdrop_path"]}`

  obj["back_poster"] = backdropPoster;
  // TITOLO E TITOLO ORIGINALE

    // alcune chiavi dell'oggetto mandato dall'API cambiano se la ricerca è per film o serie tv. nello specifico a me servono title e original_title che per le serie tv si chiamano name e original_name

  if(type == "tv"){
    obj["title"] = obj["name"];
    obj["original_title"] = obj["original_name"];
  }


  // -------   VOTO

  var stars = getStars(obj); // salvo nella variabile stars il risultato della funzione getStars passandogli come argomento l'oggetto contenete i dati del film.

  obj["stars"] = stars; // creo una nuova chiave nell'oggetto che contiene i dati del film. Quindi con handlebars utilizzo una serie di chiavi che ha già per compilare titolo del film e così. in questa nuova chiave invece salvo il codice html creato dalla funzione getStars per stampare il voto in forma grafica

  // ATTENZIONE: per comporre le stringhe invece di fare virgolette, apici, barra per saltare il carattere, più variabile ecc. si può utilizzare il carattere backtick (apici storti). In questo modo tra i due apici storti c'è la stringa intera a prescindere da virgolette apici singoli ecc. per metterci una variabile si uns ${variabile}. è una caratteristica di JS. non viene da librerie particolari. JS puro si chiama anche JS PLAIN o VANILLA

  // -----------     LANGUAGE FLAG

  var languageImg = `<img src="./img/flag/flag-${obj["original_language"]}.png" alt="flag-${obj["original_language"]}">`; // creo una variabile con una riga di codice html di un immagine. la src="" è composta dall'url che trova la cartella con le bandiere. i nomi delle bandiere sono sempre flag-(lingua).png la lingua la prendo dall'oggetto mandato dall'API alla chiave original_language. quindi per ogni lingua metterò nel template di Handlebars l'immagine della barriera corrispondente. Stampati tutti i risultati la funzione missingFlag interverrà in caso di immagine bandiera mancante


  obj["languageImg"] = languageImg;




  // ---------    TRAMA

  if(!obj["overview"]){ // se non è presente la trama scrivo trama non disponibile
    obj["overview"] = "Trama non disponibile."
  } else {

    // ---- se si volesse limitare la lunghezza della trama aggiungendo i puntini dopo 250 caratteri
    // if (obj["overview"].length > 250) { // se la trama è più lunga di 250 caratteri prendo solo i primi 250 e aggiungo "..." è tipo un text overflow fatto con js
    //   obj["overview"] = obj["overview"].substring(0, 250) + "...";
    // }
  }


  // -------- ANNO DI RILASCIO

  if(type == "movie"){

    obj["year"] = obj["release_date"].slice(0, 4);
  } else {
    obj["year"] = obj["first_air_date"].slice(0, 4);
  }

  return obj

}

// FUNZIONE CHE CREA UNA RAPPRESENTAZIONE GRAFICA DEI VOTI
function getStars(obj) {

  var vote = obj["vote_average"]; // prendo dall'oggetto dell'API il voto in decimali

  var numFullStars = Math.ceil(vote / 2); // il voto in decimali diviso per due e arrotondato per eccesso (Math.ceil) mi dice quante stelle devo essere "piene"

  var stars = "";

  for (var i = 0; i < 5; i++) { // ciclo for 5 volte per le 5 stelle

    if (i < numFullStars) { // se la i è minore al numero di stelle piene che devo creare aggiungo alla stringa contenuta nella variabile star il codice html che crea una stella piena (utilizzando fontawesome)
      stars += `<i class="fas fa-star col-y"></i>`
    } else { //  se ho già creato tutte le stelle piene continuo a ciclare fino a 5 aggiungendo alla stringa il codice html che crea stelle vuote.
      stars += `<i class="far fa-star"></i>`
    }
  }

  return stars // la funzione ritorna una stringa che sarà una serie di "<i class="fas fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i>". Nell'html si vedranno 5 stelle.
}

// FUNZIONE PER LA GESTIONE DI IMMAGINI MANCANTI
function missingImages() { // finito di stampare tutti i risultati della ricerca

  //BANDIERE MANCANTI
  $(".language img").on("error", function(){ // se c'è un errore nei tag selezionati (tutte le img contenute in un elemento con classe .language cioè tutte le immagini delle bandiere della lingua). si attiva la funzione. Se non trova l'immagine perchè non esiste da errore e quindi si attiva la funzione

    var target = $(this).parents(".language"); // $(this) è l'immagine che ha dato errore e ha triggerato la funzione. il parents con classe .language è il div che la contiene.

    var lng = target.data("lng"); // la funzione che stampa i risultati della ricerca salva nell'attributo data-lng del div la lingua del film (it per italiano, en per inglese ecc ). la vado a recuperare, la salvo nella variabile, e la sostituisco all'immagine "rotta". Sostituisco l'intero contenuto del target.

    target.html("<strong>Lingua: </strong>&ensp;" + lng);

  });

  // POSTER MANCANTI
  // questo si potrebbe risolvere anche con un if messo a monte: se manca l'url dell'immagine nell'oggetto restituito dall'api (currentObj["poster_path"] = null) allora currentObj["poster"] = "./img/imgNotFound.png" altrimenti
  // altra soluzione ancora: si può utilizzare if anche direttamente in handlebars {#if currentObj["poster_path"]} {{ url }} {/if} {else} {{url}} {/else}
  $(".poster>img").on("error", function(){ // se c'è un errore nellímmagine nel div con classe "poster" che sono le immagini appunto dei poster a quell'immagine do attributo src l'url della classica immagine "Image Not Found"
    $(this).attr("src", "./img/imgNotFound.png");
    $(this).siblings(".no-img-title").css("display", "block");
    $(this).parent(".poster").addClass("no-img");
  });

  $(".info-header>img").on("error", function(){
    $(this).attr("src", "./img/back-img-not-found.jpg");
  });
}

// FUNZIONE CHE MOSTRA NELLA SELECT DEI GENERI SOLTANTO I GENERI PRESENTI NEI FILM/TV STAMPATI IN PAGINA
function showGenreSelectOption(obj, lng){
  var arrayGenres = obj["genre_ids"];

  for (var i = 0; i < arrayGenres.length; i++) {
    $(`#genre-select option[value="${arrayGenres[i]}"].${lng}`).show(); // scorro tutti gli id di genere e mostro la option con value id del genere
  }
}

// FUNZIONE PER LA GESTIONE DEL CONTATORE DELLE PAGINE E DEI TASTI.
function pagesHandler(obj, query, type){

  var currentPageTarget = $(`#${type}-pages #${type}-current-page`);
  var totalPagesTarget = $(`#${type}-pages #${type}-total-pages`);

  // nell'oggetto di risposta se non ci sono risultati ti da totalpages 0 e page 1. per ovviare se non ci sono results do entrambi a 0 in modo che in pagina stamperò 0/0
  if (obj["results"].length == 0){
    var currentPage = 0;
    var totalPages = 0;

  } else {
    // altrimenti prendo il numero di pagina corrente
    var currentPage = obj["page"];
    var totalPages = obj["total_pages"];

  }

  currentPageTarget.text(currentPage);
  totalPagesTarget.text(totalPages);

  // gestione dei bottoni attraverso la classe active.

  var nextButtonTarget = $(`#${type}-pages #${type}-next-btn`);
  var prevButtonTarget = $(`#${type}-pages #${type}-prev-btn`);

  // tolgo la classe active a tutti i bottoni
  nextButtonTarget.removeClass("active");
  prevButtonTarget.removeClass("active");

  if (!(totalPages <= 1)){ // se il numero totale di pagine è 0 o 1 non attivo nessun bottone. da 2 in poi entro nel secondo if
    if (currentPage == 1){ // se sono a pagina 1 e le pagine sono almeno 2 attivo il pagina avanti e non quello pagina indietro
      nextButtonTarget.addClass("active");
    } else if (currentPage == totalPages){ // se sono all'ultima pagina attivo il bottone pagina indietro e non il pagina avanti
      prevButtonTarget.addClass("active");
    } else { // altrimenti attivo entrambi i bottoni
      nextButtonTarget.addClass("active");
      prevButtonTarget.addClass("active");
    }
  }


}

// FUNZIONE PER LA STAMPA DEI GENERI CON UN AJAX DELLA LISTA generi
function printGenreNames(arrayResults, type) {

  var lng = $("#language-select").val();

  $.ajax({
    url: "https://api.themoviedb.org/3/genre/" + type + "/list",
    method: "GET",
    data: {
      "api_key": "db8b1c040d8d94836ca1164e898cff48", // la mia personale chiave api che utilizzano dal server per riconoscere quale utente sta facendo la ricerca
      "language": lng // scelgo la lingua italiana
    },
    success: function (data){

      var genres = data["genres"];

      for (var i = 0; i < arrayResults.length; i++) {

        getGenresNames(arrayResults[i], genres, type);

      }


    },
    error: function(err){
      console.log("err", err);
    }
  });

}

// FUNZIONE CHE CREA LA LISTA DI GENERI
function getGenresNames(obj, genreList, type){

  var target = $(`#${type}-search-results li[data-id="${obj["id"]}"]`); // il target è la card del film stampata in pagina con il data-id corrispondente al film in questione


  var genreIds = obj["genre_ids"]; // per ogni film/serie prendo la lista di ids
  var genresNames = [];

  if (genreIds.length == 0){ // ATTENZIONE: per mettere nelle condizioni array vuoto conviene usare array.length perchè un array vuoto in booleano è true. (non come le stringhe che in booleano danno false)

    genresNames = "Nessun genere trovato";

  } else {

    for (var i = 0; i < genreIds.length; i++) { // se è presente una lista di ids ciclo sulla lista.

      var genreListElement = genreList.filter(function(e) { // questa funzione filtra l'array della lista generi e ritorna l'oggetto che ha alla chiave id (e["id"]) un valore che corrisponde al genreIds[i]. cioè io sto scorrendo su tutti gli genere id del singolo film che può avere più generi quindi sarà una roba tipo 34, 99. 1070 e io scorro e ne prendo uno alla volta. Poi dalla lista dei generi con relativi nomi (che è una roba tipo id34 nomeCommedia, id99 nomeAvventura) prendo quell'oggetto che ha lo stesso id
      return e["id"] == genreIds[i];
      });

      var genreName = genreListElement[0]["name"]; // la funzione di prima non restituisce un oggetto ma un array contenente tutti gli oggetti con quella caratteristica (stesso id) che essendo l'id univoco sarà un array con un solo oggetto (id: numero, name: nome del genere). Mi prendo il nome del genere e lo pusho in un array di tutti i nomi dei generi del film in questione

      genresNames.push(" " + genreName);
    }

    target.find(".genre-list").text(genresNames);
  }
}


// -------------------  FUNZIONI DI FILTRO DEI RISULTATI


// FUNZIONE CHE AGGIUNGE UN LISTENER ALLA SELECT CHE FILTRA PER GENERE
function addFilterGenresListener() {
  $("#genre-select").change(function(){

    var selectedGenre = $(this).val();

    filterGenres(selectedGenre);

  });
}

// FUNZIONE CHE FILTRA LE CARD DA VISUALIZZARE IN BASE AL GENERE
function filterGenres(selectedGenre){

  //  due diversi target per movie e serie tv. il genere selezionato viene passato come argomento. i generi sono sotto forma di id identificativo. se sono più generi nel data-genres trovo una stringa del tipo 99,880,25 se però è un genere solo nel data-genres troverò un numero
  var movieTarget = $("#movie-search-results li");

  var tvTarget = $("#tv-search-results li");

  if (selectedGenre == "all"){ // se ho selezionato all mostro tutte le card

    movieTarget.show();
    tvTarget.show();

  } else {
    // se ho selezionato un genere in partenza vado a nascondere tutte le card poi troverò quelle quelle corrispondenti al genere selezionato e mostrerò solo quelle
    movieTarget.hide();

    tvTarget.hide();

    movieTarget.each(function(){ // scorro tutti gli elementi li dei film (le mie card di film)

      var targetGenresIds = $(this).find(".genres").data("genres"); // per ognuno prendo i generi

      if(isNaN(targetGenresIds) && targetGenresIds.includes(selectedGenre)){ // se non è un numero e quindi è una stringa di generi utilizzo includes() per trovare le corrispondenze e mostrare le card

        $(this).show();

      }

      if (!isNaN(targetGenresIds) && targetGenresIds == selectedGenre){ // se il genere è uno solo e quindi data-genres è un numero e non una stringa non posso utilizzare includes() che funziona solo con le stringhe perciò utilizzo semplicemento un ==

        $(this).show();

      }

    });

    tvTarget.each(function(){ // ripeto le stesse operazioni per le card delle serie tv

      var targetGenresIds = $(this).data("genres");

      if(isNaN(targetGenresIds) && targetGenresIds.includes(selectedGenre)){

        $(this).show();

      }

      if (!isNaN(targetGenresIds) && targetGenresIds == selectedGenre){

        $(this).show();

      }

    });
  }

}

// FUNZIONE CHE AGGIUNGE UN LISTENER ALLA SELECT CHE RIORDINA LE card
function addSortBySelectListener(){

  $("#filters #sort-by-select").change(sortCard);

}

// FUNZIONE CHE RIORDINA LE CARD A SECONDA DEL PARAMETRO SELEZIONATO
function sortCard(){

  var movieTarget = $("#movie-search-results li");
  var tvTarget = $("#tv-search-results li");

  movieTarget.sort(sortBy).appendTo("#movie-search-results"); // il metodo sort accetta come parametro una funzione che definisce meglio come riordinare. Utilizzando .appendTo non aggiunge elementi ma ristampa gli stessi elementi nel nuovo ordine
  tvTarget.sort(sortBy).appendTo("#tv-search-results");

}

// FUNZIONE CHE GESTISCE IL RIORDINO DELLE CARD
function sortBy(a, b){

  // la funzione dentro al sort prende come argomenti a e b che rappresentano due generici elementi da riordinare. Se la funzione restituisce 1 l'elemento a va posizionato prima di b. -1 b prima di a. 0 non si scambiano. In questo caso nel li ho salvato dei data-attributo per ogni confronto che voglio fare. prendo il .val() della select e utilizzo il data corrispondente (data-popularity, data-title, data-year .. .. )

  var by = $("#sort-by-select").val();

  if (by == "title"){

    if ($(a).data(by) > $(b).data(by)){
      return 1
    } else if ($(a).data(by) < $(b).data(by)){
      return -1
    } else {
      return 0
    }

  } else {
    return ($(b).data(by) - $(a).data(by))
  }


}



// ------------------  BOTTONI E INTERAZIONI



// FUNZIONE LISTENER PER TASTI PAGINA AVANTI/PAGINA indietro
function addPageButtonsListener(){

  $("#movie-prev-btn").click(function(){

    if($(this).hasClass("active")){ // se clicco sul bottone e questo ha la classe active
      var query = $("#movie-search-results").data("query"); // prendo la query da dove l'ho salvata. Potrebbe essere "discover" o l'ultima ricerca fatta
      var currentPage = $("#movie-current-page").text(); // prendo dalla stampa in pagina che pagina sto visualizzando attualmente
      var page = parseInt(currentPage) - 1; // calcolo che pagina dovrò visualizzare

      sendRequest(query, "movie", page); // faccio una request con query, type, e numero di pagina
    }

  });

  $("#movie-next-btn").click(function(){

    if($(this).hasClass("active")){
        var query = $("#movie-search-results").data("query");
        console.log(query);
        var currentPage = $("#movie-current-page").text();
        var page = parseInt(currentPage) + 1;
        console.log(page);
        sendRequest(query, "movie", page);
      }
  });

  $("#tv-prev-btn").click(function(){

    if($(this).hasClass("active")){
      var query = $("#tv-search-results").data("query");
      var currentPage = $("#tv-current-page").text();
      var page = parseInt(currentPage) - 1;

      sendRequest(query, "tv", page);
    }

  });

  $("#tv-next-btn").click(function(){

    if($(this).hasClass("active")){
      var query = $("#tv-search-results").data("query");
      var currentPage = $("#tv-current-page").text();
      var page = parseInt(currentPage) + 1;

      sendRequest(query, "tv", page);
    }

  });

}

// FUNZIONE CHE AL TASTO HOME STAMPA I FILM PIù POPOLARI
function addHomeButtonListener(){
  $("#btn-home").click(function(){
    sendRequest("ajaxdiscover", "movie", "1");
    sendRequest("ajaxdiscover", "tv", "1");
  });
}

// FUNZIONE CHE MOSTRA LE INFO DEL FILM AL CLIK SULLA CARD
function showInfo(){

  $(document).on("click", "#movie-search-results li", function(){ // al click su un li della lista film mostro le info del film tipo modal

     $(this).find(".item-data-container").fadeIn(); // dal li cliccato cerco il figlio item data container e lo mostro

     $("body").addClass("stop-scroll"); // la classe stop-scroll da overflow: hidden al body in modo che quando ho aperto la modal la pagina sotto non possa più scrollare
  });

  $(document).on("click", "#tv-search-results li", function(){

     $(this).find(".item-data-container").fadeIn();

     $("body").addClass("stop-scroll");
  });


  $(document).on("click", ".item-data-container .close-icon i", function(e){ // al click sull'icona chiudi cerco il padre item data container e lo nascondo
      $(this).parents(".item-data-container").fadeOut();
      $("body").removeClass("stop-scroll");
  });

  $(document).on("click", ".item-data-container", function(e){ // al click su item-data-container che avendo width 100% e height 100vh è l'intera finestra chiudo la modale con le info del film

    e.stopImmediatePropagation(); // ATTENZIONE:  se io clicco su item-data-container il click si propaga nel senso che è come se cliccassi su tutti i genitori quindi per come è strutturato l'html anche sul li che lo contiene. ma il clic sul li apre la modale. quindi la modale si chiude e si riapre subito. stopImmediatePropagation() dice al js di eseguire la funzione e fermare la propagazione del click in questo modo si risolve
    $(this).fadeOut();
    $("body").removeClass("stop-scroll");

  });

  $(document).on("click", ".item-data-wrapper", function(e){
      e.stopImmediatePropagation(); // ATTENZIONE: per lo stesso principio di prima se io clicco nella modale il click arriva al padre item-data-container che col click chiude la modale. quindi fermo la propagazione. In linea teoriaca comunque la propagazione serve infatti quando io clicco sull'immagine del film il click si propaga fino al li che lo contiene e mostra la modale. Io posso cliccare su qualsiasi elemento all'interno del li e mi si apre la modale.
  });

}
