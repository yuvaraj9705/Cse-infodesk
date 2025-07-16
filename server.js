const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "data", "queries.json");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));


app.post("/submit-query", (req, res) => {
  console.log("Submit answer called with:", req.body);

  const { name, email, query } = req.body;
  if (!name || !email || !query) return res.status(400).json({ message: "All fields are required." });

  fs.readFile(DATA_FILE, "utf8", (err, data) => {
    let queries = [];
    if (!err && data) queries = JSON.parse(data);

    queries.push({ name, email, query, answer: null, time: new Date().toISOString() });
    fs.writeFile(DATA_FILE, JSON.stringify(queries, null, 2), (err) => {
      if (err) return res.status(500).json({ message: "Failed to save query." });
      res.json({ message: "Query submitted successfully!" });
    });
  });
});


app.get("/view-queries", (req, res) => {
  fs.readFile(DATA_FILE, "utf8", (err, data) => {
    if (err) return res.status(500).json({ message: "Could not read queries." });
    const queries = JSON.parse(data || "[]");
    res.json(queries);
  });
});


app.post("/submit-answer", (req, res) => {
  const { index, answer } = req.body;
  if (typeof index === 'undefined' || !answer) return res.status(400).json({ message: "Index and answer required." });

  fs.readFile(DATA_FILE, "utf8", (err, data) => {
    let queries = [];
    if (!err && data) queries = JSON.parse(data);

    if (!queries[index]) return res.status(404).json({ message: "Query not found." });
    queries[index].answer = answer;

    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'yuvarajpastham999@gmail.com',
        pass: 'izttiwogxxdfituy' 
      }
      
    });

    const mailOptions = {
      from: 'your_email@gmail.com',
      to: queries[index].email,
      subject: 'Answer to your query - CSE InfoDesk',
      text: `Hello ${queries[index].name},\n\nYour query: ${queries[index].query}\n\nAnswer: ${answer}\n\n- CSE InfoDesk`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("❌ Email Error:", error);
      } else {
        console.log("✅ Email sent:", info.response);
      }
    });
    
    

    fs.writeFile(DATA_FILE, JSON.stringify(queries, null, 2), (err) => {
      if (err) return res.status(500).json({ message: "Failed to save answer." });
      res.json({ message: "Answer submitted and emailed successfully!" });
    });
  });
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});