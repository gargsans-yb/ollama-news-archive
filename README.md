# YugaNews Archives

This is a sample application written in Node.js, backed by Ollama and YugabyteDB. The app relies on similarity search to return appropriate results from the database using pgvector.

## Prerequisites

- Install [YugabyteDB v2.19+](https://download.yugabyte.com/)
- Install [Ollama](https://ollama.com/)
- Install Node.js V18+
- Install Docker

## Set up the application

Download the application and provide settings specific to your deployment:

1. Clone the repository.

   ```sh
   git clone https://github.com/YugabyteDB-Samples/yugabytedb-localai-programming-language-search.git
   ```

2. Install the application dependencies.

   ```sh
   cd ollama-news-archive
   git lfs fetch --all
   npm install
   cd backend/ && npm install
   cd ../news-app-ui/ && npm install
   ```

3. Configure the application environment variables in `{project_directory/backend/index.js}`.

## Set up YugabyteDB

Start a 3-node YugabyteDB cluster in Docker (or feel free to use another deployment option):

```sh
# NOTE: if the ~/yb_docker_data already exists on your machine, delete and re-create it
mkdir ~/yb_docker_data

docker network create custom-network

docker run -d --name yugabytedb-node1 --hostname yugabytedb-node1 --net custom-network \
    -p 15433:15433 -p 7001:7000 -p 9001:9000 -p 5433:5433 \
    -v ~/yb_docker_data/node1:/home/yugabyte/yb_data --restart unless-stopped \
    yugabytedb/yugabyte:{{< yb-version version="preview" format="build">}} \
    bin/yugabyted start \
    --base_dir=/home/yugabyte/yb_data --background=false

docker run -d --name yugabytedb-node2 --hostname yugabytedb-node2 --net custom-network \
    -p 15434:15433 -p 7002:7000 -p 9002:9000 -p 5434:5433 \
    -v ~/yb_docker_data/node2:/home/yugabyte/yb_data --restart unless-stopped \
    yugabytedb/yugabyte:{{< yb-version version="preview" format="build">}} \
    bin/yugabyted start --join=yugabytedb-node1 \
    --base_dir=/home/yugabyte/yb_data --background=false

docker run -d --name yugabytedb-node3 --hostname yugabytedb-node3 --net custom-network \
    -p 15435:15433 -p 7003:7000 -p 9003:9000 -p 5435:5433 \
    -v ~/yb_docker_data/node3:/home/yugabyte/yb_data --restart unless-stopped \
    yugabytedb/yugabyte:{{< yb-version version="preview" format="build">}} \
    bin/yugabyted start --join=yugabytedb-node1 \
    --base_dir=/home/yugabyte/yb_data --background=false
```

The database connectivity settings are provided in the `{project_dir}/.env` file and do not need to be changed if you started the cluster with the preceding command.

Navigate to the YugabyteDB UI to confirm that the database is up and running, at <http://127.0.0.1:15433>.

## Get started with Ollama

Running [Ollama](https://ollama.com/) on your machine, or a commodity machine, is made easy with installers across a variety of platforms. The [Ollama models library](https://ollama.com/library) provides numerous models for a variety of use cases. For this sample application, we'll use `nomic-embed-text` to generate text embeddings. Unlike some models, such as Llama3, which need to be run using the Ollama CLI, embeddings can be generated simply be supplying the desired embedding model in a rest endpoint.

1. Pull the model using the Ollama CLI.

```sh
ollama pull nomid-embed-text:latest
```

2. With Ollama up and running on your machine, run the following command to verify the installation.

```sh
curl http://localhost:11434/api/embeddings -d '{
  "model": "nomic-embed-text",
  "prompt": "goalkeeper"
}'
```

The following output is generated, providing a 768-dimensional embedding that can be stored in the database and used in similarity searches.

```output
{"embedding":[-0.6447112560272217,0.7907757759094238,-5.213506698608398,-0.3068113327026367,1.0435500144958496,-1.005386233329773,0.09141742438077927,0.4835842549800873,-1.3404604196548462,-0.2027662694454193,-1.247795581817627,1.249923586845398,1.9664828777313232,-0.4091946482658386,0.3923419713973999,...]}
```

## Load the schema and seed data

This application requires a database table with information about news stories. This schema includes a `news_stories` table.

1. Copy the schema to the first node's Docker container.

   ```sh
   docker cp {project_dir}/database/schema.sql yugabytedb-node1:/home/db_schema.sql
   ```

2. Copy the seed data file to the Docker container.

   ```sh
   {project_dir}/.git/lfs/objects/21/bb/21bbebed1d66c3cad2100ceeee82ac0034dfb806b52043fab7b64b79940d5863 yugabytedb-node1:/home/db_data.csv
   ```

3. Execute the SQL files against the database.

   ```sh
   docker exec -it yugabytedb-node1 bin/ysqlsh -h yugabytedb-node1 -f /home/db_schema.sql
   docker exec -it yugabytedb-node1 bin/ysqlsh -h yugabytedb-node1 -c "\COPY news_stories(link,headline,category,short_description,authors,date,embeddings) from '/home/db_data.csv' DELIMITER ',' CSV HEADER;"
   ```

## Start the application

This Node.js application uses a locally-running LLM to produce text-embeddings. It takes an input in natural language, as well as a news category, and returns a response from YugabyteDB. By converting text to embeddings, a similarity search is executed using `pgvector`.

1. Start the API server.

   ```sh
   node {project_dir}/backend/index.js

   API server running on port 3000.
   ```

2. Query the `/search` endpoint with a relevant prompt and category. For instance:

```sh
curl "localhost:3000/api/search?q=olympic gold medal&category=SPORTS"
```

```output
{
    "data": [
        {
            "headline": "Mikaela Shiffrin Wins Gold In Women's Giant Slalom",
            "short_description": "It was her second gold medal ever after her 2014 Sochi Winter Olympics win.",
            "link": "https://www.huffingtonpost.com/entry/mikaela-shiffrin-gold-giant-slalom_us_5a8523a4e4b0ab6daf45c6ec"
        },
        {
            "headline": "Baby Watching Her Olympian Dad Compete On TV Will Give You Gold Medal Feels",
            "short_description": "She's got her cute mojo working for Canada's Winter Olympics curling team.",
            "link": "https://www.huffingtonpost.com/entry/baby-watching-olympics-dad-tv-curling_us_5a842772e4b0adbaf3d94ad2"
        },
        {
            "headline": "Jimmy Kimmel's Own Winter Olympics Produce Another Gold Medal Moment",
            "short_description": "\"I think they're even better than the expensive Olympics,\" the host said.",
            "link": "https://www.huffingtonpost.com/entry/jimmy-kimmels-own-olympics-produce-another-gold-medal-moment_us_5a85779be4b0774f31d27528"
        },
        {
            "headline": "The Most Dazzling Moments From The 2018 Winter Olympics Opening Ceremony",
            "short_description": "The 2018 Winter Games are officially open.",
            "link": "https://www.huffingtonpost.com/entry/winter-olympics-opening-ceremony-photos_us_5a7d968de4b08dfc930304da"
        }
    ]
}
```

3. Run the UI and visit http://localhost:5173 to search the news archives.

```sh
npm run dev
```
```output
  VITE ready in 138 ms
  ➜  Local:   http://localhost:5173/
```
<img width="1112" alt="YugaNews Archives" src="https://github.com/YugabyteDB-Samples/ollama-news-archive/assets/2041330/69d95b77-f59d-4f4a-b7ca-2f0333f35890">
