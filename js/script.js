// Milestone 1:
// Creare un layout base con una searchbar (una input e un button) in cui possiamo
// scrivere completamente o parzialmente il nome di un film. Possiamo, cliccando il
// bottone, cercare sull’API tutti i film che contengono ciò che ha scritto l’utente.
// Vogliamo dopo la risposta dell’API visualizzare a schermo i seguenti valori per ogni
// film trovato:
// 1. Titolo
// 2. Titolo Originale
// 3. Lingua
// 4. Voto

// API TMDB (THE MOVIE DATA BASE) sito internet che fornisce un api gratuita per accedere al suo database di dati su film serie tv ecc.
// Hi mcurtaz,

// Your request for an API key has been approved. You can start using this key immediately.
//
// API Key: db8b1c040d8d94836ca1164e898cff48
//
// An example request looks like:
// https://api.themoviedb.org/3/movie/550?api_key=db8b1c040d8d94836ca1164e898cff48

//Documentation: https://www.themoviedb.org/documentation/api

// Milestone 2:
// Trasformiamo il voto da 1 a 10 decimale in un numero intero da 1 a 5, così da
// permetterci di stampare a schermo un numero di stelle piene che vanno da 1 a 5,
// lasciando le restanti vuote (troviamo le icone in FontAwesome).
// Arrotondiamo sempre per eccesso all’unità successiva, non gestiamo icone mezze
// piene (o mezze vuote :P)
// Trasformiamo poi la stringa statica della lingua in una vera e propria bandiera della
// nazione corrispondente, gestendo il caso in cui non abbiamo la bandiera della
// nazione ritornata dall’API (le flag non ci sono in FontAwesome).
// Allarghiamo poi la ricerca anche alle serie tv. Con la stessa azione di ricerca
// dovremo prendere sia i film che corrispondono alla query, sia le serie tv, stando
// attenti ad avere alla fine dei valori simili (le serie e i film hanno campi nel JSON di
// risposta diversi, simili ma non sempre identici)

$(document).ready(init);

function init() {
  printGenresSelect();
  addListeners();
}

// FUNZIONE CHE CHIEDE ALL'API I GENERI DISPONIBILI E STAMPA LA SELECT
function printGenresSelect(){


  $.ajax({
    url: "https://api.themoviedb.org/3/genre/movie/list",
    method: "GET",
    data: {
      "api_key": "db8b1c040d8d94836ca1164e898cff48", // la mia percsonale chiave api che utilizzano dal server per riconoscere quale utente sta facendo la ricerca
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
function addListeners() {

 var buttonTarget = $("#btn-searchbar");

 buttonTarget.click(function(){// al click sul bottone "cerca" lancio la funzione sendRequest

   var input = $("#searchbar").val(); // prendo la stringa nell'input scritta dall'utente

   $("#searchbar").val(""); // svuoto l'input. la stringa resta comunque salvata nella variabile input

   sendRequest(input, "films"); // faccio partire la funzione con lo stesso input prima per i film  poi per le serie tv
   sendRequest(input,"tv");
 });

 var keyupTarget = $("#searchbar");

 keyupTarget.keyup(function(event){ // listener del keyup sull'input "searchbar". Ascolta la pressione dei tasti sulla tastiera quando il focus è sulla barra di ricerca (la barra di ricerca è "selezionata")

   if(event.which == 13){ // se si preme invio lancio la funzione send request

     var input = $("#searchbar").val(); // prendo la stringa nell'input scritta dall'utente

     $("#searchbar").val(""); // svuoto l'input. la stringa resta comunque salvata nella variabile input

     sendRequest(input,"films"); // faccio partire la funzione con lo stesso input prima per i film  poi per le serie tv
     sendRequest(input,"tv");
   }

 });

}

// FUNZIONE CHE MANDA UNA RICHIESTA ALL'API
function sendRequest(input, type) {

  var target = $(`#${type}-search-results`); // il target è dove andrò ad appendere l'html compilato da handlebars. Sono due target diversi per film e serie tv. uno è #films-search-results, l'altro tv-search-results.

  target.text(""); // prima svuoto il target dalle ricerche precedenti

  if(type == "films"){ // cambio l'url a seconda se devo mandare una richiesta per cercare film o serie tv.
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
          for (var i = 0; i < arrayResults.length; i++) {

            sendCastRequest(arrayResults[i], type);

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
function sendCastRequest(obj, type){

  $.ajax({
    url:`https://api.themoviedb.org/3/movie/${obj["id"]}/credits`,
    method: "GET",
    data: {
      "api_key": "db8b1c040d8d94836ca1164e898cff48", // la mia percsonale chiave api che utilizzano dal server per riconoscere quale utente sta facendo la ricerca
    },
    success: function (data) {
      var cast = data["cast"];
      printSearchResults(obj, cast, type);
    },
    error: function (err) {
    // Spesso il cast non c'è in archivio. avendo comunque i dati del film faccio partire la funzione che stampa inizializzando l'array che contiene i nomi del cast ad undefined.
      var cast = undefined;
      printSearchResults(obj, cast, type);
    }
  });

}

// FUNZIONE CHE STAMPA I RISULTATI DELLA RICERCA IN PAGINA
function printSearchResults(objResult, arrayCast, type) {

  var template = $("#result-template").html(); // salvo il template per handlebars in una variabile

  // ------- index.html -----  template di handlebars nell'html------
  // l'API mi restituisce un oggetto con chiavi e valori con i dati dei vari film trovati. UTILIZZANDO IN HANDLEBARS LE STESSE CHIAVI CHE UTILIZZA L'API POSSO PASSARGLI DIRETTAMENTE L'OGGETTO MANDATO DALL'API. OVVIAMENTE LE CHIAVI NON RICHIESTE DA HANDLEBARS VERRANNO SEMPLICEMENTE IGNORATE
  // <li>
  //   <div class="title">{{ title }}</div>
  //   <div class="original-title">{{ original_title }}</div>
  //   <div class="language">{{ original_language }}</div>
  // ATTENZIONE: LA CHIAVE STARS NELL'OGGETTO MANDATO DALL'API NON C'è VERRà AGGIUNTA CON UNA FUNZIONE. SE AD HANDLEBARS PASSO UNA STRINGA CHE è CODICE HTML LO STAMPA COME TESTO SE MESSO AL POSTO DI {{codice_html}} CON LE TRE PARENTESI GRAFFE INVECE VIENE INTERPRETATO COME CODICE HTML {{{codice_html}}}
  //   <div class="stars">{{{stars}}}</div>
  // </li>


  var compiled = Handlebars.compile(template); // nella variabile compiled ci sarà un funzione di handlebars che compila il template sostituendo le chiavi con i valori corrispondenti

  var target = $(`#${type}-search-results`); // il target è dove andrò ad appendere l'html compilato da handlebars. Sono due target diversi per film e serie tv. uno è #films-search-results, l'altro tv-search-results.

  var objToPrint = getObjToPrint(objResult, arrayCast, type) // a questa funzione passo tutti i dati ricevuti dalle due api. manipola i vari oggetti array e dati e mi restituisce un oggetto pronto per compilare il template di HANDLEBARS

  var objHTML = compiled(objToPrint); // compilo

  target.append(objHTML); // stampo nell'HTML

  missingImages(); // questa funzione corregge eventuali errori per immagini mancanti sostituendo con altre immagini o avvisi appositi.


}

function getObjToPrint(obj, arrayCast, type){

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
  }


  // --------    ATTORI

  var actors = [];

  if(arrayCast == [] || !arrayCast){
    obj["actors"] = "nessun dato sul cast"
  } else{
    for (var i = 0; i < 5; i++) {
      actors.push(arrayCast[i]["name"]);
    }
  }


  obj["actors"] = actors;


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
