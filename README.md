```bash
# start containers
docker compose up -d

# access "fbcrawler" container
docker exec -it coinprofit bash

# init modules (first time only)
npm install

# run script
node src
```
