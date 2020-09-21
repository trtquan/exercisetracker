// const express = require('express')
// const app = express()
// const bodyParser = require('body-parser')

// const cors = require('cors')

// const mongoose = require('mongoose')
// mongoose.connect(process.env.DB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology:true,
// });

// app.use(cors())

// app.use(bodyParser.urlencoded({extended: false}))
// app.use(bodyParser.json())


// app.use(express.static('public'))
// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/views/index.html')
// });


// // Not found middleware
// app.use((req, res, next) => {
//   return next({status: 404, message: 'not found'})
// })
// const api = require('./routes');
// app.use('/api', api);

// // Error Handling middleware
// app.use((err, req, res, next) => {
//   let errCode, errMessage

//   if (err.errors) {
//     // mongoose validation error
//     errCode = 400 // bad request
//     const keys = Object.keys(err.errors)
//     // report the first validation error
//     errMessage = err.errors[keys[0]].message
//   } else {
//     // generic or custom error
//     errCode = err.status || 500
//     errMessage = err.message || 'Internal Server Error'
//   }
//   res.status(errCode).type('txt')
//     .send(errMessage)
// })

// const listener = app.listen(process.env.PORT || 3000, () => {
//   console.log('Your app is listening on port ' + listener.address().port)
// })
const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')
const shortid = require('shortid');
const mongoose = require('mongoose')
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology:true,
});
app.use(cors());

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

var uNameAndId = new mongoose.Schema({
username:String,
_id:String,
fitnessData:Array
})
var UsernameAndId = mongoose.model("UsernameAndId",uNameAndId);

app.post("/api/exercise/new-user",(req, res)=>{
  let tempId = shortid.generate();
  let data = {"username":req.body.username,"_id":tempId,"fitnessData":Array};
UsernameAndId.find({"username":data.username},(err,docs)=>{
if (err){res.send("Checking you username failed. Try again?");}
  else{
  if(docs.length==0){
    let saveUserNameAndId = new UsernameAndId(data);
   saveUserNameAndId.save((err)=>{
    if(err){res.send("The Username and UserId could not be saved");}
    res.json(data);
  })
  }else{
  res.send("username already taken");
  }
}
});
});
var fitnessTemplate = new mongoose.Schema({
"username":{type:String,required:true},
  "description":{type:String,required:true},
  "duration":{type:Number,required:true},
  "_id":String,
  "date":Date
})

app.post("/api/exercise/add",(req,res)=>{
  let date = req.body.date ===""? new Date().toDateString():new Date(req.body.date).toDateString()
  let data = {"username":req.body.userId,"description":req.body.description,"duration":req.body.duration,"_id":req.body.userId,"date":date};
  let query = req.body.userId;
  if(req.body.description==""){res.send("Path `description` is required.")}
  else if(req.body.duration==""){res.send("Path `duration` is required.")}
  else{
   UsernameAndId.findById(query,(err,docs)=>{
    if(err){res.send("Id could not be found!")}
    else{
        let data = {"username":docs.username,"id":req.body.userId,"description":req.body.description,"duration":req.body.duration,"_id":req.body.userId,"date":date};
      if(docs!==null){
        docs.fitnessData.push(data);
        docs.save((err)=>{
        if(err){res.send("fitness Data could not be updated")}
          res.json(data);
        })
        
      }else{
        res.send("Invalid Id")
      }
    }
   })
  }
})

app.get("/api/exercise/log?",(req,res)=>{
let searchedUserId = req.query.userId;
let regex = /^[\d]{4}[-]{1}([0]?[1-9]{1}|[1]{1}[0-2]{1})[-]{1}([0]?[1-9]{1}|[1]{1}[\d]{1}|[2]{1}[\d]{1}|[3]{1}[0-1]{1})$/;
let testFromDate =regex.test(req.query.from);
let testToDate =regex.test(req.query.to);
let fromDate = req.query.from===undefined?undefined:req.query.from;
let toDate = req.query.to===undefined?undefined:req.query.to;  
let limit = req.query.limit===undefined?undefined:req.query.limit;
  
  UsernameAndId.findById(searchedUserId,(err,docs)=>{
  if(err){res.send("Id search Failed");}
    else{
    if(docs!==null){      
      if(fromDate!==undefined&&toDate!==undefined){
        // res.send("both FROMDATE and TO DATE are PRESENT")
        if(testFromDate&&testToDate){
       // res.send("BOTH dates are of the right format and are ready to process")
          let fitnessDataToDisplay=[];
          docs.fitnessData.map((v,i,a)=>{
          if(new Date(v.date).getTime()>=new Date(fromDate).getTime() && new Date(v.date).getTime()<=new Date(toDate).getTime()){
           fitnessDataToDisplay.push(v)}
        })
          if(limit>0){
            fitnessDataToDisplay = fitnessDataToDisplay.slice(0,limit);
            let result={"_id":searchedUserId,"userName":docs.username,"from":new Date(fromDate).toDateString(),"to":new Date(toDate).toDateString(),"limit":limit,"log":fitnessDataToDisplay}
            res.json(result);
          }
          else{            
            let result={"_id":searchedUserId,"userName":docs.username,"from":new Date(fromDate).toDateString(),"to":new Date(toDate).toDateString(),"limit":limit,"log":fitnessDataToDisplay};
            res.json(result)}
        }
        else{res.send("The dates are of the WRONG format - - PLEASE ENTER DATE IN xxxx-xx-xx FORMAT")}
      }
      else if(fromDate===undefined&&toDate!==undefined){
       // res.send("FROMDATE is missing TO DATE is PRESENT")
        if(testToDate){
          //res.send("FROMDATE is missing, TODATE is PRESENT and is of the CORECT format")
          let fitnessDataToDisplay=[];
        docs.fitnessData.map((v,i,a)=>{
          if(new Date(v.date).getTime()<=new Date(toDate).getTime()){
            fitnessDataToDisplay.push(v)};
        });
          if(limit>0){
            fitnessDataToDisplay = fitnessDataToDisplay.slice(0,limit);
            let result={"_id":searchedUserId,"userName":docs.username,"to":new Date(toDate).toDateString(),"limit":limit,"log":fitnessDataToDisplay}
            res.json(result);
          }
          else{
            let result={"_id":searchedUserId,"userName":docs.username,"to":new Date(toDate).toDateString(),"limit":limit,"log":fitnessDataToDisplay};
            res.json(result);};
        }
        else{res.send("FROMDATE is missing, TODATE is PRESENT and is of the WRONG format - PLEASE ENTER TODATE IN xxxx-xx-xx FORMAT")}
      }
      else if(fromDate!==undefined&&toDate===undefined){
        if(testFromDate){
          //res.send("TODATE is missing, FROMDATE is PRESENT and is of the CORECT format")
        let fitnessDataToDisplay =[];
          docs.fitnessData.map((v,i,a)=>{
          if(new Date(v.date).getTime()>=new Date(fromDate).getTime()){
            fitnessDataToDisplay.push(v)};
        })
          if(limit>0){
            fitnessDataToDisplay = fitnessDataToDisplay.slice(0,limit);
            let result={"_id":searchedUserId,"userName":docs.username,"from":new Date(fromDate).toDateString(),"limit":limit,"log":fitnessDataToDisplay}
            res.json(result);
          }
          else{
            let result={"_id":searchedUserId,"userName":docs.username,"from":new Date(fromDate).toDateString(),"limit":limit,"log":fitnessDataToDisplay};
            res.json(result);};
        }
        else{res.send("TODATE is missing, FROMDATE is PRESENT but is of the WRONG format - PLEASE ENTER FROMDATE IN xxxx-xx-xx FORMAT")}
      }
       else if(fromDate===undefined&&toDate===undefined) {res.json(docs.fitnessData)}

    }else{res.send("UserId not found")}
    }
  })
});

//Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})



// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})