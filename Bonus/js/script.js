//  BONUS -- IDEE
// - grafica con modale a tutta pagina per le info del film  OK QUASI
// - select sort by per riordinare i film OK
// - select per scegliere lingua inglese o italiano
// - bottoni avanti indietro per cambiare pagina se ci sono più di 20 risultati
// - ricerca di partenza con film di tendenza (API discover di TMDB) e tasto home  OK
// - genre select che mostra solo generi effettivamente presenti OK


// AGGIUNGI SORT DOPO LA STAMPA CHE SE UNO LASCIA SELEZIONATO RIORDINA
$(document).ready(init);

function init() {
  printGenresSelect();
  addSearchListeners();
  addFilterGenresListener();
  showInfo();
  sendDiscoverRequest("movie");
  sendDiscoverRequest("tv");
  addHomeButtonListener();
  addSortBySelectListener();
}

// FUNZIONE CHE CHIEDE ALL'API I GENERI DISPONIBILI E STAMPA LA SELECT
function printGenresSelect(){

  $.ajax({
    url: "https://api.themoviedb.org/3/genre/movie/list",
    method: "GET",
    data: {
      "api_key": "db8b1c040d8d94836ca1164e898cff48", // la mia personale chiave api che utilizzano dal server per riconoscere quale utente sta facendo la ricerca
      "language": "it-IT" // scelgo la lingua italiana
    },
    success: function (data){
      var genres = data["genres"];
      var target = $("#genre-select");

      for (var i = 0; i < genres.length; i++) {
        optionHTML = `<option value="${genres[i]["id"]}" >${genres[i]["name"]}</option>`;
        target.append(optionHTML);
      }


    },
    error: function(err){
      console.log("err", err);
    }
  });

}

// LISTENER SU EVENTI CHE FANNO PARTIRE LA FUNZIONE CON L'AJAX
function addSearchListeners() {

 var buttonTarget = $("#btn-searchbar");

 buttonTarget.click(function(){// al click sul bottone "cerca" lancio la funzione sendRequest

   var input = $("#searchbar").val(); // prendo la stringa nell'input scritta dall'utente

   $("#searchbar").val(""); // svuoto l'input. la stringa resta comunque salvata nella variabile input

   if (input != "") {
     sendRequest(input, "movie"); // faccio partire la funzione con lo stesso input prima per i film  poi per le serie tv
     sendRequest(input,"tv");
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
function sendRequest(input, type) {

  var target = $(`#${type}-search-results`); // il target è dove andrò ad appendere l'html compilato da handlebars. Sono due target diversi per film e serie tv. uno è #films-search-results, l'altro tv-search-results.

  target.text(""); // prima svuoto il target dalle ricerche precedenti

  if(type == "movie"){ // cambio l'url a seconda se devo mandare una richiesta per cercare film o serie tv.
    var url = "https://api.themoviedb.org/3/search/movie"; // url dell'API di TMDB per ricerca nei film
  } else {
    var url = "https://api.themoviedb.org/3/search/tv"; // url dell'API di TMDB per ricerca nelle serietv
  }

  $.ajax({
    url: url,
    method: "GET",
    data: {
      "api_key": "db8b1c040d8d94836ca1164e898cff48", // la mia percsonale chiave api che utilizzano dal server per riconoscere quale utente sta facendo la ricerca
      "query": input, // la query è la stringa su cui si farà la ricerca. gli passo quello che ha scritto l'utente nell'input
      "language": "it-IT" // scelgo la lingua italiana
    },
    success: function (data, success) {
      var arrayResults = data["results"];
        if (arrayResults.length == 0){ // se sono nel success ma l'array di risultati è vuoto significa che ho cercato ma non ho trovato niente. stampo un messaggio per l'utente

          $(`#${type}-search-results`).html(`<h3>Non ci sono risultati per questa categoria.</h3>`);

        } else{

          $("#genre-select option").not(`option[value="all"]`).hide();

          for (var i = 0; i < arrayResults.length; i++) {

            printSearchResults(arrayResults[i], type);

            printCast(arrayResults[i], type);

          }

          for (var i = 0; i < arrayResults.length; i++) { // questa funzione mostra i nelle option della select dei generi i generi corrispondenti ai vari film/tv stampati in pagina
            showGenreSelectOption(arrayResults[i]);
          }

          missingImages(); // questa funzione corregge eventuali errori per immagini mancanti sostituendo con altre immagini o avvisi appositi.

          sortCard(); // finito di stampare riordino anche le card in base alla selezione della select sort-by

        }


    },
    error: function (err) {
      // a prescindere dall'errore se qualcosa non va lo segnalo all'utente
      $(`#${type}-search-results`).html(`<h3>Ops! Qualcosa è andato storto. Riprova</h3>`);
    }
  });

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

      target.find(".actors").html("<strong>Attori: </strong>" + actors);

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
    if (obj["overview"].length > 250) { // se la trama è più lunga di 250 caratteri prendo solo i primi 250 e aggiungo "..." è tipo un text overflow fatto con js
      obj["overview"] = obj["overview"].substring(0, 250) + "...";
    }
  }




  // --------  GENERI

  var genres = getGenresNames(obj);

  obj["genres"] = genres;

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

// FUNZIONE CHE CREA LA LISTA DI GENERI
function getGenresNames(obj){

  var ids = obj["genre_ids"]; // per ogni film/serie prendo la lista di ids
  var genres = [];

  if (ids.length == 0){ // ATTENZIONE: per mettere nelle condizioni array vuoto conviene usare array.length perchè un array vuoto in booleano è true. (non come le stringhe che in booleano danno false)

    genres = "Nessun genere trovato";

  } else {

    for (var i = 0; i < ids.length; i++) { // se è presente una lista di ids ciclo sulla lista. Nella select dei generi ho delle option con id del genre nel value e nome corrispondente nel testo della option. Userò quelle
      var listGenreId = $(`#genre-select option[value="${ids[i]}"]`); // seleziono la option con l'ID corrispondente a un id della lista id dei generi del film in oggetto

      var listGenreName = listGenreId.text(); // prendo il text di quella option

      genres.push(" " + listGenreName); // lo pusho in un array dei generi con uno spazio per separarli. La virgola tra uno e l'altro la stampa in automatico quando stampi un array.
    }
  }

  return genres // la funzione ritorna la lista di generi
}

// FUNZIONE PER LA GESTIONE DI IMMAGINI MANCANTI
function missingImages() { // finito di stampare tutti i risultati della ricerca

  //BANDIERE MANCANTI
  $(".language img").on("error", function(){ // se c'è un errore nei tag selezionati (tutte le img contenute in un elemento con classe .language cioè tutte le immagini delle bandiere della lingua). si attiva la funzione. Se non trova l'immagine perchè non esiste da errore e quindi si attiva la funzione

    var target = $(this).parents(".language"); // $(this) è l'immagine che ha dato errore e ha triggerato la funzione. il parents con classe .language è il div che la contiene.

    var lng = target.data("lng"); // la funzione che stampa i risultati della ricerca salva nell'attributo data-lng del div la lingua del film (it per italiano, en per inglese ecc ). la vado a recuperare, la salvo nella variabile, e la sostituisco all'immagine "rotta". Sostituisco l'intero contenuto del target.

    target.text(lng);

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
    $(this).attr("src", "./img/imgNotFound.png");
  });
}

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

// FUNZIONE CHE MOSTRA LE INFO DEL FILM AL CLIK SULLA CARD
function showInfo(){

  $(document).on("click", "#movie-search-results li", function(){ // al click su un li della lista film mostro le info del film tipo modal

     $(this).find(".item-data-container").fadeIn(); // dal li cliccato cerco il figlio item data container e lo mostro

  });

  $(document).on("click", "#tv-search-results li", function(){

     $(this).find(".item-data-container").fadeIn();

  });


  $(document).on("click", ".item-data-container .close-icon i", function(e){ // al click sull'icona chiudi cerco il padre item data container e lo nascondo
      $(this).parents(".item-data-container").fadeOut();
  });

  $(document).on("click", ".item-data-container", function(e){ // al click su item-data-container che avendo width 100% e height 100vh è l'intera finestra chiudo la modale con le info del film

    e.stopImmediatePropagation(); // ATTENZIONE:  se io clicco su item-data-container il click si propaga nel senso che è come se cliccassi su tutti i genitori quindi per come è strutturato l'html anche sul li che lo contiene. ma il clic sul li apre la modale. quindi la modale si chiude e si riapre subito. stopImmediatePropagation() dice al js di eseguire la funzione e fermare la propagazione del click in questo modo si risolve
    $(this).fadeOut();
  });

  $(document).on("click", ".item-data-wrapper", function(e){
      e.stopImmediatePropagation(); // ATTENZIONE: per lo stesso principio di prima se io clicco nella modale il click arriva al padre item-data-container che col click chiude la modale. quindi fermo la propagazione. In linea teoriaca comunque la propagazione serve infatti quando io clicco sull'immagine del film il click si propaga fino al li che lo contiene e mostra la modale. Io posso cliccare su qualsiasi elemento all'interno del li e mi si apre la modale.
  });

}

// FUNZIONE CHE LANCIA DUE API PER FILM E TV PIù POPOLARI
function sendDiscoverRequest(type){

  var target = $(`#${type}-search-results`); // il target è dove andrò ad appendere l'html compilato da handlebars. Sono due target diversi per film e serie tv. uno è #films-search-results, l'altro tv-search-results.

  target.text(""); // prima svuoto il target dalle ricerche precedenti

  if(type == "movie"){ // cambio l'url a seconda se devo mandare una richiesta per cercare film o serie tv.
    var url = "https://api.themoviedb.org/3/discover/movie"; // url dell'API di TMDB per film
  } else {
    var url = "https://api.themoviedb.org/3/discover/tv"; // url dell'API di TMDB  serietv
  }

  $.ajax({
    url: url,
    method: "GET",
    data: {
      "api_key": "db8b1c040d8d94836ca1164e898cff48", // la mia percsonale chiave api che utilizzano dal server per riconoscere quale utente sta facendo la ricerca
      "sort_by": "popularity.desc", // chiede io film più popolari in ordine decrescente
      "language": "it-IT" // scelgo la lingua italiana
    },
    success: function (data, success) {
      var arrayResults = data["results"];
        if (arrayResults.length == 0){ // se sono nel success ma l'array di risultati è vuoto significa che ho cercato ma non ho trovato niente. stampo un messaggio per l'utente

          $(`#${type}-search-results`).html(`<h3>Non ci sono risultati per questa categoria.</h3>`);

        } else{

          $("#genre-select option").not(`option[value="all"]`).hide(); // nascondo tutte le option della select dei generi tranne all

          for (var i = 0; i < arrayResults.length; i++) {

            printSearchResults(arrayResults[i], type);

            printCast(arrayResults[i], type);
          }

          for (var i = 0; i < arrayResults.length; i++) {
            showGenreSelectOption(arrayResults[i]);
          }

        }


    },
    error: function (err) {
      // a prescindere dall'errore se qualcosa non va lo segnalo all'utente
      target.html(`<h3>Ops! Qualcosa è andato storto. Riprova</h3>`);
    }
  });
}

// FUNZIONE CHE AL TASTO HOME STAMPA I FILM PIù POPOLARI
function addHomeButtonListener(){
  $("#btn-home").click(function(){
    sendDiscoverRequest("movie");
    sendDiscoverRequest("tv");
  });
}

// FUNZIONE CHE MOSTRA NELLA SELECT DEI GENERI SOLTANTO I GENERI PRESENTI NEI FILM/TV STAMPATI IN PAGINA
function showGenreSelectOption(obj){
  var arrayGenres = obj["genre_ids"];

  for (var i = 0; i < arrayGenres.length; i++) {
    $(`#genre-select option[value="${arrayGenres[i]}"]`).show(); // scorro tutti gli id di genere e mostro la option con value id del genere
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

  if ($(a).data(by) > $(b).data(by)){
    return 1
  } else if ($(a).data(by) < $(b).data(by)){
    return -1
  } else {
    return 0
  }
}
