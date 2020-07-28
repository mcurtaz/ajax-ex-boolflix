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
  addListeners(); // aggiungo listeners per la ricerca
}

function addListeners() {

 var buttonTarget = $("#btn-searchbar");

 buttonTarget.click(sendRequest); // al click sul bottone "cerca" lancio la funzione sendRequest

 var keyupTarget = $("#searchbar");

 keyupTarget.keyup(function(event){ // listener del keyup sull'input "searchbar". Ascolta la pressione dei tasti sulla tastiera quando il focus è sulla barra di ricerca (la barra di ricerca è "selezionata")

   if(event.which == 13){ // se si preme invio lancio la funzione send request
     sendRequest();
   }

 });

}

function sendRequest() {

  var input = $("#searchbar").val(); // prendo la stringa nell'input scritta dall'utente

  $("#searchbar").val(""); // svuoto l'input. la stringa resta comunque salvata nella variabile input

  $.ajax({
    url: "https://api.themoviedb.org/3/search/movie", // url dell'API di TMDB
    method: "GET",
    data: {
      "api_key": "db8b1c040d8d94836ca1164e898cff48", // la mia percsonale chiave api che utilizzano dal server per riconoscere quale utente sta facendo la ricerca
      "query": input, // la query è la stringa su cui si farà la ricerca. gli passo quello che ha scritto l'utente nell'input
      "language": "it-IT" // scelgo la lingua italiana
    },
    success: function (data, success) {

        printSearchResults(data["results"]); // se la API va a buon fine lancio la funzione che stampa i risultati. come argomento della funzione gli passo l'array di oggetti mandatomi dall'API

    },
    error: function (err) {
      console.log("err", err);
    }
  });

}

function printSearchResults(arrayResults) {

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
  var target = $("#films-search-results"); // il target è dove andrò ad appendere l'html compilato da handlebars

  target.text(""); // prima svuoto il target dalle ricerche precedenti

  for (var i = 0; i < arrayResults.length; i++) { // scorro tutti i risultati e li stampo in pagina

    var stars = getStars(arrayResults[i]); // salvo nella variabile stars il risultato della funzione getStars passandogli come argomento l'oggetto contenete i dati del film.

    arrayResults[i]["stars"] = stars; // creo una nuova chiave nell'oggetto che contiene i dati del film. Quindi con handlebars utilizzo una serie di chiavi che ha già per compilare titolo del film e così. in questa nuova chiave invece salvo il codice html creato dalla funzione getStars per stampare il voto in forma grafica

    // ATTENZIONE: per comporre le stringhe invece di fare virgolette, apici, barra per saltare il carattere, più variabile ecc. si può utilizzare il carattere backtick (apici storti). In questo modo tra i due apici storti c'è la stringa intera a prescindere da virgolette apici singoli ecc. per metterci una variabile si uns ${variabile}. è una caratteristica di JS. non viene da librerie particolari. JS puro si chiama anche JS PLAIN o VANILLA

    var languageImg = `<img src="./img/flag/flag-${arrayResults[i]["original_language"]}.png" alt="flag-${arrayResults[i]["original_language"]}">`; // creo una variabile con una riga di codice html di un immagine. la src="" è composta dall'url che trova la cartella con le bandiere. i nomi delle bandiere sono sempre flag-(lingua).png la lingua la prendo dall'oggetto mandato dall'API alla chiave original_language. quindi per ogni lingua metterò nel template di Handlebars l'immagine della barriera corrispondente. Stampati tutti i risultati la funzione missingFlag interverrà in caso di immagine bandiera mancante


    arrayResults[i]["languageImg"] = languageImg;


    var newItem = compiled(arrayResults[i]); // compilo il template handlebars con i dati del film. utilizzo in handlebars le stesse chiavi utilizzate nell'oggetto arrivato dall'API in modo da potergli passare esattamente quell'oggetto senza crearne uno apposito. A quell'oggetto però ho aggiunto la chiave stars per il voto in forma grafica.

    target.append(newItem); // stampo nell'html il template compilato

  }

  missingFlag();


}


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

function missingFlag() { // finito di stampare tutti i risultati della ricerca

  $(".language img").on("error", function(){ // se c'è un errore nei tag selezionati (tutte le img contenute in un elemento con classe .language cioè tutte le immagini delle bandiere della lingua). si attiva la funzione. Se non trova l'immagine perchè non esiste da errore e quindi si attiva la funzione

    var target = $(this).parents(".language"); // $(this) è l'immagine che ha dato errore e ha triggerato la funzione. il parents con classe .language è il div che la contiene.

    var lng = target.data("lng"); // la funzione che stampa i risultati della ricerca salva nell'attributo data-lng del div la lingua del film (it per italiano, en per inglese ecc ). la vado a recuperare, la salvo nella variabile, e la sostituisco all'immagine "rotta". Sostituisco l'intero contenuto del target.
    
    target.text(lng);

  });
}