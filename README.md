# Backend-coding-challenge

### Short Description about the microservices

This microservice consists of 3 endpoints 
- Get list of langauges used by 100 repos
- Get all repos list using a langauge 
- Get the number of repos using this language

### The Endpoints:

##### GET ALL Languages used by 100 repos

```
curl \
-X GET \
http://yourdomain:7878/api/list/languages
```

##### GET List of repos using a specific language

```
curl \
-X GET \
http://yourdomain:7878/api/list/repos?language=c++
```

##### GET List the repos count using a specific language
```
GET ALL Languages used by 100 repos
curl \
-X GET \
http://yourdomain:7878/api/list/repos/count?language=c++
```

#### How to run the server
- Make sure you installed node.js + npm 
- cd to the project folder
- Then run

```js 
node server.js
```


