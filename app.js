
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://kushal:Test123@cluster0.bdhhfao.mongodb.net/todolistDB");

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const makeBed = new Item({name: "Make your Bed."});
const chargeWater = new Item({name: "Drink charged water."});
const gym = new Item({name: "Do Physical Exercise."});

const arrItem = [makeBed, chargeWater, gym];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}).then((result) => {
    if(result.length === 0){
      Item.insertMany(arrItem).then(function () {
        console.log("Successfully saved defult items to DB");
      })
      .catch(function (err) {
        console.log(err);
      });
      res.render("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: result});
    }
  }).catch(function(err){
    console.log(err);
  });
});

app.get("/:listName", function(req, res){
  const customlistName = _.capitalize(req.params.listName);
 // console.log(customlistName);

  List.findOne({name: customlistName})
  .then((result) => {
    if(result === null){
      //Create a new list
      const list = new List({
        name: customlistName,
        items: arrItem
      });
      list.save();
      res.redirect("/" + customlistName);
    }else{
      //Show existing list
      res.render("list", {listTitle: result.name, newListItems: result.items});
    }
  })
  .catch((err) => {
    console.log(err);
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/"+"");
  } else {
    List.findOne({name: listName})
    .then((result)=>{
      result.items.push(item);
      result.save();
      res.redirect("/"+listName);
    })
    .catch((err)=>{console.log(err);});
  }
});

app.post("/delete", function(req, res){
  const checkItemID = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkItemID)
    .then(()=>{res.redirect("/");})
    .catch((err)=>{console.log(err);});
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkItemID}}})
    .then((foundList)=>{res.redirect("/"+listName);})
    .catch((err)=>{console.log(err);});
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started on port 3000");
});
