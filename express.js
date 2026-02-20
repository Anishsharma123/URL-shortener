import express from 'express';
// import router from './routes/sh.ortener.routes.js';
import { shortenedRoutes } from './routes/shortener.routes.js';

const app = express();
const PORT = 3000;


app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

//express router
// app.use(router);
app.use(shortenedRoutes);
app.use((req, res) => {
  res.status(404).send("Page not found");
});

//? In Express.js, a template engine is a tool that lets you embed dynamic content into HTML files and render them on the server before sending them to the client. It allows you to create reusable templates, making it easier to generate dynamic web pages with minimal code.

app.set("view engine", "ejs");
// app.set("views", "./views"); // No need as, we kept he name of the folder as "views" only



app.listen(PORT, ()=>{
  console.log(`Server running at http://localhost:${PORT}`);
});
