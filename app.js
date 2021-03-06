const fetchData = require("./collect_data");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("client/build"));

var headlines = null;
var alltopics = null;
var isToStore = false;
var status = false;

fs.stat("./data/alltopics.json", (err, stats) => {
  if (err) {
    console.log(err);
  } else {
    var d = new Date();
    var curr_date = d.getDate();
    var curr_month = d.getMonth();
    var date = stats.mtime.getDate();
    var month = stats.mtime.getMonth();
    if (month < curr_month) {
      status = true;
    }
    if (month == curr_month && curr_date > date) {
      status = true;
    }
    if (status) {
      console.log("[SERVER] DATA TO BE UPDATED");
    }
  }
});

headlines = fetchData.getStoredData("./data/headlines.json");
alltopics = fetchData.getStoredData("./data/alltopics.json");

if ((alltopics === null && headlines === null) || status) {
  console.log("[SERVER] FETCHED NEW DATA");
  headlines = fetchData.getTopHeadlines();
  alltopics = fetchData.getAllTopics();
  isToStore = true;
}

const PORT = process.env.PORT || 8000;
setTimeout(() => {
  app.listen(PORT, () => {
    console.log(`[SERVER] Listening on ${PORT}`);
    if (isToStore) {
      fetchData.storeData("./data/headlines.json", headlines);
      fetchData.storeData("./data/alltopics.json", alltopics);
    }
  });
}, 5000);

/*GET - HEADLINES*/
app.get("/api/headlines/business", (req, res) => {
  res.send(headlines.business);
});
app.get("/api/headlines/entertainment", (req, res) => {
  res.send(headlines.entertainment);
});
app.get("/api/headlines/general", (req, res) => {
  res.send(headlines.general);
});
app.get("/api/headlines/health", (req, res) => {
  res.send(headlines.health);
});
app.get("/api/headlines/science", (req, res) => {
  res.send(headlines.science);
});
app.get("/api/headlines/sports", (req, res) => {
  res.send(headlines.sports);
});
app.get("/api/headlines/technology", (req, res) => {
  res.send(headlines.technology);
});
app.get("/api/headlines/all", (req, res) => {
  const FIELDS = [
    "business",
    "entertainment",
    "general",
    "health",
    "science",
    "sports",
    "technology",
  ];
  var all_head = {};

  FIELDS.forEach((field) => {
    all_head[field] = headlines[field].articles[0];
  });

  res.send(all_head);
});

/*GET - EVERYTHING*/
app.get("/api/everything/:query", async (req, res) => {
  var news_q = req.params.query;
  res.send(alltopics[news_q]);
});

/*GET - UNIQUE ARTICLE*/
app.get("/api/article/:field/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const field = req.params.field;
  var data2send = null;

  var headline_articles = headlines[field];
  var alltopics_articles = alltopics[field];

  if (headline_articles) {
    headline_articles.articles.map((data) => {
      if (data.id === id) {
        data2send = data;
      }
      return data;
    });
  }
  if (alltopics_articles) {
    alltopics_articles.articles.map((data) => {
      if (data.id === id) {
        data2send = data;
      }
      return data;
    });
  }
  res.send(data2send);
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
});
