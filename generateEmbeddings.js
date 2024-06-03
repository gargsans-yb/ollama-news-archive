const ollama = require("ollama");
const fs = require("fs");
const path = require("path");
const lineReader = require("line-reader");

const processJsonlFile = async (filePath) => {
  return new Promise((resolve, reject) => {
    let newsStories = [];
    let linesRead = 0;
    lineReader.eachLine(filePath, async (line, last, callback) => {
      try {
        console.log(linesRead);

        const jsonObject = JSON.parse(line);
        // Process each JSON object as needed
        const data = {
          model: "nomic-embed-text",
          prompt: `${jsonObject.headline} ${jsonObject.short_description}`,
        };

        const embeddings = await ollama.default.embeddings(data);
        jsonObject.embeddings = `[${embeddings.embedding}]`;
        newsStories.push(jsonObject);
        linesRead += 1;

        if (linesRead === 100 || last === true) {
          writeToCSV(newsStories);
          linesRead = 0;
          newsStories = [];
        }

        if (last === true) {
          return resolve();
        }
      } catch (error) {
        console.error("Error parsing JSON line:", error);
      }
      callback();
    });
  });
};

const writeToCSV = (newsStories) => {
  const createCsvWriter = require("csv-writer").createObjectCsvWriter;

  const filePath = path.join(__dirname, "/database/data.csv");

  // Function to write headers if the file doesn't exist
  function writeHeadersAndData(data) {
    const headers = [
      { id: "link", title: "link" },
      { id: "headline", title: "headline" },
      { id: "category", title: "category" },
      { id: "short_description", title: "short_description" },
      { id: "authors", title: "authors" },
      { id: "date", title: "date" },
      { id: "embeddings", title: "embeddings" },
      // Add more headers as needed
    ];

    const csvWriter = createCsvWriter({
      path: filePath,
      header: headers,
      append: false,
    });

    return csvWriter.writeRecords(newsStories);
  }

  // Function to append data to the CSV file
  function appendData(data) {
    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: "link", title: "link" },
        { id: "headline", title: "headline" },
        { id: "category", title: "category" },
        { id: "short_description", title: "short_description" },
        { id: "authors", title: "authors" },
        { id: "date", title: "date" },
        { id: "embeddings", title: "embeddings" },
      ],
      append: true,
    });

    return csvWriter.writeRecords(data);
  }

  // Check if the file exists and write headers if not
  if (!fs.existsSync(filePath)) {
    writeHeadersAndData(newsStories)
      .then(() => {
        console.log("Headers written");
      })
      .catch((err) => console.error("Error writing headers:", err));
  } else {
    // Append data directly if file exists
    appendData(newsStories)
      .then(() => console.log("Data appended"))
      .catch((err) => console.error("Error appending data:", err));
  }
};

async function main() {
  const newsStories = await processJsonlFile(
    path.join(__dirname, "/database/News_Category_Dataset_v3.json")
  );

  console.log("Processed all news stories.");
}

main();
