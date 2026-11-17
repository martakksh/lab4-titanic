node main.js -i titanic.json -h localhost -p 3000
curl "http://localhost:3000/?survived=true"
curl "http://localhost:3000/?survived=true&age=true"
curl "http://localhost:3000/"
curl -i "http://localhost:3000/wrong-route"
