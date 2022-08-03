//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

mongoose.connect(
  "mongodb+srv://admin-scarlett:Shiori0714@cluster0.y3z9a.mongodb.net/todoListDB"
);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const workout = new Item({
  name: "workout",
});

const fishing = new Item({
  name: "fishing",
});

const biking = new Item({
  name: "biking",
});

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("list", listSchema);

const defaultItems = [workout, fishing, biking];

let day;

app.get("/", function (req, res) {
  day = date.getDate();

  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err, res) => {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully saved default items to DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: day, newListItems: foundItems });
    }
  });
});

app.post("/delete", (req, res) => {
  const id = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day) {
    List.updateMany({}, { $pull: { items: { _id: id } } }, (err, result) => {
      if (!err) {
        console.log(result);
      }
    });
    Item.findByIdAndRemove(id, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log(result);
        res.redirect("/");
      }
    });
  } else {
    List.updateOne(
      { name: listName },
      {
        $pull: { items: { _id: id } },
      },
      (err, result) => {
        console.log(result);
        res.redirect("/" + listName);
      }
    );
  }
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listTitle = req.body.list;

  const item = new Item({
    name: itemName,
  });

  item.save();

  if (listTitle === day) {
    res.redirect("/");
  } else {
    List.findOne({ name: listTitle }, (err, doc) => {
      //the list document already exists
      doc.items.push(item);
      doc.save(); // if the doc exists, doc.save() calls updateOne() only with the modification to the db.
      //better update ways: call .updateOne() types of method
      res.redirect("/" + listTitle);
    });
  }
});

app.get("/:todolist", (req, res) => {
  let listName = req.params.todolist;

  listName = _.capitalize(listName);

  List.findOne({ name: listName }, (err, doc) => {
    if (!err) {
      if (!doc) {
        // console.log(doc);
        const list = new List({
          name: listName,
          items: defaultItems,
        });

        list.save();
        res.redirect("/" + listName);
      } else {
        res.render("list", { listTitle: listName, newListItems: doc.items });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT, function () {
  console.log("Server started");
});
