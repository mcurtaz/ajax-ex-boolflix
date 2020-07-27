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

$(document).ready(init);

function init() {
  addListeners();
}

function addListeners() {

 var buttonTarget = $("#btn-searchbar");

 buttonTarget.click(sendRequest);

 var keyupTarget = $("#searchbar");

 keyupTarget.keyup(function(event){

   if(event.which == 13){
     sendRequest();
   }

 });

}

function sendRequest() {
  var input = $("#searchbar").val();

  $.ajax({
    url: "https://api.themoviedb.org/3/search/movie",
    method: "GET",
    data: {
      "api_key": "db8b1c040d8d94836ca1164e898cff48",
      "query": input,
      "language": "it-IT"
    },
    success: function (data, success) {

      if(success == "success"){
        printSearchResults(data["results"]);
      }
    },
    error: function (err) {
      console.log("err", err);
    }
  });
}

function printSearchResults(arrayResults) {

  var template = $("#result-template").html();
  var compiled = Handlebars.compile(template);
  var target = $("#search-results");

  target.text("");

  for (var i = 0; i < arrayResults.length; i++) {

    var objectCompile = {
        "title": arrayResults[i]["title"],
        "originalTitle": arrayResults[i]["original_title"],
        "language": arrayResults[i]["original_language"],
        "vote": arrayResults[i]["vote_average"]
    };

    var newItem = compiled(objectCompile);

    target.append(newItem);

  }


}
