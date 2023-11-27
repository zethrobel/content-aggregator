require("dotenv").config()
const express = require('express');
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const _=require("lodash")
const NewsAPI = require('newsapi');
const ejs = require('ejs')
const newsapi = new NewsAPI(process.env.API_KEY)

const app = express();


app
    .use(express.static(__dirname + '/public'))
    .set('view engine', 'ejs')
    .use(bodyParser.urlencoded({extended: true}))

mongoose
    .set("strictQuery", false)
    .connect(process.env.MONGO_KEY)
    .then(console.log("Database connected"))
    .catch(function (error) {
            console.log(error);
            
                   })

    const articleSchema = new mongoose
    .Schema({
        catagory: String,
        Title: String,
        descri: String,
        TopicUrl: String,
        imageUrl: String,
        author: String
    })
    const newsSchema= new mongoose.Schema({
        searchedContent:String,
        newsTitle:String,
        newsDescri:String,
        newsTopicUrl: String,
        newsImageUrl: String,
        newsAuthor: String,
        newsPublishedDate:String

    })
const EveryNews= mongoose.model("News",newsSchema)    
const Article = mongoose.model("Article", articleSchema)




app.get("/", function (req, res) {
    res.render("home", {articles: ""})
})

app.get("/headlines", function (req, res) {
    res.render("topHeadlines", {articles: ""})
})
app.get("/everything", function (req, res) {
    res.render("everything", {articles: ""})
})

app.post("/headlines", function (req, res) {

    newsapi
        .v2
        .topHeadlines({category: req.body.headlineName, language: 'en', country: 'us'})
        .then(function (response) {
            let allResponse = response
            console.log(req.body.headlineName)
            allResponse
                .articles
                .forEach(article => {
                    let newArticle = new Article({
                        catagory: _.capitalize(req.body.headlineName),
                        Title: article.title,
                        descri: article.description,
                        TopicUrl: article.url,
                        imageUrl: article.urlToImage,
                        author: article.author
                    })
                      newArticle.save()
                    })
                    let articles = allResponse.articles
                    res.render("topHeadlines", {articles: articles})
                    })
        .catch(function (error) {
            console.error(error);
            res
               .status(500)
               .send("Error occurred while fetching headlines");
                   })
})

 app.get("/postHeadlines/:titleName", function (req, res) {

    
    Article
        .findOne({Title: req.params.titleName})
        .catch(err => {
            console.error(err)
            res.render("error") // Render an error page or handle the error appropriately
        })
        .then(function (titleFound) {
            console.log(titleFound)
            res.render("post", {clicks: titleFound})
           
        })
 })


app.post("/everything", function (req, res) {
    const date = new Date()
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year= date.getFullYear()
    let toMonth;
    let toDay;
    if(month===1){
    if(day===31){
        toMonth=month
        toDay=1
    }
    else{
        toMonth=12
        toDay=day
    }
    }
    else{
        if(day===31){
           toMonth=month
           toDay=1 
        }
        else{
        toMonth=month-1
        toDay=day
        }
    }
    console.log(year+"-"+month+"-"+day)
    console.log(year+"-"+toMonth+"-"+toDay)
    
    
    newsapi
        .v2
        .everything({
            
            q: req.body.everything,
            from: year+"-"+month+"-"+day,
            
            to: year+"-"+toMonth+"-"+toDay,
            language: 'en',
            sortBy: 'publishedAt',
            page: 3
        })
        .then(response => {
            
            console.log(req.body.everything)
            let allResponse = response

            allResponse
                .articles
                .forEach(article => {
                    let newNews = new EveryNews({
                        searchedContent: _.capitalize(req.body.everything),
                        newsTitle: article.title,
                        newsDescri: article.description,
                        newsTopicUrl: article.url,
                        newsImageUrl: article.urlToImage,
                        newsAuthor: article.author,
                        newsPublishedDate:article.publishedAt
                    })

                    newNews.save()
                    })
                    let articles = allResponse.articles
                    res.render("everything", {articles: articles})
                    })
        .catch(error => {
         console.error(error);
           res
              .status(500)
              .json({error: 'Internal Server Error'});
                    })
})


 app.get("/postNews/:newsTitle",function(req,res){
     EveryNews
        .findOne({newsTitle: req.params.newsTitle})
        .catch(err => {
            console.error(err)
            res.render("error") // Render an error page or handle the error appropriately
        })
        .then(function (newsFound) {
            console.log(newsFound)
            res.render("newsPost", {clickedNews: newsFound})
           
        })    
 })       
    
app.get("/history",function(req,res){
    res.render("history" , {historyNews: ""})
    
})

app.get("/headHistory",function(req,res){
    res.render("headHistory" , {histories: ""})
})
app.post("/history",function(req,res){
    EveryNews.find({searchedContent:_.capitalize(req.body.history)})
    .catch(err=>{
        console.log(err)
        res.render("error")
    })
    .then(function(historyFound){
        
        res.render("history",{historyNews:historyFound})
    })
})   
     
app.post("/headHistory",function(req,res){
    Article.find({catagory:_.capitalize(req.body.headHistory)})
    .catch(err=>{
        console.log(err)
        res.render("error")
    })
    .then(function(historyHead){
        console.log(historyHead) 
        res.render("headHistory",{histories:historyHead})
    })
})
app.post("/deleteHead",function(req,res){
    
    Article.deleteOne({Title:req.body.deleteHead})
           .catch(err=>console.log(err))
           .then(function(){
            console.log("deleted successfully")
            res.render("delete")
           })
           
})

app.post("/deleteNews",function(req,res){
    EveryNews.deleteOne({newsTitle:req.body.deleteNews})
             .catch(err=>console.log(err))
             .then(function(){
                console.log("Successful")
                res.render("delete")
    
             })
})

app.listen(process.env.PORT || 6060, function () {
    console.log(`Server is running on port 6060`);
})
