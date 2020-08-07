//  BONUS -- IDEE
// - grafica con modale a tutta pagina per le info del film
// - check per nascondere film per adulti
// - select sort by per riordinare i film
// - select per scegliere lingua inglese o italiano
// - bottoni avanti indietro per cambiare pagina se ci sono più di 20 risultati
// - ricerca di partenza con film di tendenza (API discover di TMDB) e tasto home

$(document).ready(init);

function init() {
  printGenresSelect();
  addSearchListeners();
  addFilterGenresListener()
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

          $(`#${type}-search-results`).html(`<h3>Mi dispiace non abbiamo trovato risultati per questa categoria.</h3>`);

        } else{ // se invece ci sono dei risultati ciclo su film per film e mando una richiesta per sapere gli attori. questa operazione va fatta qui. ASINCRONICITÀ DELLE FUNZIONI. SE CERCO DI FARLA DOPO LA PRIMA API LANCIA FUNZIONI CON TEMPI DIVERSI E MI RITROVO A STAMPARE IN PAGINA QUANDO LA SECONDA API NON HA ANCORA FINITO. INVECE LA STAMPA PARTIRÀ SOLO QUANDO AVRÒ RICEVUTO I DATI ANCHE DA QUESTA SECONDA API.

        // POSSIBILE SOLUZIONE DUE: DENTRO QUESTO FOR COMINCIO A STAMPARE IL TEMPLATE HANDLEBAR. STAMPO ANCHE L'ID DEL FILM NEL TEMPLATE IN UN DATA-ID POI ALLA FINE DEL FOR LANCIO UNA FUNZIONE CHE MANDA LA RICHIESTA ALL'API PER IL CAST PARTENDO DALL'ID DELL'OGGETTO arrayResult[i] SU CUI STO CICLANDO. POI PER APPENDERLO CERCO NELL'HTML IL DATA-ID CHE SICURAMENTE SARÀ GIÀ NELL'HTML PERCHÈ QUANDO HO LA RISPOSTA DEL PRIMO AJAX LA STAMPA È PRATICAMENTE IMMEDIATA NEL FOR, POI LANCIO IL SECONDO AJAX E QUANDO MI RISPONDE SICURAMENTE IL FOR CHE STAMPA QUELL'ID LÌ È GIÀ CONCLUSO. QUESTA SECONDA SOLUZIONE MI EVITA ANCHE DI LANCIARE LA FUNZIONE PRINT SEARCH RESULT NELL'ERROR DELLA CHIAMATA PER IL CAST (CHE STAMPA LA CARD DEL FILM/SERIETV ANCHE SE IL CAST RISULTA 404 PAGE NOT FOUND COSA CHE SUCCEDE SPESSO COI FILM MINORI)
          for (var i = 0; i < arrayResults.length; i++) {

            printSearchResults(arrayResults[i], type);

            printCast(arrayResults[i], type);
          }
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
      var cast = undefined;
      printSearchResults(obj, cast, type);
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

  missingImages(); // questa funzione corregge eventuali errori per immagini mancanti sostituendo con altre immagini o avvisi appositi.


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
    $(this).siblings(".no-img").css("display", "block");
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
